<?php

namespace App\Command\Fix;

use App\Entity\Rando\RaGroupe;
use App\Repository\Rando\RaGroupeRepository;
use App\Service\FileUploader;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'fix:groupes:images',
    description: "Convertit les illustrations des groupes d'aventures existantes en WebP (2400px max). Supprime les originaux.",
)]
class FixGroupesImagesCommand extends Command
{
    public function __construct(private readonly RaGroupeRepository $repository,
                                private readonly FileUploader $fileUploader,
                                private readonly string $publicDirectory)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption('dry-run', null, InputOption::VALUE_NONE, 'Liste les fichiers sans rien modifier');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $dryRun = $input->getOption('dry-run');
        $folder = $this->publicDirectory . RaGroupe::FOLDER_ILLU . '/';
        $before = $after = 0;

        foreach ($this->repository->findAll() as $groupe) {
            $image = $groupe->getImage();
            if (!$image || !file_exists($folder . $image)) {
                continue;
            }

            $size = filesize($folder . $image);
            $before += $size;

            if ($dryRun || str_ends_with($image, '.webp')) {
                $after += $size;
                $io->writeln(sprintf('%-40s %6d Ko%s', $groupe->getName(), $size / 1024, $dryRun ? '' : ' (déjà en WebP)'));
                continue;
            }

            $newImage = $this->fileUploader->toWebp(RaGroupe::FOLDER_ILLU, $image);
            $newSize = filesize($folder . $newImage);
            $after += $newSize;

            if ($newImage !== $image) {
                $groupe->setImage($newImage);
                $this->repository->save($groupe, true);
            }

            $io->writeln(sprintf('%-40s %6d Ko -> %6d Ko', $groupe->getName(), $size / 1024, $newSize / 1024));
        }

        $io->success(sprintf('%s : %d Ko -> %d Ko', $dryRun ? 'Dry-run' : 'Terminé', $before / 1024, $after / 1024));

        return Command::SUCCESS;
    }
}
