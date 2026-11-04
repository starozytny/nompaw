<?php

namespace App\Controller\InternApi\Invest;

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
use App\Repository\Invest\InLineRepository;
use App\Repository\Invest\InSnapshotRepository;
use App\Service\Api\ApiResponse;
use App\Service\Data\DataInvest;
use App\Service\ValidatorService;
use DateTime;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/invest', name: 'intern_api_invest_')]
class InvestController extends AbstractController
{
    #[Route('/tracking', name: 'tracking', options: ['expose' => true], methods: 'GET')]
    public function tracking(InEnveloppeRepository $enveloppeRepository, BuCategoryRepository $categoryRepository,
                             BuRecurrentRepository $recurrentRepository, BuItemRepository $itemRepository,
                             ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponseCustom($this->buildTrackingPayload(
            $this->getUser(), $enveloppeRepository, $categoryRepository, $recurrentRepository, $itemRepository
        ));
    }

    #[Route('/enveloppes', name: 'enveloppe_save', options: ['expose' => true], methods: 'POST')]
    public function saveEnveloppe(Request $request, InEnveloppeRepository $enveloppeRepository, DataInvest $dataEntity,
                                  ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->name) || !isset($data->type)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $user = $this->getUser();
        $enveloppe = (!empty($data->id) ? $enveloppeRepository->find($data->id) : null) ?? (new InEnveloppe())->setUser($user);
        if ($enveloppe->getUser() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $enveloppe = $dataEntity->setDataEnveloppe($enveloppe, $data);

        $noErrors = $validator->validate($enveloppe);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $enveloppeRepository->save($enveloppe, true);
        return $apiResponse->apiJsonResponseCustom(['id' => $enveloppe->getId()]);
    }

    #[Route('/enveloppes/{id}', name: 'enveloppe_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteEnveloppe(InEnveloppe $enveloppe, InEnveloppeRepository $enveloppeRepository, ApiResponse $apiResponse): Response
    {
        if ($enveloppe->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $enveloppeRepository->remove($enveloppe, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/lines', name: 'line_save', options: ['expose' => true], methods: 'POST')]
    public function saveLine(Request $request, InEnveloppeRepository $enveloppeRepository, InLineRepository $lineRepository,
                             DataInvest $dataEntity, ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->name) || empty($data->enveloppeId)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $user = $this->getUser();
        $line = !empty($data->id) ? $lineRepository->find($data->id) : null;
        if ($line && $line->getEnveloppe()->getUser() !== $user) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        if (!$line) {
            $enveloppe = $enveloppeRepository->find($data->enveloppeId);
            if (!$enveloppe || $enveloppe->getUser() !== $user) {
                return $apiResponse->apiJsonResponseForbidden();
            }
            $line = (new InLine())->setEnveloppe($enveloppe);
        }

        $line = $dataEntity->setDataLine($line, $data);

        $noErrors = $validator->validate($line);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $lineRepository->save($line, true);
        return $apiResponse->apiJsonResponseCustom(['id' => $line->getId()]);
    }

    #[Route('/lines/{id}', name: 'line_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteLine(InLine $line, InLineRepository $lineRepository, ApiResponse $apiResponse): Response
    {
        if ($line->getEnveloppe()->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $lineRepository->remove($line, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/snapshots', name: 'snapshot_save', options: ['expose' => true], methods: 'POST')]
    public function saveSnapshot(Request $request, InLineRepository $lineRepository, InSnapshotRepository $snapshotRepository,
                                 DataInvest $dataEntity, ValidatorService $validator, ApiResponse $apiResponse): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null || empty($data->lineId) || empty($data->date) || !isset($data->value)) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $line = $lineRepository->find($data->lineId);
        if (!$line || $line->getEnveloppe()->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $date = DateTime::createFromFormat('Y-m-d', $data->date);
        $snapshot = $snapshotRepository->findOneByLineAndDate($line, $date) ?? (new InSnapshot())->setLine($line);
        $snapshot = $dataEntity->setDataSnapshot($snapshot, $data);

        $noErrors = $validator->validate($snapshot);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $snapshotRepository->save($snapshot, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/snapshots/{id}', name: 'snapshot_delete', options: ['expose' => true], methods: 'DELETE')]
    public function deleteSnapshot(InSnapshot $snapshot, InSnapshotRepository $snapshotRepository, ApiResponse $apiResponse): Response
    {
        if ($snapshot->getLine()->getEnveloppe()->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden();
        }

        $snapshotRepository->remove($snapshot, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    private function buildTrackingPayload(User $user, InEnveloppeRepository $enveloppeRepository, BuCategoryRepository $categoryRepository,
                                          BuRecurrentRepository $recurrentRepository, BuItemRepository $itemRepository): array
    {
        $enveloppes = $enveloppeRepository->findAllByUser($user);

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

        $categories = $categoryRepository->findBy(['user' => $user, 'type' => TypeType::Saving]);
        $buCategories = array_map(fn (BuCategory $c) => [
            'id' => $c->getId(),
            'name' => $c->getName(),
            'goal' => $c->getGoal(),
        ], $categories);

        $linkedCategoryIds = array_values(array_unique(array_filter(array_map(fn (InEnveloppe $e) => $e->getBuCategoryId(), $enveloppes))));
        $contributions = $this->buildContributions($user, $linkedCategoryIds, $recurrentRepository, $itemRepository);
        $totalInvested = $this->buildTotalInvested($user, $linkedCategoryIds, $itemRepository);

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
    private function buildContributions(User $user, array $categoryIds, BuRecurrentRepository $recurrentRepository, BuItemRepository $itemRepository): array
    {
        if (empty($categoryIds)) {
            return [];
        }

        $recurrents = $recurrentRepository->createQueryBuilder('r')
            ->andWhere('r.user = :user')
            ->andWhere('r.category IN (:ids)')
            ->setParameter('user', $user)
            ->setParameter('ids', $categoryIds)
            ->getQuery()
            ->getResult();

        $items = $itemRepository->createQueryBuilder('i')
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
    private function buildTotalInvested(User $user, array $categoryIds, BuItemRepository $itemRepository): array
    {
        if (empty($categoryIds)) {
            return [];
        }

        $items = $itemRepository->createQueryBuilder('i')
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
