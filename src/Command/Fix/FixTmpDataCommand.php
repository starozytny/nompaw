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

        $data = $this->em->getRepository(RaImage::class)->findAll();
        foreach($data as $item){
            $privateDirectory = $this->privateDirectory;

            $directoryImages = $privateDirectory . RaRando::FOLDER_IMAGES . '/' . $item->getRando()->getId();
            $directoryLightbox = $privateDirectory . RaRando::FOLDER_LIGHTBOX . '/' . $item->getRando()->getId();

            if($directoryLightbox){
                if(!is_dir($directoryLightbox)){
                    mkdir($directoryLightbox, 0777, true);
                }
            }

            if(file_exists($directoryLightbox . '/lightbox-' . $item->getFile())){
                $item->setLightbox('/lightbox-' . $item->getFile());
            }else{
                $fileOri = $directoryImages . '/' . $item->getFile();
                if(file_exists($fileOri)){
                    $randoFile = '/' . $item->getRando()->getId();
                    $filenameLightbox = $this->fileUploader->lightbox($item->getFile(), RaRando::FOLDER_IMAGES.$randoFile, RaRando::FOLDER_LIGHTBOX.$randoFile);

                    $item->setLightbox($filenameLightbox);
                }
            }
        }

        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
