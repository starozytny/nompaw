<?php

namespace App\Command\Crypto;

use App\Repository\Main\UserRepository;
use App\Service\Crypto\CrStatsService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Fills the shared CrPriceHistory cache with Binance daily prices for every traded coin (see
 * CrPriceService::importDailyHistory()). Incremental: safe to re-run, only fetches missing days.
 */
#[AsCommand(
    name: 'app:crypto:prices:backfill',
    description: 'Importe les cours journaliers EUR (Binance) de toutes les cryptos tradées',
)]
class CryptoPricesBackfillCommand extends Command
{
    public function __construct(
        private readonly CrStatsService $statsService,
        private readonly UserRepository $userRepository,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('coin', null, InputOption::VALUE_REQUIRED, 'Un seul ticker (ex: BTC)')
            ->addOption('user', null, InputOption::VALUE_REQUIRED, 'Limiter aux cryptos d\'un utilisateur (id)')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $user = null;
        if ($input->getOption('user') !== null) {
            $user = $this->userRepository->find((int) $input->getOption('user'));
            if ($user === null) {
                $io->error('Utilisateur introuvable.');

                return Command::FAILURE;
            }
        }

        $written = $this->statsService->refreshPrices($user, $input->getOption('coin'), function (string $coin, int $rows) use ($io) {
            $io->writeln(sprintf('  %-8s %s', $coin, $rows > 0 ? "$rows lignes" : '<comment>aucun cours</comment>'));
        });

        $io->success(sprintf('%d cryptos traitées, %d lignes écrites, %d sans cours Binance.',
            count($written), array_sum($written), count(array_filter($written, fn (int $n) => $n === 0))));

        return Command::SUCCESS;
    }
}
