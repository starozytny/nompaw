<?php

namespace App\Controller\Api\Cook;

use App\Entity\Cook\CoFavorite;
use App\Entity\Cook\CoRecipe;
use App\Service\ApiResponse;
use Doctrine\Persistence\ManagerRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/api/cook/favorites', name: 'api_cook_favorites_')]
class FavoriteController extends AbstractController
{
    #[Route('/{id}', name: 'favorite', options: ['expose' => true], methods: 'POST')]
    public function delete($id, ManagerRegistry $registry, ApiResponse $apiResponse): Response
    {
        $em = $registry->getManager();

        $obj = $em->getRepository(CoRecipe::class)->findOneBy(['id' => $id]);
        if(!$obj){
            return $apiResponse->apiJsonResponseBadRequest('Objet introuvable');
        }

        $existe = $em->getRepository(CoFavorite::class)->findOneBy([
            'user' => $this->getUser(),
            'identifiant' => $obj->getId()
        ]);

        if($existe){
            $em->remove($existe);
            $returnValue = 0;
        }else{
            $fav = (new CoFavorite())
                ->setUser($this->getUser())
                ->setIdentifiant($obj->getId())
            ;

            $em->persist($fav);
            $returnValue = 1;
        }

        $em->flush();
        return $apiResponse->apiJsonResponseCustom(['code' => $returnValue]);
    }
}
