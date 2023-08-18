<?php

namespace App\Repository\Holiday;

use App\Entity\Holiday\HoLifestyle;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<HoLifestyle>
 *
 * @method HoLifestyle|null find($id, $lockMode = null, $lockVersion = null)
 * @method HoLifestyle|null findOneBy(array $criteria, array $orderBy = null)
 * @method HoLifestyle[]    findAll()
 * @method HoLifestyle[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class HoLifestyleRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HoLifestyle::class);
    }

    public function save(HoLifestyle $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(HoLifestyle $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return HoLifestyle[] Returns an array of HoLifestyle objects
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

//    public function findOneBySomeField($value): ?HoLifestyle
//    {
//        return $this->createQueryBuilder('h')
//            ->andWhere('h.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
