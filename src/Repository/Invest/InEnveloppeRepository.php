<?php

namespace App\Repository\Invest;

use App\Entity\Invest\InEnveloppe;
use App\Entity\Main\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InEnveloppe>
 *
 * @method InEnveloppe|null find($id, $lockMode = null, $lockVersion = null)
 * @method InEnveloppe|null findOneBy(array $criteria, array $orderBy = null)
 * @method InEnveloppe[]    findAll()
 * @method InEnveloppe[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class InEnveloppeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InEnveloppe::class);
    }

    public function save(InEnveloppe $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InEnveloppe $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return InEnveloppe[]
     */
    public function findAllByUser(User $user): array
    {
        return $this->createQueryBuilder('e')
            ->andWhere('e.user = :user')
            ->setParameter('user', $user)
            ->orderBy('e.position', 'ASC')
            ->getQuery()
            ->getResult()
        ;
    }
}
