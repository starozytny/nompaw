<?php

namespace App\Controller\User\Birthdays;

use App\Entity\Birthday\BiBirthday;
use App\Entity\Birthday\BiPresent;
use App\Repository\Birthday\BiBirthdayRepository;
use App\Repository\Birthday\BiPresentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/anniversaires', name: 'user_birthdays_')]
class BirthdayController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function list(BiBirthdayRepository $repository): Response
    {
        $birthdays = $repository->findBy(['author' => $this->getUser()]);

        return $this->render('user/pages/birthdays/index.html.twig', ['birthdays' => $birthdays]);
    }

    #[Route('/anniversaire/{slug}', name: 'read', options: ['expose' => true])]
    public function read(Request $request, $slug, SerializerInterface $serializer, BiBirthdayRepository $repository,
                         BiPresentRepository $presentRepository): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);
        $presents  = $presentRepository->findBy(['birthday' => $obj]);

        $presents  = $serializer->serialize($presents,  'json', ['groups' => BiPresent::LIST]);

        if($this->getUser()){
            $routeName = 'user/pages/birthdays/birthday/read.html.twig';
        }else if($request->query->get('code') == $obj->getCode()) {
            $routeName = 'user/pages/birthdays/birthday/read_visitor.html.twig';
        }else{
            return $this->redirectToRoute('app_login');
        }

        return $this->render($routeName, [
            'elem' => $obj,
            'presents' => $presents,
        ]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(): Response
    {
        return $this->render('user/pages/birthdays/birthday/create.html.twig');
    }

    #[Route('/modifier/{slug}', name: 'update', options: ['expose' => true])]
    public function update($slug, BiBirthdayRepository $repository, SerializerInterface $serializer): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $element = $serializer->serialize($obj,   'json', ['groups' => BiBirthday::FORM]);

        return $this->render('user/pages/birthdays/birthday/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
        ]);
    }
}
