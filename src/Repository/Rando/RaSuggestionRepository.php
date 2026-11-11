<?php

namespace App\Repository\Rando;

use App\Entity\Main\User;
use App\Entity\Rando\RaSuggestion;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<RaSuggestion>
 *
 * @method RaSuggestion|null find($id, $lockMode = null, $lockVersion = null)
 * @method RaSuggestion|null findOneBy(array $criteria, array $orderBy = null)
 * @method RaSuggestion[]    findAll()
 * @method RaSuggestion[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class RaSuggestionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RaSuggestion::class);
    }

    public function save(RaSuggestion $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(RaSuggestion $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return RaSuggestion[]
     */
    public function findAllByUser(User $user): array
    {
        return $this->createQueryBuilder('s')
            ->andWhere('s.author = :author')
            ->setParameter('author', $user)
            ->orderBy('s.createdAt', 'DESC')
            ->getQuery()
            ->getResult()
        ;
    }
}
