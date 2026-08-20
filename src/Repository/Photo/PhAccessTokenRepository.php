<?php

namespace App\Repository\Photo;

use App\Entity\Photo\PhAccessToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PhAccessToken>
 *
 * @method PhAccessToken|null find($id, $lockMode = null, $lockVersion = null)
 * @method PhAccessToken|null findOneBy(array $criteria, array $orderBy = null)
 * @method PhAccessToken[]    findAll()
 * @method PhAccessToken[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class PhAccessTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PhAccessToken::class);
    }

    public function flush(): void
    {
        $this->getEntityManager()->flush();
    }

    public function save(PhAccessToken $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(PhAccessToken $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
