<?php

namespace App\Repository\Main;

use App\Entity\Main\McpAuthCode;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<McpAuthCode>
 *
 * @method McpAuthCode|null find($id, $lockMode = null, $lockVersion = null)
 * @method McpAuthCode|null findOneBy(array $criteria, array $orderBy = null)
 * @method McpAuthCode[]    findAll()
 * @method McpAuthCode[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class McpAuthCodeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, McpAuthCode::class);
    }

    public function save(McpAuthCode $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(McpAuthCode $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByCodeHash(string $codeHash): ?McpAuthCode
    {
        return $this->findOneBy(['codeHash' => $codeHash]);
    }
}
