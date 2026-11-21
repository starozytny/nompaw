<?php

namespace App\Repository\Drive;

use App\Entity\Drive\DrFile;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<DrFile>
 */
class DrFileRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, DrFile::class);
    }

    public function save(DrFile $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(DrFile $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function getUsedSize(User $user): int
    {
        return (int) $this->createQueryBuilder('f')
            ->select('COALESCE(SUM(f.size), 0)')
            ->where('f.owner = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return array<int, int> [userId => octets utilisés]
     */
    public function getUsedSizeByUser(): array
    {
        $rows = $this->createQueryBuilder('f')
            ->select('IDENTITY(f.owner) AS userId, SUM(f.size) AS used')
            ->groupBy('f.owner')
            ->getQuery()
            ->getArrayResult();

        $data = [];
        foreach ($rows as $row) {
            $data[(int) $row['userId']] = (int) $row['used'];
        }

        return $data;
    }
}
