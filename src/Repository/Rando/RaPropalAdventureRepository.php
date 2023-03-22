<?php

namespace App\Repository\Rando;

use App\Entity\Rando\RaPropalAdventure;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RaPropalAdventure>
 *
 * @method RaPropalAdventure|null find($id, $lockMode = null, $lockVersion = null)
 * @method RaPropalAdventure|null findOneBy(array $criteria, array $orderBy = null)
 * @method RaPropalAdventure[]    findAll()
 * @method RaPropalAdventure[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class RaPropalAdventureRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RaPropalAdventure::class);
    }

    public function save(RaPropalAdventure $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(RaPropalAdventure $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

//    /**
//     * @return RaPropalAdventure[] Returns an array of RaPropalAdventure objects
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

//    public function findOneBySomeField($value): ?RaPropalAdventure
//    {
//        return $this->createQueryBuilder('r')
//            ->andWhere('r.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
