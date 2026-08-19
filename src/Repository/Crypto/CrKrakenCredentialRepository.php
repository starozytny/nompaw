<?php

namespace App\Repository\Crypto;

use App\Entity\Crypto\CrKrakenCredential;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<CrKrakenCredential>
 *
 * @method CrKrakenCredential|null find($id, $lockMode = null, $lockVersion = null)
 * @method CrKrakenCredential|null findOneBy(array $criteria, array $orderBy = null)
 * @method CrKrakenCredential[]    findAll()
 * @method CrKrakenCredential[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class CrKrakenCredentialRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, CrKrakenCredential::class);
    }

    public function save(CrKrakenCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(CrKrakenCredential $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByUser(User $user): ?CrKrakenCredential
    {
        return $this->findOneBy(['user' => $user]);
    }
}
