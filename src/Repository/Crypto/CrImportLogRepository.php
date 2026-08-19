<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrImportLog;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrImportLog>
 *
 * @method CrImportLog|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrImportLog|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrImportLog[]    findAll()
 * @method CrImportLog[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrImportLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrImportLog::class);
    }

    public function save(CrImportLog $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return CrImportLog[]
     */
    public function findRecentByUser(User $user, int $limit = 100): array
    {
        return $this->createQueryBuilder('l')
            ->andWhere('l.user = :user')
            ->setParameter('user', $user)
            ->orderBy('l.createdAt', 'DESC')
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult()
        ;
    }
}
