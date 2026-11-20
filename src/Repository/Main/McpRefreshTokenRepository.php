<?php

namespace App\Repository\Main;

use App\Entity\Main\McpRefreshToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<McpRefreshToken>
 *
 * @method McpRefreshToken|null find($id, $lockMode = null, $lockVersion = null)
 * @method McpRefreshToken|null findOneBy(array $criteria, array $orderBy = null)
 * @method McpRefreshToken[]    findAll()
 * @method McpRefreshToken[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class McpRefreshTokenRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, McpRefreshToken::class);
    }

    public function save(McpRefreshToken $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(McpRefreshToken $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function findOneByTokenHash(string $tokenHash): ?McpRefreshToken
    {
        return $this->findOneBy(['tokenHash' => $tokenHash]);
    }
}
