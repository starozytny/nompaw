<?php

namespace App\Controller\User\Blog;


use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

#[Route('/espace-membre/blog', name: 'user_blog_')]
class BlogController extends AbstractController
{
    #[Route('/cochons-chamonix', name: 'cochons_chamonix')]
    public function cochonChamonix(): Response
    {
        return $this->render('user/pages/blog/cochons/chamonix.html.twig');
    }
}
