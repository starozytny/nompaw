<?php

namespace App\Repository\Photo;

use App\Entity\Main\User;
use App\Entity\Photo\PhAlbum;
use App\Entity\Photo\PhMedia;
use App\Entity\Photo\PhShareLink;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PhShareLink>
 *
 * @method PhShareLink|null find($id, $lockMode = null, $lockVersion = null)
 * @method PhShareLink|null findOneBy(array $criteria, array $orderBy = null)
 * @method PhShareLink[]    findAll()
 * @method PhShareLink[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PhShareLinkRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PhShareLink::class);
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function save(PhShareLink $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PhShareLink $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    private function activeQb()
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.revokedAt IS NULL')
            ->andWhere('s.expiresAt >= :now')
            ->setParameter('now', new \DateTime())
        ;
    }

    public function findOneActiveByToken(string $token): ?PhShareLink
    {
        return $this->activeQb()
            ->andWhere('s.token = :token')->setParameter('token', $token)
            ->getQuery()->getOneOrNullResult()
        ;
    }

    public function findActiveForMedia(PhMedia $media): ?PhShareLink
    {
        return $this->activeQb()
            ->andWhere('s.media = :media')->setParameter('media', $media)
            ->getQuery()->getOneOrNullResult()
        ;
    }

    public function findActiveForAlbum(PhAlbum $album): ?PhShareLink
    {
        return $this->activeQb()
            ->andWhere('s.album = :album')->setParameter('album', $album)
            ->getQuery()->getOneOrNullResult()
        ;
    }

    /**
     * @param int[] $mediaIds
     * @return array<int, \DateTime> [mediaId => expiresAt]
     */
    public function findActiveIndexedByMediaIds(array $mediaIds): array
    {
        if (empty($mediaIds)) {
            return [];
        }

        $rows = $this->activeQb()
            ->andWhere('s.media IN (:mediaIds)')->setParameter('mediaIds', $mediaIds)
            ->getQuery()->getResult()
        ;

        $indexed = [];
        foreach ($rows as $row) {
            $indexed[$row->getMedia()->getId()] = $row->getExpiresAt();
        }

        return $indexed;
    }

    /**
     * @param int[] $albumIds
     * @return array<int, \DateTime> [albumId => expiresAt]
     */
    public function findActiveIndexedByAlbumIds(array $albumIds): array
    {
        if (empty($albumIds)) {
            return [];
        }

        $rows = $this->activeQb()
            ->andWhere('s.album IN (:albumIds)')->setParameter('albumIds', $albumIds)
            ->getQuery()->getResult()
        ;

        $indexed = [];
        foreach ($rows as $row) {
            $indexed[$row->getAlbum()->getId()] = $row->getExpiresAt();
        }

        return $indexed;
    }

    /**
     * @return PhShareLink[]
     */
    public function findActiveByAuthor(User $user): array
    {
        return $this->activeQb()
            ->andWhere('s.createdBy = :user')->setParameter('user', $user)
            ->orderBy('s.createdAt', 'DESC')
            ->getQuery()->getResult()
        ;
    }
}
