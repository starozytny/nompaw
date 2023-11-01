<?php

namespace App\Command\Donnees;

use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
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
    private string $publicDirectory;

    public function __construct($publicDirectory, DatabaseService $databaseService, DataMain $dataMain)
    {
        parent::__construct();

        $this->em = $databaseService->getDefaultManager();
        $this->dataMain = $dataMain;
        $this->publicDirectory = $publicDirectory;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Initialisation');

        $data = $this->em->getRepository(RaImage::class)->findAll();
        foreach($data as $item){
            $folder = $this->publicDirectory;

            $file = $folder . $item->getFileFile();
            if(file_exists($file)){
                $item->setMTime(filemtime($file));
            }
        }

        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
