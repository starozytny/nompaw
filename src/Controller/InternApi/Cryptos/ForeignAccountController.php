<?php

namespace App\Controller\InternApi\Cryptos;

use App\Entity\Crypto\CrForeignAccount;
use App\Repository\Crypto\CrForeignAccountRepository;
use App\Service\Api\ApiResponse;
use App\Service\Crypto\CrForeignAccountService;
use App\Service\Data\DataCrypto;
use App\Service\Export;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/intern/api/cryptos/foreign-accounts', name: 'intern_api_cryptos_foreign_accounts_')]
class ForeignAccountController extends AbstractController
{
    #[Route('/list', name: 'list', options: ['expose' => true], methods: 'GET')]
    public function list(CrForeignAccountService $accountService, CrForeignAccountRepository $repository, ApiResponse $apiResponse): Response
    {
        $user = $this->getUser();
        $accountService->sync($user);

        return $apiResponse->apiJsonResponse($repository->findBy(['user' => $user], ['openedAt' => 'ASC']), CrForeignAccount::LIST);
    }

    private function submitForm(string $type, CrForeignAccountRepository $repository, CrForeignAccount $obj, Request $request,
                                 ApiResponse $apiResponse, ValidatorService $validator, DataCrypto $dataEntity): JsonResponse
    {
        if ($type === 'update' && $obj->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden('Accès non autorisé.');
        }

        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $obj = $dataEntity->setDataForeignAccount($obj, $data);
        $obj->setUser($this->getUser());

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);

        return $apiResponse->apiJsonResponse($obj, CrForeignAccount::LIST);
    }

    #[Route('/create', name: 'create', options: ['expose' => true], methods: 'POST')]
    public function create(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                            DataCrypto $dataEntity, CrForeignAccountRepository $repository): Response
    {
        return $this->submitForm('create', $repository, new CrForeignAccount(), $request, $apiResponse, $validator, $dataEntity);
    }

    #[Route('/update/{id}', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, CrForeignAccount $obj, ApiResponse $apiResponse, ValidatorService $validator,
                            DataCrypto $dataEntity, CrForeignAccountRepository $repository): Response
    {
        return $this->submitForm('update', $repository, $obj, $request, $apiResponse, $validator, $dataEntity);
    }

    #[Route('/delete/{id}', name: 'delete', options: ['expose' => true], methods: 'DELETE')]
    public function delete(CrForeignAccount $obj, CrForeignAccountRepository $repository, ApiResponse $apiResponse): Response
    {
        if ($obj->getUser() !== $this->getUser()) {
            return $apiResponse->apiJsonResponseForbidden('Accès non autorisé.');
        }

        $repository->remove($obj, true);

        return $apiResponse->apiJsonResponseSuccessful('ok');
    }

    #[Route('/export', name: 'export', options: ['expose' => true], methods: 'GET')]
    public function export(Request $request, CrForeignAccountRepository $repository, Export $export, ApiResponse $apiResponse): BinaryFileResponse|JsonResponse
    {
        $userId = $this->getUser()->getId();
        $nameFolder = "export/cryptos-foreign-accounts/{$userId}/";
        $fileName = "comptes-etrangers-3916bis.xlsx";

        if ($request->query->get('file')) {
            return $this->file($this->getParameter('private_directory') . $nameFolder . $fileName);
        }

        $accounts = $repository->findBy(['user' => $this->getUser()], ['openedAt' => 'ASC']);

        $header = [['Plateforme', 'Identifiant de compte', 'Adresse', 'Date d\'ouverture', 'Date de clôture', 'Notes']];
        $data = [];
        foreach ($accounts as $account) {
            $data[] = [
                $account->getPlatform(),
                $account->getAccountIdentifier() ?? '',
                $account->getAddress() ?? '',
                $account->getOpenedAt()?->format('Y-m-d') ?? '',
                $account->getClosedAt()?->format('Y-m-d') ?? '',
                $account->getNotes() ?? '',
            ];
        }

        $export->createFile('excel', 'Comptes crypto étrangers (3916-BIS)', $fileName, $header, $data, 6, $nameFolder);

        return $apiResponse->apiJsonResponseCustom(['url' => $this->generateUrl('intern_api_cryptos_foreign_accounts_export', ['file' => 1])]);
    }
}
