<?php

namespace App\Controller\InternApi\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Budget\BuRecurrent;
use App\Entity\Enum\Budget\TypeType;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataBudget;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/budget/recurrences', name: 'intern_api_budget_recurrences_')]
class RecurrencesController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(BuRecurrentRepository $repository, ApiResponse $apiResponse): Response
    {
        return $apiResponse->apiJsonResponse($repository->findBy(['user' => $this->getUser()]), BuRecurrent::LIST);
    }

    public function submitForm($type, BuRecurrentRepository $repository, BuRecurrent $obj, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, DataBudget $dataEntity, BuItemRepository $itemRepository,
                               BuCategoryRepository $categoryRepository): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataRecurrent($obj, $data);
        $obj->setUser($this->getUser());

        $category = $categoryRepository->findOneBy(['id' => $data->category]);
        $obj->setCategory($category);

        if($type == "update") {
            $obj->setUpdatedAt(new \DateTime());

            $items = $itemRepository->findBy(['user' => $this->getUser(), 'recurrenceId' => $obj->getId()]);
            foreach($items as $item){
                $item->setRecurrencePrice($obj->getPrice());
                $item->setCategory($category);
            }
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuRecurrent::LIST);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, BuRecurrentRepository $repository, BuItemRepository $itemRepository,
                           BuCategoryRepository $categoryRepository): Response
    {
        return $this->submitForm("create", $repository, new BuRecurrent(), $request, $apiResponse, $validator, $dataEntity, $itemRepository, $categoryRepository);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, BuRecurrent $obj, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, BuRecurrentRepository $repository, BuItemRepository $itemRepository,
                           BuCategoryRepository $categoryRepository): Response
    {
        return $this->submitForm("update", $repository, $obj, $request, $apiResponse, $validator, $dataEntity, $itemRepository, $categoryRepository);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(BuRecurrent $obj, BuRecurrentRepository $repository, ApiResponse $apiResponse, BuItemRepository $itemRepository): Response
    {
        $items = $itemRepository->findBy(['user' => $this->getUser(), 'recurrenceId' => $obj->getId()]);
        foreach($items as $item){
            $item->setRecurrenceId(null);
            $item->setRecurrencePrice(null);
        }

        $repository->remove($obj, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/active/{id}', name: 'active', options: ['expose' => true], methods: 'PUT')]
    public function active(Request $request, BuRecurrent $obj, BuItemRepository $repository, ApiResponse $apiResponse,
                           DataBudget $dataEntity, ValidatorService $validator): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataItemFromRecurrent(new BuItem(), $obj, $data);
        $obj->setUser($this->getUser());

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuItem::LIST);
    }

    #[Route('/trash/{id}', name: 'trash', options: ['expose' => true], methods: 'DELETE')]
    public function trash(Request $request, BuRecurrent $obj, BuItemRepository $repository, ApiResponse $apiResponse,
                          DataBudget $dataEntity, ValidatorService $validator): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataItemFromRecurrent(new BuItem(), $obj, $data);
        $obj->setUser($this->getUser());
        $obj->setType(TypeType::Deleted);

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, BuItem::LIST);
    }
}
