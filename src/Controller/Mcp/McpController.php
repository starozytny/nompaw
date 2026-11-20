<?php

namespace App\Controller\Mcp;

use App\Entity\Main\User;
use App\Entity\Rando\RaSuggestion;
use App\Entity\Rando\RaSuggestionTrace;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Repository\Rando\RaSuggestionRepository;
use App\Entity\Crypto\CrTrade;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Budget\BudgetService;
use App\Service\Crypto\CrStatsService;
use App\Service\Crypto\CrTaxReportService;
use App\Service\Crypto\CrTradeReplayService;
use App\Service\Data\DataRandos;
use App\Service\Invest\InvestTrackingBuilder;
use App\Service\Rando\GpxService;
use App\Service\Running\RunningTrackingBuilder;
use Mcp\Server;
use Psr\Log\LoggerInterface;
use Mcp\Server\Transport\Http\Middleware\CorsMiddleware;
use Mcp\Server\Transport\Http\Middleware\DnsRebindingProtectionMiddleware;
use Mcp\Server\Transport\StreamableHttpTransport;
use Symfony\Bridge\PsrHttpMessage\Factory\HttpFoundationFactory;
use Symfony\Bridge\PsrHttpMessage\Factory\PsrHttpFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\String\Slugger\AsciiSlugger;

/**
 * The MCP resource server: one Streamable HTTP endpoint exposing the three read-only "bilan"
 * tools. Authentication is entirely Symfony's own job (the `mcp` firewall, `jwt: ~`, validating
 * the same Lexik JWT the OAuth token endpoint issues) — mcp/sdk itself only acts as a resource
 * server for the protocol, not for auth (see its ADR 0001/0002), so no SDK-side token checking
 * is wired in here; by the time this action runs, $this->getUser() is already resolved and
 * role-gating below is the same isGranted() check the equivalent InternApi controllers use.
 */
class McpController extends AbstractController
{
    #[Route('/mcp', name: 'mcp_endpoint', methods: ['GET', 'POST', 'DELETE'])]
    public function __invoke(
        Request $request,
        RunningTrackingBuilder $runningTrackingBuilder,
        InvestTrackingBuilder $investTrackingBuilder,
        BudgetService $budgetService,
        BuItemRepository $buItemRepository,
        BuRecurrentRepository $buRecurrentRepository,
        BuCategoryRepository $buCategoryRepository,
        SerializerInterface $serializer,
        DataRandos $dataRandos,
        RaSuggestionRepository $suggestionRepository,
        GpxService $gpxService,
        CrTaxReportService $taxReportService,
        CrTradeRepository $tradeRepository,
        CrTradeReplayService $replayService,
        CrStatsService $statsService,
        LoggerInterface $logger,
    ): Response {
        /** @var User $user */
        $user = $this->getUser();

        $server = Server::builder()
            ->setServerInfo('Nompaw', '1.0.0')
            // Without it the SDK swallows tool exceptions into a bare -32603 with nothing in var/log.
            ->setLogger($logger)
            ->addTool(
                function () use ($runningTrackingBuilder, $user): array {
                    if (!$this->isGranted('ROLE_RUNNING')) {
                        throw $this->createAccessDeniedException('Le module Running n\'est pas activé pour ce compte.');
                    }

                    return $runningTrackingBuilder->build($user);
                },
                name: 'get_running_bilan',
                description: 'Historique complet de suivi running (séances, activités Garmin, poids, notes) pour analyse.',
            )
            ->addTool(
                function () use ($investTrackingBuilder, $user): array {
                    if (!$this->isGranted('ROLE_INVEST')) {
                        throw $this->createAccessDeniedException('Le module Investissements n\'est pas activé pour ce compte.');
                    }

                    return $investTrackingBuilder->build($user);
                },
                name: 'get_invest_bilan',
                description: 'Positions, lignes, valorisations et versements (couplés au budget) des enveloppes d\'investissement, pour analyse.',
            )
            ->addTool(
                function (?int $year = null) use ($budgetService, $buItemRepository, $buRecurrentRepository, $buCategoryRepository, $serializer, $user): array {
                    $year ??= (int) (new \DateTime())->format('Y');
                    if ($year < $user->getBudgetYear()) {
                        $year = $user->getBudgetYear();
                    }

                    return $budgetService->getData($serializer, $user, $year, $buItemRepository, $buRecurrentRepository, $buCategoryRepository);
                },
                name: 'get_budget_bilan',
                description: 'Bilan du planificateur budgétaire (dépenses, revenus, épargne, catégories) pour une année donnée, pour analyse.',
            )
            ->addTool(
                function () use ($statsService, $user): array {
                    $stats = $statsService->build($user);
                    // Monthly (last sample of each month) instead of weekly, to keep the payload small.
                    $monthly = [];
                    foreach ($stats['series'] as $point) {
                        $monthly[substr($point['date'], 0, 7)] = $point;
                    }

                    return [
                        'kpis' => $stats['kpis'],
                        'topCoins' => $stats['coins'],
                        'monthlySeries' => array_values($monthly),
                        'allocation' => array_values(array_filter($stats['allocation'], fn (array $a) => ($a['value'] ?? 0) >= 1)),
                    ];
                },
                name: 'get_crypto_stats',
                description: 'Statistiques du portefeuille crypto : kpis (value = valeur des cryptos en €, cash = € restés sur les plateformes, invested = dépôts − retraits, result = value + cash − invested, unpricedCoins = cryptos détenues sans cours), '
                    . 'monthlySeries (fin de chaque mois : total, invested, valeur par crypto des topCoins + Autres) et allocation actuelle (quantité, prix, valeur, % ; lignes < 1 € omises). '
                    . 'Cours journaliers Binance (ouverture du jour, convertis en €). Pour le détail d\'une crypto, utilise get_crypto_coin_ledger.',
            )
            ->addTool(
                function () use ($replayService, $user): array {
                    $out = [];
                    foreach ($replayService->findIssues(null, $user) as $issue) {
                        $ledger = $replayService->coinLedger($user, $issue['coin']);
                        $rootIndex = array_search($issue['rootId'], array_column($ledger, 'id'), true);
                        // shortcut: fixed window around the cause (LINK has 400+ red rows); dig further with get_crypto_coin_ledger.
                        $issue['context'] = array_slice($ledger, max(0, $rootIndex - 15), 21);
                        $issue['ledgerSize'] = count($ledger);
                        $out[] = $issue;
                    }

                    return $out;
                },
                name: 'get_crypto_issues',
                description: 'Incohérences de l\'historique crypto : pour chaque coin dont le solde devient négatif (vente/achat/retrait sans les fonds), '
                    . 'la cause (rootId = première opération qui fait passer le solde sous zéro), maxDeficit (quantité minimale à ajouter avant la cause pour supprimer toutes ses lignes rouges), '
                    . 'kind (hypothèse : deposit, reward, transfer), count (opérations en rouge), endAt (null = toujours négatif aujourd\'hui), '
                    . 'et context : les 15 opérations de ce coin avant la cause et 5 après, avec balanceAfter. '
                    . 'Règles de solde : Achat débite fromCoin et crédite toCoin ; Vente débite fromCoin et crédite toCoin ; Dépôt crédite toCoin ; Retrait débite fromCoin ; Récupération/Stacking créditent fromCoin ; Transfert et À catégoriser n\'ont aucun effet. Tous les coins sont suivis, EUR compris, toutes plateformes confondues. '
                    . 'Pour expliquer une incohérence, cherche ce qui manque avant la cause : transfert depuis une autre plateforme non importé, plateforme jamais connectée (comparer le champ platform), '
                    . 'récompenses/airdrops/staking non importés, opération À catégoriser ou Transfert qui aurait dû être un Dépôt, conversion (ex. ETH→BETH) importée d\'un seul côté. Ne modifie rien : c\'est un outil d\'analyse.',
            )
            ->addTool(
                function (string $coin, ?string $from = null, ?string $to = null, int $limit = 200) use ($replayService, $user): array {
                    $ledger = $replayService->coinLedger($user, $coin);
                    $ledger = array_values(array_filter($ledger, fn (array $row) => ($from === null || $row['tradeAt'] >= $from) && ($to === null || substr($row['tradeAt'], 0, 10) <= $to)));

                    return ['coin' => strtoupper($coin), 'total' => count($ledger), 'trades' => array_slice($ledger, 0, max(1, min($limit, 500)))];
                },
                name: 'get_crypto_coin_ledger',
                description: 'Toutes les opérations d\'un coin (fromCoin ou toCoin), chronologiques, avec le solde du coin après chaque opération (balanceAfter, négatif = incohérent), '
                    . 'la plateforme d\'origine et la catégorie brute pour les opérations À catégoriser. from/to : dates ISO (YYYY-MM-DD) optionnelles ; limit : 200 par défaut, 500 max (total indique combien existent). '
                    . 'Règles de solde : Achat débite fromCoin et crédite toCoin ; Vente débite fromCoin et crédite toCoin ; Dépôt crédite toCoin ; Retrait débite fromCoin ; Récupération/Stacking créditent fromCoin ; Transfert et À catégoriser n\'ont aucun effet. Tous les coins sont suivis, EUR compris, toutes plateformes confondues.',
            )
            ->addTool(
                function (int $year) use ($taxReportService, $user): array {
                    // Cache-only (no CoinGecko round trips: the AI supplies what's missing) and a single
                    // history replay for all lines — both needed to answer within the client's timeout.
                    $report = $taxReportService->computeReport($user, $year, false, true);
                    $out = [];
                    foreach ($report['lines'] as $line) {
                        if ($line['missingCoins'] === []) {
                            continue;
                        }
                        $out[] = [
                            'tradeId' => $line['id'],
                            'date' => $line['tradeAt'] . ' ' . $line['tradeTime'],
                            'soldCoin' => $line['fromCoin'],
                            'soldQuantity' => $line['fromNbToken'],
                            'cessionPriceEur' => $line['cessionPrice'],
                            'missingCoins' => $line['missingCoins'],
                            'holdingsBefore' => $line['holdingsBefore'],
                        ];
                    }

                    return $out;
                },
                name: 'get_crypto_missing_prices',
                description: 'Cessions crypto→EUR d\'une année dont la valeur du portefeuille (formulaire 2086) est incomplète : pour chacune, les coins détenus juste avant (quantité, prix EUR connu ou null) et missingCoins. '
                    . 'Procède dans l\'ordre chronologique (années les plus anciennes d\'abord) : un prix manquant fausse le prix d\'acquisition des cessions suivantes. Rappelle l\'outil après chaque lot pour voir ce qui reste.',
            )
            ->addTool(
                function (int $tradeId, array $prices) use ($taxReportService, $tradeRepository, $user): array {
                    $trade = $this->ownedTrade($tradeId, $user, $tradeRepository);
                    if ($trade->getType() !== \App\Entity\Enum\Crypto\TypeType::Vente) {
                        throw new \RuntimeException('Seule une vente a un portefeuille à valoriser.');
                    }
                    $clean = [];
                    foreach ($prices as $coin => $price) {
                        if (!is_numeric($price) || (float) $price <= 0) {
                            throw new \RuntimeException("Prix invalide pour $coin.");
                        }
                        $clean[(string) $coin] = (float) $price;
                    }

                    return $taxReportService->saveManualPrices($trade, $clean, 'ia');
                },
                name: 'set_crypto_disposal_prices',
                description: 'Renseigne le prix unitaire en EUR de chaque coin détenu au moment d\'une cession (tradeId vient de get_crypto_missing_prices). '
                    . 'prices = objet {"BTC": 42000.5, "ETH": 2300}, prix du coin à la date/heure de la cession. Premier jet : estime au mieux (cours historiques trouvés sur le web), ne mets rien si tu ne trouves pas de source ; l\'utilisateur relit et corrige. '
                    . 'Retourne la ligne 2086 recalculée.',
            )
            ->addTool(
                function () use ($suggestionRepository, $user): array {
                    return array_map(fn (RaSuggestion $s) => [
                        'id' => $s->getId(),
                        'name' => $s->getName(),
                        'type' => $s->getType()?->value,
                        'location' => $s->getLocation(),
                        'latitude' => $s->getLatitude(),
                        'longitude' => $s->getLongitude(),
                        'sourceUrl' => $s->getSourceUrl(),
                        'traces' => $s->getTraces()->map(fn (RaSuggestionTrace $t) => $t->getName())->getValues(),
                    ], $suggestionRepository->findAllByUser($user));
                },
                name: 'list_suggestions',
                description: 'Liste les randonnées/bivouacs déjà suggérés (nom, lieu, coordonnées, source) pour éviter de reproposer un doublon.',
            )
            ->addTool(
                function (int $suggestionId, string $name, ?string $gpxUrl = null, ?string $gpxContent = null) use ($gpxService, $suggestionRepository, $user): array {
                    $suggestion = $suggestionRepository->find($suggestionId);
                    if ($suggestion === null || $suggestion->getAuthor() !== $user) {
                        throw new \RuntimeException("Suggestion $suggestionId introuvable.");
                    }
                    if (($gpxUrl === null) === ($gpxContent === null)) {
                        throw new \RuntimeException('Fournis exactement un des deux : gpxUrl ou gpxContent.');
                    }

                    try {
                        $xml = $gpxUrl !== null ? $gpxService->download($gpxUrl) : $gpxContent;
                        $trace = $gpxService->addTrace($suggestion, $name, $xml, RaSuggestionTrace::SOURCE_AI);
                    } catch (\InvalidArgumentException $e) {
                        throw new \RuntimeException($e->getMessage());
                    }

                    return ['id' => $trace->getId(), 'name' => $trace->getName(), 'distanceKm' => $trace->getDistanceKm(), 'elevationGainM' => $trace->getElevationGainM()];
                },
                name: 'add_suggestion_trace',
                description: 'Ajoute une trace GPX (itinéraire) à une suggestion existante (suggestionId vient de list_suggestions ou propose_rando). '
                    . 'Fournis soit gpxUrl (lien direct vers un fichier .gpx public, téléchargé par le serveur), soit gpxContent (le texte XML du GPX). '
                    . 'Appelle plusieurs fois pour proposer plusieurs variantes de parcours (nom explicite, ex. « Boucle classique », « Variante par la crête »). '
                    . 'Le fichier doit être un vrai GPX (balises trkpt/rtept avec lat/lon, idéalement <ele>) : n\'invente jamais de coordonnées.',
            )
            ->addTool(
                function (
                    string $name,
                    int $type,
                    int $difficulty,
                    ?string $description = null,
                    ?string $location = null,
                    ?float $latitude = null,
                    ?float $longitude = null,
                    ?float $distanceKm = null,
                    ?int $elevationGainM = null,
                    ?int $altitudeMaxM = null,
                    ?int $durationMinutes = null,
                    array $pointsOfInterest = [],
                    array $photoUrls = [],
                    ?string $sourceUrl = null,
                    ?string $parkRules = null,
                    ?int $travelTimeFromPeyrollesMinutes = null,
                    ?float $travelBudget = null,
                    ?float $randoBudget = null,
                ) use ($dataRandos, $suggestionRepository, $user): array {
                    $data = (object) [
                        'name' => $name,
                        'type' => $type,
                        'difficulty' => $difficulty,
                        'description' => $description,
                        'location' => $location,
                        'latitude' => $latitude,
                        'longitude' => $longitude,
                        'distanceKm' => $distanceKm,
                        'elevationGainM' => $elevationGainM,
                        'altitudeMaxM' => $altitudeMaxM,
                        'durationMinutes' => $durationMinutes,
                        'pointsOfInterest' => $pointsOfInterest,
                        'photoUrls' => $photoUrls,
                        'sourceUrl' => $sourceUrl,
                        'parkRules' => $parkRules,
                        'travelTimeFromPeyrollesMinutes' => $travelTimeFromPeyrollesMinutes,
                        'travelBudget' => $travelBudget,
                        'randoBudget' => $randoBudget,
                    ];

                    $suggestion = $dataRandos->setDataSuggestion((new RaSuggestion())->setAuthor($user), $data);

                    $slugger = new AsciiSlugger('fr');
                    $duplicate = $suggestionRepository->findDuplicate($user, $suggestion, strtolower($slugger->slug((string) $suggestion->getName())->toString()));
                    if ($duplicate !== null) {
                        throw new \RuntimeException(sprintf(
                            'Doublon refusé : la suggestion « %s » (id %d) existe déjà. Appelle list_suggestions avant de proposer et choisis un autre lieu.',
                            $duplicate->getName(),
                            $duplicate->getId()
                        ));
                    }

                    $suggestionRepository->save($suggestion, true);

                    return ['id' => $suggestion->getId(), 'name' => $suggestion->getName()];
                },
                name: 'propose_rando',
                description: 'Propose une idée de randonnée ou de bivouac, visible ensuite sur /espace-membre/suggestions. '
                    . 'TOUJOURS appeler list_suggestions avant : un doublon (même nom, même sourceUrl ou lieu à moins de 300 m) est refusé. '
                    . 'type: 0=Randonnée, 1=Bivouac. difficulty: 0=Facile, 1=Modéré, 2=Difficile, 3=Expert. '
                    . 'latitude/longitude: coordonnées GPS décimales (WGS84) du point de départ du sentier ou du lieu de bivouac, ex 45.2167 / 6.5833. '
                    . 'travelTimeFromPeyrollesMinutes est le temps de trajet depuis Peyrolles-en-Provence (13860). '
                    . 'travelBudget et randoBudget sont en euros (trajet et activité/entrée). photoUrls sont des URLs publiques trouvées sur le web, pas des fichiers.',
            )
            ->build();

        $psrHttpFactory = new PsrHttpFactory();
        $psrRequest = $psrHttpFactory->createRequest($request);

        // The default DnsRebindingProtectionMiddleware only allows a localhost Host header, which
        // is right for a server run on someone's machine but wrong here: Symfony's `jwt: ~`
        // firewall already authenticated this request with a token scoped to /mcp (see
        // McpOauthService / McpTokenScopeListener), so the Host/Origin check below would just
        // reject every real request from claude.ai's servers for no added safety.
        $transport = new StreamableHttpTransport($psrRequest, middleware: [
            new CorsMiddleware(),
            new DnsRebindingProtectionMiddleware(allowedHosts: ['*'], allowedOrigins: ['*']),
        ]);

        $psrResponse = $server->run($transport);

        return (new HttpFoundationFactory())->createResponse($psrResponse);
    }

    private function ownedTrade(int $id, User $user, CrTradeRepository $repository): CrTrade
    {
        $trade = $repository->find($id);
        if ($trade === null || $trade->getUser() !== $user) {
            throw new \RuntimeException("Transaction $id introuvable.");
        }

        return $trade;
    }
}
