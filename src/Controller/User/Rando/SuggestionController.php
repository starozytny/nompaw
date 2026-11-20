<?php

namespace App\Controller\User\Rando;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/espace-membre/suggestions', name: 'user_suggestions_')]
class SuggestionController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true], methods: 'GET')]
    public function index(): Response
    {
        return $this->render('user/pages/suggestions/index.html.twig');
    }
}
