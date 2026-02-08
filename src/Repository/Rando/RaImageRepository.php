<?php

namespace App\Repository\Rando;

use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RaImage>
 *
 * @method RaImage|null find($id, $lockMode = null, $lockVersion = null)
 * @method RaImage|null findOneBy(array $criteria, array $orderBy = null)
 * @method RaImage[]    findAll()
 * @method RaImage[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class RaImageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RaImage::class);
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function save(RaImage $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(RaImage $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findVisibleImages(RaRando $rando, bool $canSeePrivate): array
    {
        $qb = $this->createQueryBuilder('i')
            ->where('i.rando = :rando')
            ->setParameter('rando', $rando)
            ->orderBy('i.takenAt', 'ASC');

        if (!$canSeePrivate) {
            $qb->andWhere('i.visibility = 0 OR i.visibility IS NULL');
        }

        return $qb->getQuery()->getResult();
    }

//    /**
//     * @return RaImage[] Returns an array of RaImage objects
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

//    public function findOneBySomeField($value): ?RaImage
//    {
//        return $this->createQueryBuilder('r')
//            ->andWhere('r.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}
