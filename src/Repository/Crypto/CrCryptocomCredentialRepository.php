<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrCryptocomCredential;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrCryptocomCredential>
 *
 * @method CrCryptocomCredential|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrCryptocomCredential|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrCryptocomCredential[]    findAll()
 * @method CrCryptocomCredential[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrCryptocomCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrCryptocomCredential::class);
    }

    public function save(CrCryptocomCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(CrCryptocomCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByUser(User $user): ?CrCryptocomCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
