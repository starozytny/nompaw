<?php

namespace App\Repository\Invest;

use App\Entity\Invest\InLine;
use App\Entity\Invest\InSnapshot;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InSnapshot>
 *
 * @method InSnapshot|null find($id, $lockMode = null, $lockVersion = null)
 * @method InSnapshot|null findOneBy(array $criteria, array $orderBy = null)
 * @method InSnapshot[]    findAll()
 * @method InSnapshot[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class InSnapshotRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InSnapshot::class);
    }

    public function save(InSnapshot $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InSnapshot $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByLineAndDate(InLine $line, \DateTimeInterface $date): ?InSnapshot
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.line = :line')
            ->andWhere('s.date = :date')
            ->setParameter('line', $line)
            ->setParameter('date', $date, 'date')
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }
}
