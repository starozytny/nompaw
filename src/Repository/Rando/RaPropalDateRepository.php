<?php

namespace App\Repository\Rando;

use App\Entity\Rando\RaPropalDate;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RaPropalDate>
 *
 * @method RaPropalDate|null find($id, $lockMode = null, $lockVersion = null)
 * @method RaPropalDate|null findOneBy(array $criteria, array $orderBy = null)
 * @method RaPropalDate[]    findAll()
 * @method RaPropalDate[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class RaPropalDateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RaPropalDate::class);
    }

    public function save(RaPropalDate $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(RaPropalDate $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return RaPropalDate[] Returns an array of RaPropalDate objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('r')
//            ->andWhere('r.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('r.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?RaPropalDate
//    {
//        return $this->createQueryBuilder('r')
//            ->andWhere('r.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
