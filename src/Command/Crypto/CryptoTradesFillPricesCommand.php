<?php

namespace App\Command\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Service\Crypto\CrPriceService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Fills a trade's "prix unitaire cédé" (fromPrice) / "prix unitaire reçu" (toPrice) when null or 0, with
 * the coin's EUR price on the trade's day, else implied from the other leg (CrPriceService::resolveMissingPrices).
 * Only the empty side is written; totals are left alone. Cache-only by default: run app:crypto:prices:backfill first (Binance, full history);
 * --live also asks CoinGecko for what the cache lacks (rate-limited, 365 days max on the free key).
 */
#[AsCommand(
    name: 'app:crypto:trades:fill-prices',
    description: 'Renseigne les prix unitaires cédé/reçu vides (null ou 0) avec le cours EUR du jour',
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
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Affiche ce qui changerait sans rien écrire')
            ->addOption('live', null, InputOption::VALUE_NONE, 'Interroge aussi CoinGecko pour les cours absents du cache (lent)')
            ->addOption('user', null, InputOption::VALUE_REQUIRED, 'Limiter à un utilisateur (id)')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $live = (bool) $input->getOption('live');

        $qb = $this->em->createQueryBuilder()
            ->select('t')
            ->from(CrTrade::class, 't')
            ->where('t.fromPrice IS NULL OR t.fromPrice = 0 OR t.toPrice IS NULL OR t.toPrice = 0')
            ->orderBy('t.id', 'ASC');
        if ($input->getOption('user') !== null) {
            $qb->andWhere('t.user = :user')->setParameter('user', (int) $input->getOption('user'));
        }

        $filled = 0;
        $implied = 0;
        $trades = 0;
        $missing = [];
        $i = 0;

        foreach ($qb->getQuery()->toIterable() as $trade) {
            /** @var CrTrade $trade */
            $resolved = $this->priceService->resolveMissingPrices($trade, $live);
            foreach ($resolved['missing'] as $coin) {
                $missing[$coin] = ($missing[$coin] ?? 0) + 1;
            }

            foreach ($resolved['prices'] as $side => [$price, $how]) {
                if ($output->isVerbose()) {
                    $io->writeln(sprintf('  #%d %s %s %s : %s (%s)', $trade->getId(), $trade->getTradeAt()->format('Y-m-d'),
                        $side === 'from' ? 'cédé' : 'reçu', $side === 'from' ? $trade->getFromCoin() : $trade->getToCoin(), $price, $how));
                }
                if (!$dryRun) {
                    $side === 'from' ? $trade->setFromPrice($price) : $trade->setToPrice($price);
                }
                $filled++;
                if ($how === 'déduit') {
                    $implied++;
                }
            }
            $changed = $resolved['prices'] !== [];

            if ($changed) {
                $trades++;
            }
            if (!$dryRun && ++$i % self::BATCH_SIZE === 0) {
                $this->em->flush();
                $this->em->clear();
            }
        }

        if (!$dryRun) {
            $this->em->flush();
        }

        if ($missing !== []) {
            arsort($missing);
            $io->section('Cours introuvables' . ($live ? '' : ' dans le cache (lancer app:crypto:prices:backfill, ou --live)'));
            $io->table(['Token', 'Prix manquants'], array_map(null, array_keys($missing), array_values($missing)));
        }

        $io->success(sprintf('%s%d prix %s sur %d transaction(s) (dont %d déduits de l\'autre côté), %d introuvable(s).',
            $dryRun ? '[dry-run] ' : '', $filled, $dryRun ? 'à renseigner' : 'renseignés', $trades, $implied, array_sum($missing)));

        return Command::SUCCESS;
    }
}
