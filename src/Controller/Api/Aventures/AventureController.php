<?php

namespace App\Controller\Api\Aventures;

use App\Entity\Main\User;
use App\Entity\Rando\RaGroupe;
use App\Service\Api\ApiResponse;
use App\Service\Aventures\GroupService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/aventures', name: 'api_aventures_')]
class AventureController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true])]
    public function list(ApiResponse $apiResponse, GroupService $groupService): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $groupes = $groupService->getList($user);

        return $apiResponse->apiJsonResponse($groupes, RaGroupe::FORM);
    }
}
