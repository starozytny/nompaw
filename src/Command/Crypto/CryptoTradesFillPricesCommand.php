<?php

namespace App\Command\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Service\Crypto\CrPriceService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\QueryBuilder;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Fills a trade's empty (null/0) "prix unitaire cédé/reçu" and "total réel" (CrPriceService::fillMissingValues:
 * day price, else implied from the other leg; total = EUR value received). Reads the price cache only —
 * run app:crypto:prices:backfill first (Binance, free, full history).
 *
 * --live first fetches from CoinGecko what the cache lacks, ONE market_chart/range call per coin over the
 * days needed (1 credit per coin and per run, not per day), spaced for the 100 calls/min limit and capped
 * by --max-calls to protect the monthly credits. Run it year by year (--year) to spread the budget.
 */
#[AsCommand(
    name: 'app:crypto:trades:fill-prices',
    description: 'Renseigne les prix unitaires cédé/reçu et le total réel vides avec le cours EUR du jour',
)]
class CryptoTradesFillPricesCommand extends Command
{
    private const BATCH_SIZE = 500;

    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly CrPriceService $priceService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('year', null, InputOption::VALUE_REQUIRED, 'Limiter à une année (ex: 2024)')
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Affiche ce qui changerait sans rien écrire')
            ->addOption('live', null, InputOption::VALUE_NONE, 'Récupère d\'abord sur CoinGecko les cours absents du cache')
            ->addOption('max-calls', null, InputOption::VALUE_REQUIRED, 'Crédits CoinGecko max pour ce lancement (--live)', '200')
            ->addOption('user', null, InputOption::VALUE_REQUIRED, 'Limiter à un utilisateur (id)')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');

        $year = $input->getOption('year');
        if ($year !== null && !preg_match('/^(19|20)\d{2}$/', $year)) {
            $io->error('Année invalide (ex: --year=2024).');

            return Command::INVALID;
        }

        if ($input->getOption('live')) {
            $this->fetchMissingFromCoinGecko($io, $this->query($input), max(0, (int) $input->getOption('max-calls')));
        }

        $filled = 0;
        $bySource = [];
        $totals = 0;
        $trades = 0;
        $missing = [];
        $i = 0;

        foreach ($this->query($input)->getQuery()->toIterable() as $trade) {
            /** @var CrTrade $trade */
            // Dry-run mutates the managed entities too, it just never flushes them.
            $result = $this->priceService->fillMissingValues($trade);
            foreach ($result['missing'] as $coin) {
                $missing[$coin] = ($missing[$coin] ?? 0) + 1;
            }

            foreach ($result['prices'] as $side => [$price, $how]) {
                if ($output->isVerbose()) {
                    $io->writeln(sprintf('  #%d %s %s %s : %s (%s)', $trade->getId(), $trade->getTradeAt()->format('Y-m-d'),
                        $side === 'from' ? 'cédé' : 'reçu', $side === 'from' ? $trade->getFromCoin() : $trade->getToCoin(), $price, $how));
                }
                $filled++;
                $bySource[$how] = ($bySource[$how] ?? 0) + 1;
            }
            if ($result['totalReal'] !== null) {
                $totals++;
                if ($output->isVerbose()) {
                    $io->writeln(sprintf('  #%d total réel : %s €', $trade->getId(), $result['totalReal']));
                }
            }

            if ($result['prices'] !== [] || $result['totalReal'] !== null) {
                $trades++;
            }
            if (++$i % self::BATCH_SIZE === 0) {
                if (!$dryRun) {
                    $this->em->flush();
                }
                $this->em->clear();
            }
        }

        if (!$dryRun) {
            $this->em->flush();
        }

        if ($missing !== []) {
            arsort($missing);
            $top = array_slice($missing, 0, 25, true);
            $io->section('Cours introuvables' . (count($missing) > 25 ? ' (25 premiers)' : ''));
            $io->table(['Token', 'Prix manquants'], array_map(null, array_keys($top), array_values($top)));
        }

        $sources = implode(', ', array_map(fn ($how, $n) => "$how : $n", array_keys($bySource), $bySource));
        $io->success(sprintf('%s%s%d prix (%s) et %d total(aux) réel(s) %s sur %d transaction(s), %d prix introuvable(s).',
            $dryRun ? '[dry-run] ' : '', $year ? "$year : " : '', $filled, $sources ?: 'aucun', $totals,
            $dryRun ? 'à renseigner' : 'renseignés', $trades, array_sum($missing)));

        return Command::SUCCESS;
    }

    /** Trades with an empty price, or an empty total réel on a type that gets one. */
    private function query(InputInterface $input): QueryBuilder
    {
        $qb = $this->em->createQueryBuilder()
            ->select('t')
            ->from(CrTrade::class, 't')
            ->where('t.fromPrice IS NULL OR t.fromPrice = 0 OR t.toPrice IS NULL OR t.toPrice = 0
                     OR ((t.totalReal IS NULL OR t.totalReal = 0) AND t.type IN (:totalTypes))')
            ->setParameter('totalTypes', CrPriceService::TOTAL_TYPES)
            ->orderBy('t.id', 'ASC');
        if ($input->getOption('user') !== null) {
            $qb->andWhere('t.user = :user')->setParameter('user', (int) $input->getOption('user'));
        }
        if (($year = $input->getOption('year')) !== null) {
            $qb->andWhere('t.tradeAt >= :start AND t.tradeAt < :end')
                ->setParameter('start', new \DateTimeImmutable("$year-01-01"))
                ->setParameter('end', new \DateTimeImmutable(((int) $year + 1) . '-01-01'));
        }

        return $qb;
    }

    /**
     * Cache-only pass to list, per coin, the days still without a price, then one CoinGecko range call
     * per coin over [first, last] of those days — stops when the --max-calls budget is spent.
     */
    private function fetchMissingFromCoinGecko(SymfonyStyle $io, QueryBuilder $qb, int $maxCalls): void
    {
        $needed = [];
        foreach ($qb->getQuery()->toIterable() as $trade) {
            /** @var CrTrade $trade */
            foreach ([[$trade->getFromCoin(), $trade->getFromPrice()], [$trade->getToCoin(), $trade->getToPrice()]] as [$coin, $price]) {
                $coin = strtoupper((string) $coin);
                if ($coin === '' || $coin === 'EUR' || (float) $price != 0.0
                    || $this->priceService->getPriceEur($coin, $trade->getTradeAt(), false) !== null) {
                    continue;
                }
                $day = $trade->getTradeAt()->format('Y-m-d');
                $needed[$coin] = [min($needed[$coin][0] ?? $day, $day), max($needed[$coin][1] ?? $day, $day)];
            }
        }
        $this->em->clear();

        if ($needed === []) {
            $io->writeln('CoinGecko : rien à récupérer, le cache couvre tout.');

            return;
        }

        $io->section(sprintf('CoinGecko : %d crypto(s) à récupérer (1 crédit chacune, max %d)', count($needed), $maxCalls));
        $start = $this->priceService->coingeckoCalls;
        foreach ($needed as $coin => [$from, $to]) {
            if ($this->priceService->coingeckoCalls - $start >= $maxCalls) {
                $io->warning(sprintf('Budget de %d crédits atteint : relance pour la suite.', $maxCalls));
                break;
            }
            $result = $this->priceService->importCoinGeckoRange($coin, new \DateTimeImmutable($from), new \DateTimeImmutable($to));
            $io->writeln(sprintf('  %-10s %s → %s : %s', $coin, $from, $to, is_int($result) ? "$result jours" : "<comment>$result</comment>"));
        }
        $io->writeln(sprintf('Crédits CoinGecko utilisés : %d', $this->priceService->coingeckoCalls - $start));
    }
}
