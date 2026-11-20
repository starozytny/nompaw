<?php

namespace App\Command\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Service\Crypto\Import\BinanceEurTotals;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * One-off backfill for Binance Achat/Vente imported before BinanceEurTotals existed: the CSV parsers
 * stored totalReal/total = 0 even for EUR pairs, and the API sync stored the quote amount (often USDT)
 * as if it were euros. Re-imports can't fix them (existing importedIds are skipped as duplicates).
 *
 * Only rewrites a trade whose totals are still exactly what the old importer produced — anything else
 * is assumed to have been corrected by hand and is left alone (listed, unless --force).
 */
#[AsCommand(
    name: 'app:crypto:binance:fix-totals',
    description: 'Recalcule le total réel EUR des achats/ventes Binance déjà importés',
)]
class CryptoBinanceFixTotalsCommand extends Command
{
    private const SOURCE_CSV = 'Binance';
    private const SOURCE_API = 'Binance API';
    private const EPSILON = 0.000001;
    private const BATCH_SIZE = 500;

    public function __construct(private readonly EntityManagerInterface $em)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('dry-run', null, InputOption::VALUE_NONE, 'Affiche ce qui changerait sans rien écrire')
            ->addOption('force', null, InputOption::VALUE_NONE, 'Écrase aussi les totaux modifiés à la main')
            ->addOption('user', null, InputOption::VALUE_REQUIRED, 'Limiter à un utilisateur (id)')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = (bool) $input->getOption('dry-run');
        $force = (bool) $input->getOption('force');

        $qb = $this->em->createQueryBuilder()
            ->select('t')
            ->from(CrTrade::class, 't')
            ->where('t.importedFrom IN (:sources)')
            ->andWhere('t.type IN (:types)')
            ->setParameter('sources', [self::SOURCE_CSV, self::SOURCE_API])
            ->setParameter('types', [TypeType::Achat, TypeType::Vente])
            ->orderBy('t.id', 'ASC');
        if ($input->getOption('user') !== null) {
            $qb->andWhere('t.user = :user')->setParameter('user', (int) $input->getOption('user'));
        }

        $updated = 0;
        $unchanged = 0;
        $skipped = [];
        $i = 0;

        foreach ($qb->getQuery()->toIterable() as $trade) {
            /** @var CrTrade $trade */
            $expected = BinanceEurTotals::compute(
                $trade->getType(), $trade->getFromCoin(), (float) $trade->getFromNbToken(), $trade->getToCoin(),
                $trade->getToNbToken(), (float) $trade->getCostPrice(), (string) $trade->getCostCoin()
            );
            $currentReal = (float) $trade->getTotalReal();
            $current = (float) $trade->getTotal();

            if ($this->same($currentReal, $expected['totalReal']) && $this->same($current, $expected['total'])) {
                $unchanged++;
                continue;
            }

            if (!$force && !$this->isUntouchedImport($trade, $currentReal, $current)) {
                $skipped[] = [$trade->getId(), $trade->getTradeAt()->format('Y-m-d'), $trade->getFromCoin() . ' → ' . $trade->getToCoin(),
                    sprintf('%.2f / %.2f', $currentReal, $current), sprintf('%.2f / %.2f', $expected['totalReal'], $expected['total'])];
                continue;
            }

            if ($output->isVerbose()) {
                $io->writeln(sprintf('  #%d %s %s→%s : %.2f/%.2f → %.2f/%.2f', $trade->getId(), $trade->getTradeAt()->format('Y-m-d'),
                    $trade->getFromCoin(), $trade->getToCoin(), $currentReal, $current, $expected['totalReal'], $expected['total']));
            }

            if (!$dryRun) {
                $trade->setTotalReal($expected['totalReal'])->setTotal($expected['total']);
                if (++$i % self::BATCH_SIZE === 0) {
                    $this->em->flush();
                    $this->em->clear();
                }
            }
            $updated++;
        }

        if (!$dryRun) {
            $this->em->flush();
        }

        if ($skipped !== []) {
            $io->section(sprintf('%d trade(s) ignoré(s) : totaux déjà modifiés à la main (relancer avec --force pour les écraser)', count($skipped)));
            $io->table(['Id', 'Date', 'Paire', 'Actuel (réel / total)', 'Calculé (réel / total)'], $skipped);
        }

        $io->success(sprintf('%s%d trade(s) %s, %d déjà corrects, %d ignorés.',
            $dryRun ? '[dry-run] ' : '', $updated, $dryRun ? 'à corriger' : 'corrigés', $unchanged, count($skipped)));

        return Command::SUCCESS;
    }

    /**
     * True when the totals are still exactly what the pre-fix importer wrote: 0/0 from the CSV parsers,
     * or quoteQty/quoteQty from the API sync (the non-base side: fromNbToken on a buy, toNbToken on a sell).
     */
    private function isUntouchedImport(CrTrade $trade, float $currentReal, float $current): bool
    {
        if ($trade->getImportedFrom() === self::SOURCE_CSV) {
            return $this->same($currentReal, 0.0) && $this->same($current, 0.0);
        }

        $quoteQty = $trade->getType() === TypeType::Achat ? (float) $trade->getFromNbToken() : (float) $trade->getToNbToken();

        return $this->same($currentReal, $quoteQty) && $this->same($current, $quoteQty);
    }

    private function same(float $a, float $b): bool
    {
        return abs($a - $b) < self::EPSILON;
    }
}
