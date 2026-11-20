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
        return $this->visibleImagesQueryBuilder($rando, $canSeePrivate)->getQuery()->getResult();
    }

    public function findVisibleImagesPage(RaRando $rando, bool $canSeePrivate, int $offset, int $limit): array
    {
        return $this->visibleImagesQueryBuilder($rando, $canSeePrivate)
            ->setFirstResult($offset)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult()
        ;
    }

    public function countVisibleImages(RaRando $rando, bool $canSeePrivate): int
    {
        $qb = $this->createQueryBuilder('i')
            ->select('COUNT(i.id)')
            ->where('i.rando = :rando')
            ->setParameter('rando', $rando)
        ;

        if (!$canSeePrivate) {
            $qb->andWhere('i.visibility = 0 OR i.visibility IS NULL');
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * Photos of past (non-"next") adventures per group, in one query — counting via $rando->getImages()
     * would hydrate every image.
     *
     * @return array<int, int> groupe id => photo count
     */
    public function countByGroupes(array $groupes): array
    {
        if (!$groupes) {
            return [];
        }

        $rows = $this->createQueryBuilder('i')
            ->select('IDENTITY(r.groupe) AS gid, COUNT(i.id) AS total')
            ->join('i.rando', 'r')
            ->where('r.groupe IN (:groupes)')
            ->andWhere('r.isNext = false')
            ->setParameter('groupes', $groupes)
            ->groupBy('r.groupe')
            ->getQuery()->getArrayResult();

        return array_column(array_map(fn ($row) => ['gid' => (int) $row['gid'], 'total' => (int) $row['total']], $rows), 'total', 'gid');
    }

    /**
     * Public photos per adventure, in one query.
     *
     * @return array<int, int> rando id => photo count
     */
    public function countPublicByRandos(array $randos): array
    {
        if (!$randos) {
            return [];
        }

        $rows = $this->createQueryBuilder('i')
            ->select('IDENTITY(i.rando) AS rid, COUNT(i.id) AS total')
            ->where('i.rando IN (:randos)')
            ->andWhere('i.visibility = 0 OR i.visibility IS NULL')
            ->setParameter('randos', $randos)
            ->groupBy('i.rando')
            ->getQuery()->getArrayResult();

        return array_column(array_map(fn ($row) => ['rid' => (int) $row['rid'], 'total' => (int) $row['total']], $rows), 'total', 'rid');
    }

    /**
     * The original photo a rando cover was generated from ("cover-<basename>.webp"), to display it
     * larger than the 340px cover. Null for older covers whose source was renamed.
     */
    public function findCoverSource(RaRando $rando): ?RaImage
    {
        if (!$rando->getCover()) {
            return null;
        }

        $base = preg_replace('/^cover-/', '', pathinfo($rando->getCover(), PATHINFO_FILENAME));

        return $this->createQueryBuilder('i')
            ->where('i.rando = :rando')->andWhere('i.file LIKE :file')
            ->setParameter('rando', $rando)->setParameter('file', addcslashes($base, '%_') . '.%')
            ->setMaxResults(1)
            ->getQuery()->getOneOrNullResult();
    }

    private function visibleImagesQueryBuilder(RaRando $rando, bool $canSeePrivate)
    {
        $qb = $this->createQueryBuilder('i')
            ->where('i.rando = :rando')
            ->setParameter('rando', $rando)
            ->orderBy('i.takenAt', 'ASC');

        if (!$canSeePrivate) {
            $qb->andWhere('i.visibility = 0 OR i.visibility IS NULL');
        }

        return $qb;
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
