<?php

namespace App\Service\Invest;

use App\Entity\Budget\BuCategory;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Invest\InEnveloppe;
use App\Entity\Invest\InLine;
use App\Entity\Invest\InSnapshot;
use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Repository\Invest\InEnveloppeRepository;
use DateTime;

class InvestTrackingBuilder
{
    public function __construct(
        private readonly InEnveloppeRepository $enveloppeRepository,
        private readonly BuCategoryRepository $categoryRepository,
        private readonly BuRecurrentRepository $recurrentRepository,
        private readonly BuItemRepository $itemRepository,
    ) {}

    public function build(User $user): array
    {
        $enveloppes = $this->enveloppeRepository->findAllByUser($user);

        $payload = array_map(function (InEnveloppe $enveloppe) {
            $lines = $enveloppe->getLines();
            return [
                'id' => $enveloppe->getId(),
                'name' => $enveloppe->getName(),
                'type' => $enveloppe->getType()->value,
                'typeString' => $enveloppe->getTypeString(),
                'buCategoryId' => $enveloppe->getBuCategoryId(),
                'taxExemptDate' => $enveloppe->getTaxExemptDate()?->format('Y-m-d'),
                'notes' => $enveloppe->getNotes(),
                'position' => $enveloppe->getPosition(),
                'lines' => array_map(function (InLine $line) {
                    $snapshots = $line->getSnapshots();
                    $last = $snapshots->isEmpty() ? null : $snapshots->last();
                    return [
                        'id' => $line->getId(),
                        'name' => $line->getName(),
                        'isin' => $line->getIsin(),
                        'targetAllocationPct' => $line->getTargetAllocationPct(),
                        'position' => $line->getPosition(),
                        'notes' => $line->getNotes(),
                        'currentValue' => $last?->getValue(),
                        'currentDate' => $last?->getDate()?->format('Y-m-d'),
                        'snapshots' => array_map(fn (InSnapshot $s) => [
                            'id' => $s->getId(),
                            'date' => $s->getDate()->format('Y-m-d'),
                            'value' => $s->getValue(),
                        ], $snapshots->toArray()),
                    ];
                }, $lines->toArray()),
            ];
        }, $enveloppes);

        $categories = $this->categoryRepository->findBy(['user' => $user, 'type' => TypeType::Saving]);
        $buCategories = array_map(fn (BuCategory $c) => [
            'id' => $c->getId(),
            'name' => $c->getName(),
            'goal' => $c->getGoal(),
        ], $categories);

        $linkedCategoryIds = array_values(array_unique(array_filter(array_map(fn (InEnveloppe $e) => $e->getBuCategoryId(), $enveloppes))));
        $contributions = $this->buildContributions($user, $linkedCategoryIds);
        $totalInvested = $this->buildTotalInvested($user, $linkedCategoryIds);

        return [
            'enveloppes' => $payload,
            'buCategories' => $buCategories,
            'contributions' => $contributions,
            'totalInvested' => $totalInvested,
        ];
    }

    /**
     * For each linked Budget category, computes planned (from BuRecurrent, respecting its months/
     * start date) vs actual (net Saving minus Used BuItem amounts) for the last 12 months — reuses
     * Budget's own recurring/transaction data instead of Invest re-tracking contributions itself.
     */
    private function buildContributions(User $user, array $categoryIds): array
    {
        if (empty($categoryIds)) {
            return [];
        }

        $recurrents = $this->recurrentRepository->createQueryBuilder('r')
            ->andWhere('r.user = :user')
            ->andWhere('r.category IN (:ids)')
            ->setParameter('user', $user)
            ->setParameter('ids', $categoryIds)
            ->getQuery()
            ->getResult();

        $items = $this->itemRepository->createQueryBuilder('i')
            ->andWhere('i.user = :user')
            ->andWhere('i.category IN (:ids)')
            ->andWhere('i.type IN (:types)')
            ->setParameter('user', $user)
            ->setParameter('ids', $categoryIds)
            ->setParameter('types', [TypeType::Saving, TypeType::Used])
            ->getQuery()
            ->getResult();

        $months = [];
        $cursor = new DateTime('first day of this month');
        for ($i = 11; $i >= 0; $i--) {
            $m = (clone $cursor)->modify("-{$i} months");
            $months[] = ['year' => (int) $m->format('Y'), 'month' => (int) $m->format('n')];
        }

        $result = [];
        foreach ($categoryIds as $categoryId) {
            $catRecurrents = array_filter($recurrents, fn ($r) => $r->getCategory()?->getId() === $categoryId);
            $catItems = array_filter($items, fn ($i) => $i->getCategory()?->getId() === $categoryId);

            $rows = [];
            foreach ($months as ['year' => $year, 'month' => $month]) {
                $planned = 0.0;
                foreach ($catRecurrents as $r) {
                    $started = $year > $r->getInitYear() || ($year === $r->getInitYear() && $month >= $r->getInitMonth());
                    if ($started && in_array($month, $r->getMonths(), true)) {
                        $planned += $r->getPrice();
                    }
                }

                $actual = 0.0;
                foreach ($catItems as $it) {
                    if ($it->getYear() === $year && $it->getMonth() === $month) {
                        $actual += $it->getType() === TypeType::Used ? -$it->getPrice() : $it->getPrice();
                    }
                }

                $rows[] = ['year' => $year, 'month' => $month, 'planned' => round($planned, 2), 'actual' => round($actual, 2)];
            }

            $result[] = ['buCategoryId' => $categoryId, 'months' => $rows];
        }

        return $result;
    }

    /**
     * All-time net (Saving minus Used) amount per linked category — the "argent versé" to compare
     * against the current valorisation (sum of the envelope's line snapshots), independent of the
     * 12-month window used for the month-by-month planned/actual breakdown.
     */
    private function buildTotalInvested(User $user, array $categoryIds): array
    {
        if (empty($categoryIds)) {
            return [];
        }

        $items = $this->itemRepository->createQueryBuilder('i')
            ->andWhere('i.user = :user')
            ->andWhere('i.category IN (:ids)')
            ->andWhere('i.type IN (:types)')
            ->setParameter('user', $user)
            ->setParameter('ids', $categoryIds)
            ->setParameter('types', [TypeType::Saving, TypeType::Used])
            ->getQuery()
            ->getResult();

        $totals = array_fill_keys($categoryIds, 0.0);
        foreach ($items as $item) {
            $categoryId = $item->getCategory()?->getId();
            if ($categoryId === null) {
                continue;
            }
            $totals[$categoryId] += $item->getType() === TypeType::Used ? -$item->getPrice() : $item->getPrice();
        }

        return array_map(fn ($id, $total) => ['buCategoryId' => $id, 'totalInvested' => round($total, 2)], array_keys($totals), $totals);
    }
}
