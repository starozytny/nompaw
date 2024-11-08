<?php

namespace App\Command\Fix;

use App\Entity\Rando\RaImage;
use App\Entity\Rando\RaRando;
use App\Service\DatabaseService;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
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

    protected function configure(): void
    {
        $this
            ->addArgument('rando_id', InputArgument::REQUIRED, 'rando id')
        ;
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Initialisation');

        $randoId = $input->getArgument('rando_id');

        $rando = $this->em->getRepository(RaRando::class)->findOneBy(['id' => $randoId]);

        $folderCover = $this->privateDirectory . RaRando::FOLDER_COVER . '/' . $randoId;
        if(file_exists($folderCover . "/" . $rando->getCover())){
            unlink($folderCover . "/" . $rando->getCover());
        }

        $images = $this->em->getRepository(RaImage::class)->findBy(['rando' => $rando]);

        foreach($images as $item){
            $folderImages = $this->privateDirectory . RaRando::FOLDER_IMAGES . '/' . $randoId;
            $folderThumbs = $this->privateDirectory . RaRando::FOLDER_THUMBS . '/' . $randoId;
            $folderLightbox = $this->privateDirectory . RaRando::FOLDER_LIGHTBOX . '/' . $randoId;

            if(file_exists($folderImages . "/" . $item->getFile())){
                unlink($folderImages . "/" . $item->getFile());
            }

            if(file_exists($folderThumbs . "/" . $item->getThumbs())){
                unlink($folderThumbs . "/" . $item->getThumbs());
            }

            if(file_exists($folderLightbox . "/" . $item->getLightbox())){
                unlink($folderLightbox . "/" . $item->getLightbox());
            }

            $this->em->remove($item);
        }
        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
