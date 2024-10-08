<?php

namespace App\Controller\User\Holidays;

use App\Entity\Holiday\HoLifestyle;
use App\Entity\Holiday\HoProject;
use App\Entity\Holiday\HoPropalActivity;
use App\Entity\Holiday\HoPropalDate;
use App\Entity\Holiday\HoPropalHouse;
use App\Entity\Holiday\HoTodo;
use App\Repository\Holiday\HoLifestyleRepository;
use App\Repository\Holiday\HoProjectRepository;
use App\Repository\Holiday\HoPropalActivityRepository;
use App\Repository\Holiday\HoPropalDateRepository;
use App\Repository\Holiday\HoPropalHouseRepository;
use App\Repository\Holiday\HoTodoRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/projets', name: 'user_projects_')]
class ProjectController extends AbstractController
{
    #[Route('/', name: 'index', options: ['expose' => true])]
    public function list(HoProjectRepository $repository): Response
    {
        $projects = $repository->findAll();

        return $this->render('user/pages/holidays/index.html.twig', ['projects' => $projects]);
    }

    #[Route('/projet/{slug}', name: 'read', options: ['expose' => true])]
    public function read(Request $request, $slug, SerializerInterface $serializer, HoProjectRepository $repository,
                         HoPropalDateRepository $propalDateRepository, HoPropalHouseRepository $propalHouseRepository,
                         HoPropalActivityRepository $propalActivityRepository,
                         HoTodoRepository $todoRepository, HoLifestyleRepository$lifestyleRepository): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);
        $propalDates  = $propalDateRepository->findBy(['project' => $obj]);
        $propalHouses = $propalHouseRepository->findBy(['project' => $obj]);
        $propalActivities = $propalActivityRepository->findBy(['project' => $obj]);
        $todos = $todoRepository->findBy(['project' => $obj]);
        $lifestyles = $lifestyleRepository->findBy(['project' => $obj]);

        $propalDates  = $serializer->serialize($propalDates,  'json', ['groups' => HoPropalDate::LIST]);
        $propalHouses = $serializer->serialize($propalHouses, 'json', ['groups' => HoPropalHouse::LIST]);
        $propalActivities = $serializer->serialize($propalActivities, 'json', ['groups' => HoPropalActivity::LIST]);
        $todos = $serializer->serialize($todos, 'json', ['groups' => HoTodo::LIST]);
        $lifestyles = $serializer->serialize($lifestyles, 'json', ['groups' => HoLifestyle::LIST]);


        if($this->getUser()){
            $routeName = 'user/pages/holidays/projects/read.html.twig';
        }else if($request->query->get('code') == $obj->getCode()) {
            $routeName = 'user/pages/holidays/projects/read_visitor.html.twig';
        }else{
            return $this->redirectToRoute('app_login');
        }

        return $this->render($routeName, [
            'elem' => $obj,
            'propalDates' => $propalDates,
            'propalHouses' => $propalHouses,
            'propalActivities' => $propalActivities,
            'todos' => $todos,
            'lifestyles' => $lifestyles,
        ]);
    }

    #[Route('/ajouter', name: 'create')]
    public function create(): Response
    {
        return $this->render('user/pages/holidays/projects/create.html.twig');
    }

    #[Route('/modifier/{slug}', name: 'update', options: ['expose' => true])]
    public function update($slug, HoProjectRepository $repository, SerializerInterface $serializer): Response
    {
        $obj = $repository->findOneBy(['slug' => $slug]);

        if($obj->getAuthor()->getId() != $this->getUser()->getId()){
            throw new AccessDeniedException("Vous n'avez pas l'autorisation d'accéder à cette page.");
        }

        $element = $serializer->serialize($obj,   'json', ['groups' => HoProject::FORM]);

        return $this->render('user/pages/holidays/projects/update.html.twig', [
            'elem' => $obj,
            'element' => $element,
        ]);
    }
}
