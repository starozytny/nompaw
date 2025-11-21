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

        $updated = 0;
        foreach($data as $item){
            $filePath = $this->privateDirectory . $item->getFileFile();

            if (!file_exists($filePath)) {
                continue;
            }

            // Extraire les données EXIF
            $exif = @exif_read_data($filePath);

            if ($exif && isset($exif['DateTimeOriginal'])) {
                $dateStr = $exif['DateTimeOriginal'];
                // Format: "2024:11:21 14:30:00"
                $date = \DateTime::createFromFormat('Y:m:d H:i:s', $dateStr);

                if ($date) {
                    $item->setTakenAt($date);
                    $updated++;
                }
            } elseif ($exif && isset($exif['DateTime'])) {
                $date = \DateTime::createFromFormat('Y:m:d H:i:s', $exif['DateTime']);
                if ($date) {
                    $item->setTakenAt($date);
                    $updated++;
                }
            }

            // Flush par batch pour performance
            if ($updated % 50 === 0) {
                $this->em->flush();
                $io->writeln("Traité: {$updated} photos");
            }
        }

        $this->em->flush();

        $io->success("✅ {$updated} photos mises à jour");

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }
}
