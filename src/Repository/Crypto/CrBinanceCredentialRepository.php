<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrBinanceCredential;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrBinanceCredential>
 *
 * @method CrBinanceCredential|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrBinanceCredential|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrBinanceCredential[]    findAll()
 * @method CrBinanceCredential[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrBinanceCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrBinanceCredential::class);
    }

    public function save(CrBinanceCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(CrBinanceCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByUser(User $user): ?CrBinanceCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
