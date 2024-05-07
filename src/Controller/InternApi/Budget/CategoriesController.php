<?php

namespace App\Controller\InternApi\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataBudget;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/budget/categories', name: 'intern_api_budget_categories_')]
class CategoriesController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(BuCategoryRepository $repository, ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponse($repository->findBy(['user' => $this->getUser()]), BuCategory::LIST);
    }

    public function submitForm($type, BuCategoryRepository $repository, BuCategory $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataBudget $dataEntity): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataCategory($obj, $data);
        $obj->setUser($this->getUser());

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuCategory::LIST);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, BuCategoryRepository $repository): Response
    {
        return $this->submitForm("create", $repository, new BuCategory(), $request, $apiResponse, $validator, $dataEntity);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, BuCategory $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, BuCategoryRepository $repository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(BuCategory $obj, BuCategoryRepository $repository, ApiResponse $apiResponse, BuItemRepository $itemRepository): Response
    {
        $items = $itemRepository->findBy(['user' => $this->getUser(), 'category' => $obj->getId()]);
        foreach($items as $item){
            $item->setCategory(null);
        }

        $repository->remove($obj, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/use/{id}', name: 'use', options: ['expose' => true], methods: 'PUT')]
    public function useSaving(Request $request, BuCategory $obj, BuItemRepository $repository, ApiResponse $apiResponse,
                              DataBudget $dataEntity, ValidatorService $validator): Response
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $savingsItems = $repository->findBy(['user' => $user, 'type' => TypeType::Saving, 'category' => $obj]);

        $max = 0;
        foreach($savingsItems as $sa){
            if($sa->getYear() <= $data->year){
                if($sa->getYear() < $data->year || ($sa->getYear() === $data->year && $sa->getMonth() <= $data->month)){
                    $max += $sa->getPrice();
                }
            }
        }

        $obj = $dataEntity->setDataItemFromCategory(new BuItem(), $obj, $data);
        $obj->setUser($user);

        if($obj->getPrice() > $max){
            return $apiResponse->apiJsonResponseBadRequest('Solde supérieur aux économies réalisées.');
        }

        if($obj->getPrice() <= 0){
            return $apiResponse->apiJsonResponseBadRequest('Renseigner un solde supérieur à 0.');
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuItem::LIST);
    }
}
