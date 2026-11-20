<?php

namespace App\Repository\Running;

use App\Entity\Main\User;
use App\Entity\Running\RuLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RuLog>
 *
 * @method RuLog|null find($id, $lockMode = null, $lockVersion = null)
 * @method RuLog|null findOneBy(array $criteria, array $orderBy = null)
 * @method RuLog[]    findAll()
 * @method RuLog[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class RuLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RuLog::class);
    }

    public function save(RuLog $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(RuLog $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByUserAndDate(User $user, \DateTimeInterface $date): ?RuLog
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.user = :user')
            ->andWhere('l.date = :date')
            ->setParameter('user', $user)
            ->setParameter('date', $date, 'date')
            ->getQuery()
            ->getOneOrNullResult()
        ;
    }

    /**
     * @return RuLog[]
     */
    public function findAllByUser(User $user): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult()
        ;
    }

    public function removeAllByUser(User $user): void
    {
        $this->createQueryBuilder('l')
            ->delete()
            ->andWhere('l.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->execute()
        ;
    }
}
