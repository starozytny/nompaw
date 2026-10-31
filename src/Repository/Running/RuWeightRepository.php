<?php

namespace App\Repository\Running;

use App\Entity\Main\User;
use App\Entity\Running\RuWeight;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RuWeight>
 *
 * @method RuWeight|null find($id, $lockMode = null, $lockVersion = null)
 * @method RuWeight|null findOneBy(array $criteria, array $orderBy = null)
 * @method RuWeight[]    findAll()
 * @method RuWeight[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class RuWeightRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RuWeight::class);
    }

    public function save(RuWeight $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(RuWeight $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByUserAndDate(User $user, \DateTimeInterface $date): ?RuWeight
    {
        return $this->createQueryBuilder('w')
            ->andWhere('w.user = :user')
            ->andWhere('w.date = :date')
            ->setParameter('user', $user)
            ->setParameter('date', $date, 'date')
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    /**
     * @return RuWeight[]
     */
    public function findAllByUser(User $user): array
    {
        return $this->createQueryBuilder('w')
            ->andWhere('w.user = :user')
            ->setParameter('user', $user)
            ->orderBy('w.date', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }

    public function removeAllByUser(User $user): void
    {
        $this->createQueryBuilder('w')
            ->delete()
            ->andWhere('w.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute()
        ;
    }
}
