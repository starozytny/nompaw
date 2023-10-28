<?php

namespace App\Command\Donnees;

use App\Entity\Budget\BuCategory;
use App\Entity\Enum\Budget\TypeType;
use App\Entity\Main\User;
use App\Service\Data\DataBudget;
use App\Service\DatabaseService;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'donnees:budget:category',
    description: 'Init budget category data',
)]
class DonneesBudgetCategoryCommand extends Command
{
    private ObjectManager $em;
    private DataBudget $dataMain;

    public function __construct(DatabaseService $databaseService, DataBudget $dataMain)
    {
        parent::__construct();

        $this->em = $databaseService->getDefaultManager();
        $this->dataMain = $dataMain;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $users = $this->em->getRepository(User::class)->findAll();

        $io->title('Initialisation des données');
        $data =  [
            ['type' => TypeType::Expense, 'name' => "Dépenses personnelles", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Alimentation", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Cadeaux", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Habitation", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Transports", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Banque", 'goal' => null,],
            ['type' => TypeType::Expense, 'name' => "Voyage", 'goal' => null,],
            ['type' => TypeType::Income,  'name' => "Salaire", 'goal' => null,],
            ['type' => TypeType::Income,  'name' => "Cadeaux", 'goal' => null,],
            ['type' => TypeType::Income,  'name' => "Banque", 'goal' => null,],
            ['type' => TypeType::Saving,  'name' => "Voyage", 'goal' => 15000,],
        ];

        foreach($users as $user){
            if(count($user->getBuCategories()) == 0){
                $io->text($user->getDisplayName() ?: $user->getUsername());

                foreach($data as $obj){
                    $obj = $this->dataMain->setDataCategory(new BuCategory(), json_decode(json_encode($obj)));
                    $obj->setUser($user);

                    $this->em->persist($obj);
                }
            }
        }

        $io->newLine();
        $io->text('Categories : Initialisation terminée.' );
        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
