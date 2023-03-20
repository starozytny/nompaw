<?php

namespace App\Controller\Api\Cook;

use App\Entity\Cook\CoRecipe;
use App\Entity\Cook\CoStep;
use App\Repository\Cook\CoRecipeRepository;
use App\Repository\Cook\CoStepRepository;
use App\Service\ApiResponse;
use App\Service\ValidatorService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/cook/instructions', name: 'api_cook_instructions_')]
class InstructionController extends AbstractController
{
    public function submitForm(CoRecipeRepository $repository, CoRecipe $recipe, Request $request, ApiResponse $apiResponse,
                               ValidatorService $validator, CoStepRepository $stepRepository): JsonResponse
    {
        $data = json_decode($request->getContent());
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $steps = $stepRepository->findBy(['recipe' => $recipe]);
        foreach($steps as $s){
            $stepRepository->remove($s);
        }

        $dataArray = (array) $data; $order = 1;
        for ($i = 1 ; $i <= $data->nbSteps ; $i++){
            $name = 'step' . $i;

            if($dataArray[$name] != "" && $dataArray[$name] != "<p><br></p>"){
                $step = (new CoStep())
                    ->setPosition($order)
                    ->setContent($dataArray[$name]->value)
                    ->setRecipe($recipe)
                ;

                $stepRepository->save($step);
                $order++;
            }
        }

        $noErrors = $validator->validate($recipe);
        if ($noErrors !== true) {
            return $apiResponse->apiJsonResponseValidationFailed($noErrors);
        }

        $repository->save($recipe, true);
        return $apiResponse->apiJsonResponseSuccessful("ok");
    }

    #[Route('/recipe/{recipe}/update', name: 'update', options: ['expose' => true], methods: 'PUT')]
    public function update(Request $request, CoRecipe $recipe, ApiResponse $apiResponse, ValidatorService $validator,
                           CoRecipeRepository $repository, CoStepRepository $stepRepository): Response
    {
        return $this->submitForm($repository, $recipe, $request, $apiResponse, $validator, $stepRepository);
    }
}
