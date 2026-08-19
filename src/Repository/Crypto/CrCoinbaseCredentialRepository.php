<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrCoinbaseCredential;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrCoinbaseCredential>
 *
 * @method CrCoinbaseCredential|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrCoinbaseCredential|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrCoinbaseCredential[]    findAll()
 * @method CrCoinbaseCredential[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrCoinbaseCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrCoinbaseCredential::class);
    }

    public function save(CrCoinbaseCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(CrCoinbaseCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByUser(User $user): ?CrCoinbaseCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
