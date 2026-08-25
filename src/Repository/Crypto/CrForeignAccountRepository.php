<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrForeignAccount;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrForeignAccount>
 *
 * @method CrForeignAccount|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrForeignAccount|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrForeignAccount[]    findAll()
 * @method CrForeignAccount[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrForeignAccountRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrForeignAccount::class);
    }

    public function save(CrForeignAccount $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(CrForeignAccount $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
