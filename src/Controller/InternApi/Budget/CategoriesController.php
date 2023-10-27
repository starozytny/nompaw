<?php

namespace App\Controller\InternApi\Budget;

use App\Entity\Budget\BuCategory;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataBudget;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

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
}
