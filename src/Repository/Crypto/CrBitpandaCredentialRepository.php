<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrBitpandaCredential;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrBitpandaCredential>
 *
 * @method CrBitpandaCredential|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrBitpandaCredential|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrBitpandaCredential[]    findAll()
 * @method CrBitpandaCredential[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrBitpandaCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrBitpandaCredential::class);
    }

    public function save(CrBitpandaCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(CrBitpandaCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByUser(User $user): ?CrBitpandaCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
