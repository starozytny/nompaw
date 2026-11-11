<?php

namespace App\Controller\Mcp;

use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Service\Budget\BudgetService;
use App\Service\Invest\InvestTrackingBuilder;
use App\Service\Running\RunningTrackingBuilder;
use Mcp\Server;
use Mcp\Server\Transport\StreamableHttpTransport;
use Symfony\Bridge\PsrHttpMessage\Factory\HttpFoundationFactory;
use Symfony\Bridge\PsrHttpMessage\Factory\PsrHttpFactory;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

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
    ): Response {
        /** @var User $user */
        $user = $this->getUser();

        $server = Server::builder()
            ->setServerInfo('Nompaw', '1.0.0')
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
            ->build();

        $psrHttpFactory = new PsrHttpFactory();
        $psrRequest = $psrHttpFactory->createRequest($request);

        $psrResponse = $server->run(new StreamableHttpTransport($psrRequest));

        return (new HttpFoundationFactory())->createResponse($psrResponse);
    }
}
