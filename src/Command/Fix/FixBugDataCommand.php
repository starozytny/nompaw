<?php

namespace App\Command\Fix;

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
    private string $privateDirectory;

    public function __construct($publicDirectory, $privateDirectory, DatabaseService $databaseService, DataMain $dataMain)
    {
        parent::__construct();

        $this->em = $databaseService->getDefaultManager();
        $this->dataMain = $dataMain;
        $this->publicDirectory = $publicDirectory;
        $this->privateDirectory = $privateDirectory;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Initialisation');

        $data = $this->em->getRepository(RaImage::class)->findAll();
        foreach($data as $item){

            $publicDirectory = $this->publicDirectory;
            $privateDirectory = $this->privateDirectory;

            $newDirectoryImages = $privateDirectory . RaRando::FOLDER_IMAGES . '/' . $item->getRando()->getId();
            $newDirectoryThumbs = $privateDirectory . RaRando::FOLDER_THUMBS . '/' . $item->getRando()->getId();

            if($newDirectoryImages){
                if(!is_dir($newDirectoryImages)){
                    mkdir($newDirectoryImages, 0777, true);
                }
            }
            if($newDirectoryThumbs){
                if(!is_dir($newDirectoryThumbs)){
                    mkdir($newDirectoryThumbs, 0777, true);
                }
            }

            $file = $publicDirectory . $item->getFileFile();
            if(file_exists($file)){
                rename($file, $newDirectoryImages . '/' . $item->getFile());
            }
            $thumbs = $publicDirectory . $item->getThumbsFile();
            if(file_exists($thumbs)){
                rename($thumbs, $newDirectoryThumbs . '/' . $item->getThumbs());
            }
        }

        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
