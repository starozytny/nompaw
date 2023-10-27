<?php

namespace App\Controller\User\Budget;

use App\Entity\Budget\BuItem;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
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
        /** @var User $user */
        $user = $this->getUser();
        if($year < $user->getBudgetYear()){
            return $this->redirectToRoute('user_budget_index', ['year' => $user->getBudgetYear()]);
        }

        $totalInit = $user->getBudgetInit();
        if($year > $user->getBudgetYear()){
            //
            // TODO : Create entity Total to store total by year for improve perfomance
            //
            $items = $repository->findBy(['user' => $user]);

            $totalExpense = 0; $totalIncome = 0;
            foreach($items as $item){
                if($item->getYear() < $year){
                    if($item->getType() != TypeType::Income){
                        $totalExpense += $item->getPrice();
                    }else{
                        $totalIncome += $item->getPrice();
                    }
                }
            }

            $totalInit = $totalInit + $totalIncome - $totalExpense;
        }

        $data = $repository->findBy(['user' => $user, 'year' => $year], ['dateAt' => 'DESC']);
        $data = $serializer->serialize($data, 'json', ['groups' => BuItem::LIST]);

        $today = new \DateTime();

        return $this->render('user/pages/budget/index.html.twig', [
            'year' => $year,
            'month' => $year != $today->format('Y') ? 1 : $today->format('m'),
            'donnees' => $data,
            'initTotal' => $totalInit,
        ]);
    }
}
