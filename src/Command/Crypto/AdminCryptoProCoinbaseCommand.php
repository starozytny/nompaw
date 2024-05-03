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
    name: 'admin:crypto:procoinbase',
    description: 'Import data coinbase pro to user account',
)]
class AdminCryptoProCoinbaseCommand extends Command
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
            ->addArgument('year', InputArgument::REQUIRED, 'année à traiter')
        ;
    }

    /**
     * @throws UnavailableStream
     * @throws InvalidArgument
     * @throws UnavailableFeature
     * @throws Exception
     * @throws \Exception
     */
    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $userId = $input->getArgument('userId');
        $year = $input->getArgument('year');

        $user = $this->em->getRepository(User::class)->find($userId);
        if(!$user){
            $io->error("Utilisateur introuvable.");
            return Command::FAILURE;
        }

        $io->title('Synchronisation');

        $file = $this->privateDirectory . "import/cryptos/" . $userId . "/coinbase-pro/fills/" . $year . ".csv";
        if(!file_exists($file)){
            $io->error("Fichier coinbase pro " . $year . ".csv introuvable.");
            return Command::FAILURE;
        }

        $trades = $this->em->getRepository(CrTrade::class)->findBy(['isImported' => true, 'importedFrom' => 'Coinbase Pro']);

        //read file
        $csv = Reader::createFromPath($file, 'r');
        $csv->setDelimiter(',');
        $records = $csv->getRecords();

        $i = 0;
        foreach ($records as $item) {
            if($i > 1){
                $existe = false;
                foreach($trades as $trade){
                    if($trade->getImportedId() == $item[1]){
                        $existe = $trade;
                    }
                }

                if($existe){

                    $type = $this->getType($item[3]);

                    $obj = ($existe)
                        ->setIsImported(true)
                        ->setImportedFrom('Coinbase Pro')
                        ->setImportedId($item[1])
                        ->setTradeAt($this->sanitizeData->createDate($item[4]))
                        ->setType($type)
                        ->setFromCoin($type == TypeType::Achat ? $item[10] : $item[6])
                        ->setToCoin($type == TypeType::Achat ? $item[6] : $item[10])
                        ->setFromPrice($item[7])
                        ->setNbToken($type == TypeType::Achat ? $item[9] * (-1) : $item[5])
                        ->setToPrice($type == TypeType::Achat ? $item[5] : $item[9] * (-1))
                        ->setCostPrice($item[8])
                        ->setTotal(($item[9] - $item[8]) * (-1))
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
            'BUY' => TypeType::Achat,
            'SELL' => TypeType::Vente,
            default => null,
        };
    }
}