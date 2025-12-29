<?php

namespace App\Controller;


use App\Entity\Main\User;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre', name: 'user_')]
class UserController extends AbstractController
{
    #[Route('/', name: 'homepage')]
    public function index(): Response
    {
        return $this->render('user/pages/index.html.twig');
    }

    #[Route('/profil', name: 'profil_index', options: ['expose' => true])]
    public function profil(SerializerInterface $serializer): Response
    {
        $obj = $serializer->serialize($this->getUser(), 'json', ['groups' => User::FORM]);
        return $this->render('user/pages/profil/update.html.twig', ['obj' => $obj]);
    }
}
