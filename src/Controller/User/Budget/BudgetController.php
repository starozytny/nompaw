<?php

namespace App\Controller\User\Budget;

use App\Entity\Budget\BuCategory;
use App\Entity\Budget\BuItem;
use App\Entity\Budget\BuRecurrent;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Repository\Budget\BuCategoryRepository;
use App\Repository\Budget\BuItemRepository;
use App\Repository\Budget\BuRecurrentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Serializer\SerializerInterface;

#[Route('/espace-membre/planificateur', name: 'user_budget_')]
class BudgetController extends AbstractController
{
    #[Route('/planning/{year}', name: 'index', options: ['expose' => true])]
    public function list($year, BuItemRepository $repository, BuRecurrentRepository $recurrentRepository,
                         BuCategoryRepository $categoryRepository, SerializerInterface $serializer): Response
    {
        /** @var User $user */
        $user = $this->getUser();
        if($year < $user->getBudgetYear()){
            return $this->redirectToRoute('user_budget_index', ['year' => $user->getBudgetYear()]);
        }

        $data         = $repository->findBy(['user' => $user, 'year' => $year], ['dateAt' => 'DESC']);
        $categories   = $categoryRepository->findBy(['user' => $user]);
        $savings      = $categoryRepository->findBy(['user' => $user, 'type' => TypeType::Saving]);
        $savingsItems = $repository->findBy(['user' => $user, 'type' => TypeType::Saving]);
        $recurrences  = $recurrentRepository->findBy(['user' => $user]);

        $totalInit = $user->getBudgetInit();
        if($year > $user->getBudgetYear()){
            //
            // TODO : Create entity Total to store total by year for improve performance
            //
            $items = $repository->findBy(['user' => $user]);

            $totalExpense = 0; $totalIncome = 0;
            for($i = $user->getBudgetYear() ; $i < $year ; $i++){
                for($j = 0; $j < 12 ; $j++){
                    foreach($recurrences as $re){
                        if($i > $re->getInitYear() || ($re->getInitYear() == $i && $j + 1 >= $re->getInitMonth())){
                            if(in_array($j + 1, $re->getMonths())){
                                if($re->getType() != TypeType::Income){
                                    $totalExpense += $re->getPrice();
                                }else{
                                    $totalIncome += $re->getPrice();
                                }
                            }
                        }
                    }
                }
            }

            foreach($items as $item){
                $substractTotal = false;
                if($item->getType() !== TypeType::Deleted){
                    if($item->getYear() < $year){
                        if($item->getType() != TypeType::Income){
                            $totalExpense += $item->getPrice();
                        }else{
                            $totalIncome += $item->getPrice();
                        }

                        if($item->getRecurrenceId()){
                            $substractTotal = true;
                        }
                    }
                }else{
                    if($item->getRecurrenceId()){
                        $substractTotal = true;
                    }
                }

                if($substractTotal){
                    if($item->getType() != TypeType::Income){
                        $totalExpense -= $item->getRecurrencePrice();
                    }else{
                        $totalIncome -= $item->getRecurrencePrice();
                    }
                }
            }

            $totalInit = $totalInit + $totalIncome - $totalExpense;
        }

        $data         = $serializer->serialize($data,         'json', ['groups' => BuItem::LIST]);
        $categories   = $serializer->serialize($categories,   'json', ['groups' => BuCategory::SELECT]);
        $savings      = $serializer->serialize($savings,      'json', ['groups' => BuCategory::LIST]);
        $savingsItems = $serializer->serialize($savingsItems, 'json', ['groups' => BuItem::LIST]);
        $recurrences  = $serializer->serialize($recurrences,  'json', ['groups' => BuRecurrent::LIST]);

        $today = new \DateTime();

        return $this->render('user/pages/budget/index.html.twig', [
            'year' => $year,
            'month' => $year != $today->format('Y') ? 1 : $today->format('m'),
            'donnees' => $data,
            'categories' => $categories,
            'savings' => $savings,
            'savingsItems' => $savingsItems,
            'recurrences' => $recurrences,
            'initTotal' => $totalInit,
        ]);
    }
}
