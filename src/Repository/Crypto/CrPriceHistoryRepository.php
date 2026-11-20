<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrPriceHistory;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrPriceHistory>
 *
 * @method CrPriceHistory|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrPriceHistory|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrPriceHistory[]    findAll()
 * @method CrPriceHistory[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrPriceHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrPriceHistory::class);
    }

    public function save(CrPriceHistory $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByCoinAndDate(string $coin, \DateTimeInterface $date): ?CrPriceHistory
    {
        return $this->findOneBy([
            'coin' => $coin,
            'priceDate' => \DateTime::createFromInterface($date)->setTime(0, 0),
        ]);
    }

    /**
     * Bulk upsert of imported daily prices ([Y-m-d => EUR price]) in raw SQL — an ORM persist per row
     * would keep ~300k entities in the unit of work on a full backfill. An existing row is only replaced
     * when it's a 'failed' marker or a previous import from the same $source: 'manual' and 'coingecko'
     * rows are never overwritten.
     *
     * @param array<string, float> $pricesByDate
     */
    public function upsertImported(string $coin, array $pricesByDate, string $source): int
    {
        $conn = $this->getEntityManager()->getConnection();
        $now = (new \DateTimeImmutable())->format('Y-m-d H:i:s');
        $written = 0;

        foreach (array_chunk($pricesByDate, 500, true) as $chunk) {
            $values = [];
            $params = [];
            foreach ($chunk as $date => $price) {
                $values[] = '(?, ?, ?, ?, ?)';
                array_push($params, $coin, $date, $price, $source, $now);
            }

            $written += $conn->executeStatement(
                'INSERT INTO cr_price_history (coin, price_date, price_eur, source, fetched_at) VALUES ' . implode(', ', $values) . '
                 ON DUPLICATE KEY UPDATE
                    price_eur = IF(source IN (\'failed\', ?), VALUES(price_eur), price_eur),
                    fetched_at = IF(source IN (\'failed\', ?), VALUES(fetched_at), fetched_at),
                    source = IF(source IN (\'failed\', ?), VALUES(source), source)',
                [...$params, $source, $source, $source]
            );
        }

        return $written;
    }

    public function findLastDate(string $coin, string $source): ?\DateTimeImmutable
    {
        $date = $this->getEntityManager()->getConnection()->fetchOne(
            'SELECT MAX(price_date) FROM cr_price_history WHERE coin = ? AND source = ?',
            [$coin, $source]
        );

        return $date ? new \DateTimeImmutable($date) : null;
    }

    /**
     * Usable (non-'failed') prices for weekly sampling: Sundays only (the week-end sample day used by
     * CrStatsService), plus every day since $recentFrom so the "today" point has a fresh price.
     *
     * @param string[] $coins
     * @return array<string, array<string, float>> [coin][Y-m-d] => EUR price
     */
    public function findWeeklyPrices(array $coins, \DateTimeInterface $recentFrom): array
    {
        if ($coins === []) {
            return [];
        }

        $rows = $this->getEntityManager()->getConnection()->fetchAllAssociative(
            'SELECT coin, price_date, price_eur FROM cr_price_history
             WHERE coin IN (?) AND source <> \'failed\' AND (DAYOFWEEK(price_date) = 1 OR price_date >= ?)',
            [array_values($coins), $recentFrom->format('Y-m-d')],
            [\Doctrine\DBAL\ArrayParameterType::STRING, \Doctrine\DBAL\ParameterType::STRING]
        );

        $prices = [];
        foreach ($rows as $row) {
            $prices[$row['coin']][$row['price_date']] = (float) $row['price_eur'];
        }

        return $prices;
    }
}
