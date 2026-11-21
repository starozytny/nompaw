<?php

namespace App\Controller\Admin;

use App\Entity\Main\User;
use App\Repository\Drive\DrFileRepository;
use App\Repository\Main\UserRepository;
use App\Service\Api\ApiResponse;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/admin/drive', name: 'admin_drive_')]
class DriveController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function index(): Response
    {
        return $this->render('admin/pages/drive/index.html.twig');
    }

    #[Route('/liste', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(UserRepository $userRepository, DrFileRepository $fileRepository, ApiResponse $apiResponse): JsonResponse
    {
        $used = $fileRepository->getUsedSizeByUser();
        $users = $userRepository->findBy(['photosOnly' => false], ['displayName' => 'ASC']);

        return $apiResponse->apiJsonResponseData(array_map(fn (User $u) => $this->serialize($u, $used[$u->getId()] ?? 0), $users));
    }

    #[Route('/quota/{id}', name: 'quota', options: ['expose' => true], methods: 'PUT')]
    public function quota(User $obj, Request $request, UserRepository $userRepository, DrFileRepository $fileRepository,
                          ApiResponse $apiResponse): JsonResponse
    {
        $data = json_decode($request->getContent());
        $quotaMo = isset($data->quotaMo) ? (int) $data->quotaMo : -1;

        if ($quotaMo < 0) {
            return $apiResponse->apiJsonResponseValidationFailed([
                ['name' => 'quotaMo', 'message' => 'Le quota doit être un nombre positif (en Mo).']
            ]);
        }

        $obj->setDriveQuota($quotaMo * 1024 * 1024);
        $userRepository->save($obj, true);

        return $apiResponse->apiJsonResponseData($this->serialize($obj, $fileRepository->getUsedSize($obj)));
    }

    private function serialize(User $user, int $used): array
    {
        return [
            'id' => $user->getId(),
            'displayName' => $user->getDisplayName(),
            'email' => $user->getEmail(),
            'used' => $used,
            'quota' => $user->getDriveQuota(),
        ];
    }
}
