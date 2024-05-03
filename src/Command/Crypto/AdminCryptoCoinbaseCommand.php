<?php

namespace App\Command\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Service\DatabaseService;
use App\Service\SanitizeData;
use Doctrine\Persistence\ObjectManager;
use League\Csv\Exception;
use League\Csv\InvalidArgument;
use League\Csv\Reader;
use League\Csv\UnavailableFeature;
use League\Csv\UnavailableStream;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'admin:crypto:coinbase',
    description: 'Import data coinbase to user account',
)]
class AdminCryptoCoinbaseCommand extends Command
{
    private string $privateDirectory;
    private ObjectManager $em;
    private SanitizeData $sanitizeData;

    public function __construct($privateDirectory, DatabaseService $databaseService, SanitizeData $sanitizeData)
    {
        parent::__construct();

        $this->privateDirectory = $privateDirectory;
        $this->em = $databaseService->getDefaultManager();
        $this->sanitizeData = $sanitizeData;
    }

    protected function configure(): void
    {
        $this
            ->addArgument('userId', InputArgument::REQUIRED, 'ID user')
        ;
    }

    /**
     * @throws UnavailableStream
     * @throws InvalidArgument
     * @throws UnavailableFeature
     * @throws Exception
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $userId = $input->getArgument('userId');

        $user = $this->em->getRepository(User::class)->find($userId);
        if(!$user){
            $io->error("Utilisateur introuvable.");
            return Command::FAILURE;
        }

        $io->title('Synchronisation');

        $file = $this->privateDirectory . "import/cryptos/" . $userId . "/coinbase.csv";
        if(!file_exists($file)){
            $io->error("Fichier coinbase.csv introuvable.");
            return Command::FAILURE;
        }

        $trades = $this->em->getRepository(CrTrade::class)->findBy(['isImported' => true, 'importedFrom' => 'coinbase']);

        //read file
        $csv = Reader::createFromPath($file, 'r');
        $csv->setDelimiter(',');
        $records = $csv->getRecords();

        $i = 0;
        foreach ($records as $item) {
            if($i > 3){
                $existe = false;
                foreach($trades as $trade){
                    if($trade->getImportedId() == $item[0]){
                        $existe = true;
                    }
                }

                if(!$existe){

                    $type = $this->getType($item[2]);

                    $obj = (new CrTrade())
                        ->setIsImported(true)
                        ->setImportedFrom('coinbase')
                        ->setImportedId($item[0])
                        ->setTradeAt($this->sanitizeData->createDate($item[1]))
                        ->setType($type)
                        ->setFromCoin($type == TypeType::Achat ? $item[5] : $item[3])
                        ->setToCoin($item[3])
                        ->setFromPrice($item[7])
                        ->setNbToken($item[4])
                        ->setToPrice($item[8])
                        ->setCostPrice($item[9])
                        ->setCostCoin('EUR')
                        ->setUser($user)
                    ;

                    $this->em->persist($obj);
                }
            }

            $i++;
        }

        $this->em->flush();

        $io->newLine();
        $io->comment('--- [FIN DE LA COMMANDE] ---');
        return Command::SUCCESS;
    }

    private function getType($value): ?int
    {
        return match ($value) {
            'Receive' => TypeType::Recuperation,
            'Buy' => TypeType::Achat,
            'Deposit' => TypeType::Depot,
            'Staking Income' => TypeType::Stacking,
            'Send' => TypeType::Transfert,
            'Withdrawal' => TypeType::Retrait,
            default => null,
        };
    }
}
