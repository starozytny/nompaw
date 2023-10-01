<?php

namespace App\Repository\Holiday;

use App\Entity\Holiday\HoPropalDate;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<HoPropalDate>
 *
 * @method HoPropalDate|null find($id, $lockMode = null, $lockVersion = null)
 * @method HoPropalDate|null findOneBy(array $criteria, array $orderBy = null)
 * @method HoPropalDate[]    findAll()
 * @method HoPropalDate[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class HoPropalDateRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HoPropalDate::class);
    }

    public function save(HoPropalDate $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(HoPropalDate $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return HoPropalDate[] Returns an array of HoPropalDate objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('h')
//            ->andWhere('h.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('h.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?HoPropalDate
//    {
//        return $this->createQueryBuilder('h')
//            ->andWhere('h.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
