<?php

namespace App\Service\Propals;

use App\Service\ApiResponse;
use App\Service\ValidatorService;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

class PropalService
{
    public function vote(Request $request, ApiResponse $apiResponse, ValidatorService $validator,
                         $obj, $repository, $serializerName): Response
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $votes = $obj->getVotes();

        $find = false; $nVotes = [];
        foreach($votes as $vote){
            if($vote == $data->userId){
                $find = true;
            }else{
                $nVotes[] = $vote;
            }
        }

        if(!$find){
            $nVotes[] = $data->userId;
        }

        $obj->setVotes($nVotes);

        $noErrors = $validator->validate($obj);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($obj, true);
        return $apiResponse->apiJsonResponse($obj, $serializerName);
    }
}
