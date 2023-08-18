<?php

namespace App\Repository\Holiday;

use App\Entity\Holiday\HoPropalActivity;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<HoPropalActivity>
 *
 * @method HoPropalActivity|null find($id, $lockMode = null, $lockVersion = null)
 * @method HoPropalActivity|null findOneBy(array $criteria, array $orderBy = null)
 * @method HoPropalActivity[]    findAll()
 * @method HoPropalActivity[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class HoPropalActivityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, HoPropalActivity::class);
    }

    public function save(HoPropalActivity $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(HoPropalActivity $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return HoPropalActivity[] Returns an array of HoPropalActivity objects
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

//    public function findOneBySomeField($value): ?HoPropalActivity
//    {
//        return $this->createQueryBuilder('h')
//            ->andWhere('h.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
