<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrTrade>
 *
 * @method CrTrade|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrTrade|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrTrade[]    findAll()
 * @method CrTrade[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrTradeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrTrade::class);
    }

    public function save(CrTrade $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(CrTrade $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Distinct import sources (CrTrade::importedFrom) ever used by $user — powers the "plateforme" filter
     * without needing the full trade history client-side.
     *
     * @return string[]
     */
    public function findDistinctPlatforms(User $user): array
    {
        return array_column(
            $this->createQueryBuilder('c')
                ->select('DISTINCT c.importedFrom AS platform')
                ->andWhere('c.user = :user')
                ->andWhere('c.importedFrom IS NOT NULL')
                ->setParameter('user', $user)
                ->orderBy('platform', 'ASC')
                ->getQuery()
                ->getScalarResult(),
            'platform'
        );
    }

    /**
     * Distinct coin tickers (fromCoin/toCoin) ever used by $user — powers the "token" filter without
     * needing the full trade history client-side.
     *
     * @return string[]
     */
    public function findDistinctTokens(User $user): array
    {
        $fromCoins = array_column(
            $this->createQueryBuilder('c')
                ->select('DISTINCT c.fromCoin AS coin')
                ->andWhere('c.user = :user')
                ->setParameter('user', $user)
                ->getQuery()
                ->getScalarResult(),
            'coin'
        );

        $toCoins = array_column(
            $this->createQueryBuilder('c')
                ->select('DISTINCT c.toCoin AS coin')
                ->andWhere('c.user = :user')
                ->setParameter('user', $user)
                ->getQuery()
                ->getScalarResult(),
            'coin'
        );

        $tokens = array_unique(array_merge($fromCoins, $toCoins));
        sort($tokens);

        return $tokens;
    }

    /**
     * Whether $user has at least one trade not attached to an import (CrTrade::importedFrom is null) —
     * powers the "Manuel (non importé)" filter option, only shown when it would actually match something.
     */
    public function hasManualEntry(User $user): bool
    {
        return (bool) $this->createQueryBuilder('c')
            ->select('1')
            ->andWhere('c.user = :user')
            ->andWhere('c.importedFrom IS NULL')
            ->setParameter('user', $user)
            ->setMaxResults(1)
            ->getQuery()
            ->getOneOrNullResult();
    }
}
