<?php

namespace App\Controller\InternApi\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Main\UserRepository;
use App\Service\ApiResponse;
use App\Service\Data\DataBudget;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/intern/api/budget/initiate', name: 'intern_api_budget_init_')]
class InitController extends AbstractController
{
    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'PUT')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                           DataBudget $dataEntity, UserRepository $repository, BuCategoryRepository $categoryRepository): Response
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataInit($user, $data);

        $categories =  [
            ['type' => TypeType::Expense, 'name' => "Dépenses personnelles", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Alimentation", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Cadeaux", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Habitation", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Transports", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Banque", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Voyage", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Santé", 'goal' => null,],
            ['type' => TypeType::Income,  'name' => "Salaire", 'goal' => null,],
            ['type' => TypeType::Income,  'name' => "Cadeaux", 'goal' => null,],
            ['type' => TypeType::Income,  'name' => "Banque", 'goal' => null,],
            ['type' => TypeType::Saving,  'name' => "Voyage", 'goal' => 15000,],
        ];

        if(count($user->getBuCategories()) == 0){
            foreach($categories as $cat){
                $cat = $dataEntity->setDataCategory(new BuCategory(), json_decode(json_encode($cat)));
                $cat->setUser($user);

                $categoryRepository->save($cat);
            }
        }

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponseSuccessful('ok');
    }
}
