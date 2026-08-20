<?php

namespace App\Command\Crypto;

use App\Repository\Main\UserRepository;
use App\Service\Crypto\CrTaxReportService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Prints the computed crypto tax report for one user/year, to hand-verify the CrTaxReportService
 * formula against a manually-computed example BEFORE trusting it in the API/UI. See the disclaimer
 * in CrTaxReportService's class doc comment.
 */
#[AsCommand(
    name: 'admin:crypto:tax-report',
    description: 'Print the computed crypto capital-gains report for a user/year (verification tool)',
)]
class AdminCryptoTaxReportCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly CrTaxReportService $reportService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('userId', InputArgument::REQUIRED, 'ID user')
            ->addArgument('year', InputArgument::REQUIRED, 'Année (ex: 2025)')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $user = $this->userRepository->find((int) $input->getArgument('userId'));
        if (!$user) {
            $io->error('Utilisateur introuvable.');

            return Command::FAILURE;
        }

        $year = (int) $input->getArgument('year');
        $report = $this->reportService->computeReport($user, $year);

        if (empty($report['lines'])) {
            $io->warning("Aucune vente trouvée pour l'année $year.");

            return Command::SUCCESS;
        }

        $io->title("Rapport fiscal $year — {$user->getEmail()}");

        $rows = [];
        foreach ($report['lines'] as $line) {
            $rows[] = [
                $line['tradeAt'],
                $line['fromCoin'],
                $line['fromNbToken'],
                number_format($line['cessionPrice'], 2, ',', ' ') . ' €',
                number_format($line['cumulativeAcquisitionCost'], 2, ',', ' ') . ' €',
                $line['portfolioValue'] !== null ? number_format($line['portfolioValue'], 2, ',', ' ') . ' €' : 'MANQUANT',
                $line['portfolioValueSource'] ?? ('à renseigner : ' . implode(', ', $line['missingCoins'])),
                $line['plusValue'] !== null ? number_format($line['plusValue'], 2, ',', ' ') . ' €' : 'N/A',
            ];
        }

        $io->table(
            ['Date', 'Coin', 'Quantité', 'Prix cession', 'Coût acquis. cumulé', 'Valeur portefeuille', 'Source', 'Plus-value'],
            $rows
        );

        $io->writeln(sprintf('<info>Total plus-value %d : %s €</info>', $year, number_format($report['totalPlusValue'], 2, ',', ' ')));
        if ($report['hasMissingValues']) {
            $io->warning('Certaines lignes ont une valeur de portefeuille manquante et ne sont pas incluses dans le total ci-dessus.');
        }

        return Command::SUCCESS;
    }
}
