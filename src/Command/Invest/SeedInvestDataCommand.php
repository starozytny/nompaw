<?php

namespace App\Command\Invest;

use App\Entity\Main\User;
use App\Service\Invest\InvestSeedService;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use RuntimeException;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * One-shot seed of Shanbo's (user_id=1) real positions as of 2026-11-04, from docs/INVEST_CONTEXT.md,
 * so the Invest module starts with real data instead of an empty page. Not meant to be run twice:
 * InvestSeedService aborts if the user already has an InEnveloppe. Same seed is also available from
 * the Invest page itself (useful on prod) via InvestSeedService — see InternApi\Invest\InvestController.
 */
#[AsCommand(
    name: 'app:invest:seed-initial-data',
    description: "Seed les positions d'investissement initiales de l'utilisateur 1 à partir de docs/INVEST_CONTEXT.md",
)]
class SeedInvestDataCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly InvestSeedService $seedService,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $user = $this->em->find(User::class, 1);
        if (!$user) {
            $io->error('Utilisateur 1 introuvable.');
            return Command::FAILURE;
        }

        try {
            $this->seedService->seedInitialData($user, new DateTime('2026-11-04'));
        } catch (RuntimeException $e) {
            $io->error($e->getMessage());
            return Command::FAILURE;
        }

        $io->success("Positions d'investissement initiales créées pour l'utilisateur 1.");
        return Command::SUCCESS;
    }
}
