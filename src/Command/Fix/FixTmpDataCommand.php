<?php

namespace App\Command\Fix;

use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Service\DatabaseService;
use App\Service\FileUploader;
use Doctrine\Persistence\ObjectManager;
use PHPImageWorkshop\Core\Exception\ImageWorkshopLayerException;
use PHPImageWorkshop\Exception\ImageWorkshopException;
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
    private FileUploader $fileUploader;

    public function __construct($privateDirectory, DatabaseService $databaseService, FileUploader $fileUploader)
    {
        parent::__construct();

        $this->em = $databaseService->getDefaultManager();
        $this->privateDirectory = $privateDirectory;
        $this->fileUploader = $fileUploader;
    }

    /**
     * @throws ImageWorkshopLayerException
     * @throws ImageWorkshopException
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Initialisation');

        $data = $this->em->getRepository(RaRando::class)->findAll();
        foreach($data as $item){
            $privateDirectory = $this->privateDirectory;

            $oldCover = $item->getCover();
            if($oldCover){
                $img = $this->em->getRepository(RaImage::class)->findOneBy(['thumbs' => $oldCover]);

                if($img){
                    $directoryImages = $privateDirectory . RaRando::FOLDER_IMAGES . '/' . $item->getId();
                    $directoryCover = $privateDirectory . RaRando::FOLDER_COVER . '/' . $item->getId();

                    if($directoryCover){
                        if(!is_dir($directoryCover)){
                            mkdir($directoryCover, 0777, true);
                        }
                    }

                    $fileOri = $directoryImages . '/' . $img->getFile();
                    if(file_exists($fileOri)){
                        $randoFile = '/' . $item->getId();
                        $filenameLightbox = $this->fileUploader->cover($img->getFile(), RaRando::FOLDER_IMAGES.$randoFile, RaRando::FOLDER_COVER.$randoFile);

                        $item->setCover($filenameLightbox);
                    }
                }else{
                    $io->text($oldCover);
                }
            }
        }

        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
