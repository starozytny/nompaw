<?php

namespace App\Command\Fix;

use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Service\DatabaseService;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'fix:tmp:data',
    description: 'Fix bug data',
)]
class FixTmpDataCommand extends Command
{
    private ObjectManager $em;
    private string $privateDirectory;

    public function __construct($privateDirectory, DatabaseService $databaseService)
    {
        parent::__construct();

        $this->em = $databaseService->getDefaultManager();
        $this->privateDirectory = $privateDirectory;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Initialisation');

        $data = $this->em->getRepository(RaImage::class)->findAll();

        $imagesFilename = [];
        foreach($data as $item){
            $imagesFilename[] = $item->getFile();
            $imagesFilename[] = $item->getThumbs();
            $imagesFilename[] = $item->getLightbox();
        }

        $randos = $this->em->getRepository(RaRando::class)->findAll();

        foreach($randos as $item){
            $folderImages = $this->privateDirectory . RaRando::FOLDER_IMAGES . '/' . $item->getId();
            $folderThumbs = $this->privateDirectory . RaRando::FOLDER_THUMBS . '/' . $item->getId();
            $folderLightbox = $this->privateDirectory . RaRando::FOLDER_LIGHTBOX . '/' . $item->getId();

            $nbDeleted = 0;

            if(is_dir($folderImages)){
                $array = array_diff(scandir($folderImages), array('.', '..'));

                foreach ($array as $entry) {
                    if(!in_array($entry, $imagesFilename)){
                        if(file_exists($folderImages . "/" . $entry)){
                            unlink($folderImages . "/" . $entry);
                            $nbDeleted++;
                        }
                    }
                }
            }

            if(is_dir($folderThumbs)){
                $array = array_diff(scandir($folderThumbs), array('.', '..'));

                foreach ($array as $entry) {
                    if(!in_array($entry, $imagesFilename)){
                        if(file_exists($folderThumbs . "/" . $entry)){
                            unlink($folderThumbs . "/" . $entry);
                            $nbDeleted++;
                        }
                    }
                }
            }

            if(is_dir($folderLightbox)){
                $array = array_diff(scandir($folderLightbox), array('.', '..'));

                foreach ($array as $entry) {
                    if(!in_array($entry, $imagesFilename)){
                        if(file_exists($folderLightbox . "/" . $entry)){
                            unlink($folderLightbox . "/" . $entry);
                            $nbDeleted++;
                        }
                    }
                }
            }

            if($nbDeleted > 0){
                $io->text('- Rando : ' . $item->getId() . " - " . $item->getName());
                $io->text("Photos supprimées : " . $nbDeleted);
                $io->newLine();
            }
        }

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
