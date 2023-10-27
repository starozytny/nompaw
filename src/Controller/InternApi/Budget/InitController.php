<?php

namespace App\Controller\InternApi\Budget;

use App\Entity\Main\User;
use App\Repository\Main\UserRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataBudget;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/intern/api/financial/initiate', name: 'intern_api_budget_init_')]
class InitController extends AbstractController
{
    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'PUT')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, UserRepository $repository): Response
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataInit($user, $data);

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
