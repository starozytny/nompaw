<?php

namespace App\Repository\Photo;

use App\Entity\Photo\PhAlbum;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PhAlbum>
 *
 * @method PhAlbum|null find($id, $lockMode = null, $lockVersion = null)
 * @method PhAlbum|null findOneBy(array $criteria, array $orderBy = null)
 * @method PhAlbum[]    findAll()
 * @method PhAlbum[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PhAlbumRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PhAlbum::class);
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function save(PhAlbum $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PhAlbum $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
