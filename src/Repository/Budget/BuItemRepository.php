<?php

namespace App\Repository\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
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

    public function save(BuItem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(BuItem $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Same as findBy(['user' => $user, 'type' => $type]) but excludes movements from years
     * after the one currently being viewed, since the budget planner never needs them
     * (a running savings balance only looks at years up to the selected one).
     *
     * @return BuItem[]
     */
    public function findByUserAndTypeUpToYear(User $user, TypeType $type, int $year): array
    {
        return $this->createQueryBuilder('bi')
            ->andWhere('bi.user = :user')
            ->andWhere('bi.type = :type')
            ->andWhere('bi.year <= :year')
            ->setParameter('user', $user)
            ->setParameter('type', $type)
            ->setParameter('year', $year)
            ->getQuery()
            ->getResult()
        ;
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
