<?php

namespace App\Repository\Holiday;

use App\Entity\Holiday\HoPropalHouse;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<HoPropalHouse>
 *
 * @method HoPropalHouse|null find($id, $lockMode = null, $lockVersion = null)
 * @method HoPropalHouse|null findOneBy(array $criteria, array $orderBy = null)
 * @method HoPropalHouse[]    findAll()
 * @method HoPropalHouse[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class HoPropalHouseRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HoPropalHouse::class);
    }

    public function save(HoPropalHouse $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(HoPropalHouse $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return HoPropalHouse[] Returns an array of HoPropalHouse objects
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

//    public function findOneBySomeField($value): ?HoPropalHouse
//    {
//        return $this->createQueryBuilder('h')
//            ->andWhere('h.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
