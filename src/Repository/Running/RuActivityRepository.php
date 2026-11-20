<?php

namespace App\Repository\Running;

use App\Entity\Main\User;
use App\Entity\Running\RuActivity;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RuActivity>
 *
 * @method RuActivity|null find($id, $lockMode = null, $lockVersion = null)
 * @method RuActivity|null findOneBy(array $criteria, array $orderBy = null)
 * @method RuActivity[]    findAll()
 * @method RuActivity[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class RuActivityRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RuActivity::class);
    }

    public function save(RuActivity $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(RuActivity $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return RuActivity[] ordered oldest to newest, matching the original HIST.sort((a,b) => a.d < b.d ? -1 : 1)
     */
    public function findAllByUser(User $user): array
    {
        return $this->createQueryBuilder('a')
            ->andWhere('a.user = :user')
            ->setParameter('user', $user)
            ->orderBy('a.date', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }

    public function removeAllByUser(User $user): void
    {
        $this->createQueryBuilder('a')
            ->delete()
            ->andWhere('a.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute()
        ;
    }
}
