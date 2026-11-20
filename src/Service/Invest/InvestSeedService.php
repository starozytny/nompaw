<?php

namespace App\Service\Invest;

use App\Entity\Enum\Invest\EnveloppeType;
use App\Entity\Invest\InEnveloppe;
use App\Entity\Invest\InLine;
use App\Entity\Invest\InSnapshot;
use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Invest\InEnveloppeRepository;
use DateTime;
use DateTimeInterface;
use Doctrine\ORM\EntityManagerInterface;
use RuntimeException;

/**
 * Seeds Shanbo's real starting positions (PEA/AV/CTO/Livrets, from docs/INVEST_CONTEXT.md) for a user
 * who has no InEnveloppe yet — used both by the one-shot console command (local dev) and by the
 * Invest page's "Initialiser mes données" button (needed on prod, which starts with an empty
 * database). Budget category links are resolved by name rather than hardcoded ids, since those ids
 * differ between the dev and prod databases.
 */
class InvestSeedService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly InEnveloppeRepository $enveloppeRepository,
        private readonly BuCategoryRepository $categoryRepository,
    ) {}

    public function hasExistingData(User $user): bool
    {
        return !empty($this->enveloppeRepository->findAllByUser($user));
    }

    public function seedInitialData(User $user, ?DateTimeInterface $asOf = null): void
    {
        if ($this->hasExistingData($user)) {
            throw new RuntimeException("L'utilisateur a déjà des enveloppes d'investissement.");
        }

        $date = $asOf ?? new DateTime();
        $position = 0;

        $this->createEnveloppe($user, 'PEA XTB', EnveloppeType::Pea, $this->findCategoryId($user, 'XTB PEA'), new DateTime('2031-01-01'), $position++, $date, [
            'MSCI World ETF' => 509.21,
            'MSCI Europe ETF' => 158.84,
            'BNP Paribas Easy Bloomberg Europe Defense Acc' => [92.44, 'LU3047998896'],
            'Cash à investir' => 58.57,
        ]);

        $this->createEnveloppe($user, 'AV Linxea', EnveloppeType::Av, $this->findCategoryId($user, 'AV Linxea Spirit 2'), null, $position++, $date, [
            'Fonds euros FONDSEURNG' => 400.00,
            'Amundi MSCI World Swap Acc' => [320.95, 'LU1681043599'],
            'Amundi Core Nasdaq-100 Swap Acc' => [330.14, 'LU1829221024'],
        ]);

        $this->createEnveloppe($user, 'CTO XTB', EnveloppeType::Cto, $this->findCategoryId($user, 'Shares CTO'), null, $position++, $date, [
            'Non détaillé (à affiner)' => 350.00,
        ]);

        $this->createEnveloppe($user, 'Livret A', EnveloppeType::Livret, null, null, $position++, $date, [
            'Livret A' => 1080.00,
        ]);

        $this->createEnveloppe($user, 'Épargne de précaution', EnveloppeType::Livret, $this->findCategoryId($user, 'Imprévu'), null, $position++, $date, [
            'Solde' => 2000.00,
        ]);

        $this->em->flush();
    }

    private function findCategoryId(User $user, string $name): ?int
    {
        return $this->categoryRepository->findOneBy(['user' => $user, 'name' => $name])?->getId();
    }

    /**
     * @param array<string, float|array{0: float, 1: string}> $lines name => value, or [value, isin]
     */
    private function createEnveloppe(User $user, string $name, EnveloppeType $type, ?int $buCategoryId,
                                      ?DateTime $taxExemptDate, int $position, DateTimeInterface $date, array $lines): void
    {
        $enveloppe = (new InEnveloppe())
            ->setUser($user)
            ->setName($name)
            ->setType($type)
            ->setBuCategoryId($buCategoryId)
            ->setTaxExemptDate($taxExemptDate)
            ->setPosition($position)
        ;
        $this->em->persist($enveloppe);

        $linePosition = 0;
        foreach ($lines as $lineName => $value) {
            [$amount, $isin] = is_array($value) ? $value : [$value, null];

            $line = (new InLine())
                ->setEnveloppe($enveloppe)
                ->setName($lineName)
                ->setIsin($isin)
                ->setPosition($linePosition++)
            ;
            $this->em->persist($line);

            $snapshot = (new InSnapshot())
                ->setLine($line)
                ->setDate($date)
                ->setValue($amount)
            ;
            $this->em->persist($snapshot);
        }
    }
}
