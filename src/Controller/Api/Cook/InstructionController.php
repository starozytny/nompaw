<?php

namespace App\Controller\Api\Cook;

use App\Entity\Cook\CoRecipe;
use App\Entity\Cook\CoStep;
use App\Repository\Cook\CoRecipeRepository;
use App\Repository\Cook\CoStepRepository;
use App\Service\ApiResponse;
use App\Service\FileUploader;
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
                               ValidatorService $validator, FileUploader $fileUploader, CoStepRepository $stepRepository): JsonResponse
    {
        $data = json_decode($request->get('data'));
        if ($data === null) {
            return $apiResponse->apiJsonResponseBadRequest('Les données sont vides.');
        }

        $steps = $stepRepository->findBy(['recipe' => $recipe]);
        $dataArray = (array) $data; $order = 1;

        for ($i = 1 ; $i <= $data->nbSteps ; $i++){

            $step = new CoStep();
            foreach($steps as $s){
                if($s->getPosition() == $i){
                    $step = $s;
                }
            }

            $name = 'step' . $i;
            if($dataArray[$name] != ""){

                for($j = 0 ; $j <= 2 ; $j++){
                    $file = $request->files->get('image' . $j . 'File-' . $i);
                    if ($file) {
                        $oldFile = match ($j) {
                            0 => $step->getImage0(),
                            1 => $step->getImage1(),
                            2 => $step->getImage2(),
                            default => null,
                        };

                        $folder = CoStep::FOLDER . '/' . $recipe->getSlug();
                        $fileName = $fileUploader->replaceFile($file, $folder, $oldFile, true, 450);

                        $step = match ($j) {
                            0 => $step->setImage0($fileName),
                            1 => $step->setImage1($fileName),
                            2 => $step->setImage2($fileName),
                            default => null,
                        };
                    }
                }

                $step = ($step)
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

    #[Route('/recipe/{recipe}/update', name: 'update', options: ['expose' => true], methods: 'POST')]
    public function update(Request $request, CoRecipe $recipe, ApiResponse $apiResponse, ValidatorService $validator,
                           FileUploader $fileUploader, CoRecipeRepository $repository, CoStepRepository $stepRepository): Response
    {
        return $this->submitForm($repository, $recipe, $request, $apiResponse, $validator, $fileUploader, $stepRepository);
    }
}
