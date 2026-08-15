<?php

namespace App\Repository\Photo;

use App\Entity\Main\User;
use App\Entity\Photo\PhAlbum;
use App\Entity\Photo\PhMedia;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PhMedia>
 *
 * @method PhMedia|null find($id, $lockMode = null, $lockVersion = null)
 * @method PhMedia|null findOneBy(array $criteria, array $orderBy = null)
 * @method PhMedia[]    findAll()
 * @method PhMedia[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PhMediaRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PhMedia::class);
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function save(PhMedia $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PhMedia $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findFiltered(?User $author, ?PhAlbum $album): array
    {
        return $this->filteredQueryBuilder($author, $album)->getQuery()->getResult();
    }

    public function findFilteredPage(?User $author, ?PhAlbum $album, int $offset, int $limit): array
    {
        return $this->filteredQueryBuilder($author, $album)
            ->setFirstResult($offset)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult()
        ;
    }

    public function countFiltered(?User $author, ?PhAlbum $album): int
    {
        $qb = $this->createQueryBuilder('m')->select('COUNT(m.id)');

        if ($author) {
            $qb->andWhere('m.author = :author')->setParameter('author', $author);
        }

        if ($album) {
            $qb->andWhere('m.album = :album')->setParameter('album', $album);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    private function filteredQueryBuilder(?User $author, ?PhAlbum $album)
    {
        $qb = $this->createQueryBuilder('m')
            ->orderBy('m.takenAt', 'DESC')
            ->addOrderBy('m.createdAt', 'DESC');

        if ($author) {
            $qb->andWhere('m.author = :author')->setParameter('author', $author);
        }

        if ($album) {
            $qb->andWhere('m.album = :album')->setParameter('album', $album);
        }

        return $qb;
    }

    public function getTotalSize(): int
    {
        return (int) ($this->createQueryBuilder('m')
            ->select('SUM(m.fileSize)')
            ->getQuery()
            ->getSingleScalarResult() ?? 0);
    }

    /**
     * @return User[]
     */
    public function findAuthors(): array
    {
        return $this->getEntityManager()->createQueryBuilder()
            ->select('DISTINCT u')
            ->from(User::class, 'u')
            ->join('u.phMedia', 'm')
            ->getQuery()
            ->getResult();
    }
}
