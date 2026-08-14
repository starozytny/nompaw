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
}
