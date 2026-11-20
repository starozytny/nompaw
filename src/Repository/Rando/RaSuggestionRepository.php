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

    /**
     * Returns the author's existing suggestion that the candidate duplicates, if any: same
     * normalized name, same source URL, or a similar name within ~300 m (needs lat/lon).
     */
    public function findDuplicate(User $user, RaSuggestion $candidate, string $normalizedName): ?RaSuggestion
    {
        $slugger = new \Symfony\Component\String\Slugger\AsciiSlugger('fr');
        $slug = fn (?string $v): string => strtolower($slugger->slug((string) $v)->toString());

        foreach ($this->findAllByUser($user) as $existing) {
            if ($existing === $candidate) {
                continue;
            }

            $existingSlug = $slug($existing->getName());
            if ($existingSlug !== '' && $existingSlug === $normalizedName) {
                return $existing;
            }

            if ($candidate->getSourceUrl() && $existing->getSourceUrl()
                && rtrim($candidate->getSourceUrl(), '/') === rtrim($existing->getSourceUrl(), '/')) {
                return $existing;
            }

            if ($candidate->getLatitude() !== null && $candidate->getLongitude() !== null
                && $existing->getLatitude() !== null && $existing->getLongitude() !== null
                && self::distanceMeters($candidate->getLatitude(), $candidate->getLongitude(), $existing->getLatitude(), $existing->getLongitude()) <= 300) {
                similar_text($existingSlug, $normalizedName, $percent);
                if ($percent >= 60 || str_contains($existingSlug, $normalizedName) || str_contains($normalizedName, $existingSlug)) {
                    return $existing;
                }
            }
        }

        return null;
    }

    private static function distanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $r = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) ** 2;

        return 2 * $r * asin(min(1, sqrt($a)));
    }
}
