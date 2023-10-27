<?php

namespace App\Controller\InternApi\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Repository\Budget\BuItemRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataBudget;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/intern/api/financial/items', name: 'intern_api_budget_items_')]
class ItemController extends AbstractController
{
    public function submitForm($type, BuItemRepository $repository, BuItem $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataBudget $dataEntity): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataItem($obj, $data);
        $obj->setUser($this->getUser());

        if($type == "update") {
            $obj->setUpdatedAt(new \DateTime());
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuItem::LIST);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, BuItemRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new BuItem(), $request, $apiResponse, $validator, $dataEntity);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, BuItem $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, BuItemRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(BuItem $obj, BuItemRepository $repository, ApiResponse $apiResponse): Response
    {
        if($obj->getRecurrenceId()){
            $obj->setType(TypeType::Deleted);
            $repository->save($obj, true);

            return $apiResponse->apiJsonResponse($obj, BuItem::LIST);
        }

        $repository->remove($obj, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/active/{id}', name: 'active', options: ['expose' => true], methods: 'PUT')]
    public function active(BuItem $obj, BuItemRepository $repository, ApiResponse $apiResponse): Response
    {
        $obj->setIsActive(true);

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuItem::LIST);
    }

    #[Route('/cancel/{id}', name: 'cancel', options: ['expose' => true], methods: 'PUT')]
    public function cancel(BuItem $obj, BuItemRepository $repository, ApiResponse $apiResponse): Response
    {
        if($obj->getRecurrenceId()){
            $obj->setType($obj->getLastType());
            $obj->setDateAt(new \DateTime());
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuItem::LIST);
    }
}
