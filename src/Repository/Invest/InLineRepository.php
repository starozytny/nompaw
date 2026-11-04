<?php

namespace App\Repository\Invest;

use App\Entity\Invest\InLine;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<InLine>
 *
 * @method InLine|null find($id, $lockMode = null, $lockVersion = null)
 * @method InLine|null findOneBy(array $criteria, array $orderBy = null)
 * @method InLine[]    findAll()
 * @method InLine[]    findBy(array $criteria, array $orderBy = null, $limit = null, $offset = null)
 */
class InLineRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, InLine::class);
    }

    public function save(InLine $entity, bool $flush = false): void
    {
        $this->getEntityManager()->persist($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    public function remove(InLine $entity, bool $flush = false): void
    {
        $this->getEntityManager()->remove($entity);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }
}
