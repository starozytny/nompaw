<?php

namespace App\Repository\Budget;

use App\Entity\Budget\BuItem;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<BuItem>
 *
 * @method BuItem|null find($id, $lockMode = null, $lockVersion = null)
 * @method BuItem|null findOneBy(array $criteria, array $orderBy = null)
 * @method BuItem[]    findAll()
 * @method BuItem[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class BuItemRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, BuItem::class);
    }

//    /**
//     * @return BuItem[] Returns an array of BuItem objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('b')
//            ->andWhere('b.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('b.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?BuItem
//    {
//        return $this->createQueryBuilder('b')
//            ->andWhere('b.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
