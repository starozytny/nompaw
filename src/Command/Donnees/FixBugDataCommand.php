<?php

namespace App\Command\Donnees;

use App\Entity\Rando\RaImage;
use App\Service\Data\DataMain;
use App\Service\DatabaseService;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'fix:bug:data',
    description: 'Fix bug data',
)]
class FixBugDataCommand extends Command
{
    private ObjectManager $em;
    private DataMain $dataMain;

    public function __construct(DatabaseService $databaseService, DataMain $dataMain)
    {
        parent::__construct();

        $this->em = $databaseService->getDefaultManager();
        $this->dataMain = $dataMain;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Initialisation');

        $data = $this->em->getRepository(RaImage::class)->findAll();
        foreach($data as $item){
            $folder = RaImage::FOLDER;
        }


        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
