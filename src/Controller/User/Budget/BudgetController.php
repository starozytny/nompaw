<?php

namespace App\Controller\User\Budget;

use App\Entity\Budget\BuItem;
use App\Repository\Budget\BuItemRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/planificateur', name: 'user_budget_')]
class BudgetController extends AbstractController
{
    #[Route('/{year}', name: 'index', options: ['expose' => true])]
    public function list($year, BuItemRepository $repository, SerializerInterface $serializer): Response
    {
        $data = $repository->findBy(['user' => $this->getUser(), 'year' => $year], ['dateAt' => 'DESC']);
        $data = $serializer->serialize($data, 'json', ['groups' => BuItem::LIST]);

        $today = new \DateTime();

        return $this->render('user/pages/budget/index.html.twig', [
            'year' => $year,
            'month' => $year != $today->format('Y') ? 1 : $today->format('m'),
            'donnees' => $data,
        ]);
    }
}
