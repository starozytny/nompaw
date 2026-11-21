<?php

namespace App\Command\Crypto;

use App\Repository\Crypto\CrTradeRepository;
use App\Service\Crypto\CrCoinIconService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Downloads the icon of every traded coin into public/crypto-icons (see CrCoinIconService). Imports do it
 * for their new coins already; this is for the existing history, or --force to refresh them all.
 */
#[AsCommand(
    name: 'app:crypto:icons:download',
    description: 'Télécharge en local les icônes des cryptos tradées',
)]
class CryptoIconsDownloadCommand extends Command
{
    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly CrCoinIconService $iconService,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('force', null, InputOption::VALUE_NONE, 'Retélécharge aussi les icônes déjà présentes');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $force = (bool) $input->getOption('force');

        $counts = ['exists' => 0, 'downloaded' => 0, 'not-found' => 0, 'invalid' => 0];
        $notFound = [];
        foreach (array_keys($this->tradeRepository->findCoinFirstDates(null)) as $coin) {
            $status = $this->iconService->download($coin, $force);
            $counts[$status]++;
            if ($status === 'not-found') {
                $notFound[] = $coin;
            }
        }

        if ($notFound !== []) {
            $io->note('Introuvables (initiales affichées) : ' . implode(', ', $notFound));
        }
        $io->success(sprintf('%d téléchargée(s), %d déjà présente(s), %d introuvable(s).',
            $counts['downloaded'], $counts['exists'], $counts['not-found']));

        return Command::SUCCESS;
    }
}
