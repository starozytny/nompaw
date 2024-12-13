<?php

namespace App\Command\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Service\DatabaseService;
use App\Service\SanitizeData;
use Doctrine\Persistence\ObjectManager;
use PhpOffice\PhpSpreadsheet\Reader\Exception;
use PhpOffice\PhpSpreadsheet\Reader\Xlsx;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'admin:crypto:tableur',
    description: 'Import data tableur to user account',
)]
class AdminCryptoTableurCommand extends Command
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

        $file = $this->privateDirectory . "import/cryptos/" . $userId . "/cryptos.xlsx";
        if(!file_exists($file)){
            $io->error("Fichier cryptos.xlsx introuvable.");
            return Command::FAILURE;
        }

        $trades = $this->em->getRepository(CrTrade::class)->findBy(['user' => $user]);
        foreach($trades as $trade) {
            $this->em->remove($trade);
        }

        $this->em->flush();

        //read file
        $reader = new Xlsx();
        $records = $reader->load($file);

        foreach ($records->getActiveSheet()->toArray() as $item) {
            if($item[6]) { // Achat
                if($item[8] !== "FREE" && $item[8] !== "DON") {
                    $obj = (new CrTrade())
                        ->setTradeAt($this->sanitizeData->createDate($item[6], null, 'd F Y'))
                        ->setType(TypeType::Achat)

                        ->setFromCoin($item[7] ?: "EUR")
                        ->setFromPrice($item[7] ? 0 : 1)
                        ->setFromNbToken($item[7] ? $this->toFloatData($item[8]) : $this->toFloatData($item[10]))

                        ->setToCoin($item[9])
                        ->setToPrice($this->toFloatData($item[12]))
                        ->setToNbToken($this->toFloatData($item[11]))

                        ->setCostPrice(0)
                        ->setCostCoin('EUR')

                        ->setTotalReal($this->toFloatData($item[10]))
                        ->setTotal($this->toFloatData($item[10]))

                        ->setUser($user)
                    ;

                    $this->em->persist($obj);
                }else{
                    $obj = (new CrTrade())
                        ->setTradeAt($this->sanitizeData->createDate($item[6], null, 'd F Y'))
                        ->setType(TypeType::Recuperation)

                        ->setFromCoin("EUR")
                        ->setFromPrice(1)
                        ->setFromNbToken($this->toFloatData($item[10]))

                        ->setToCoin($item[9])
                        ->setToPrice($this->toFloatData($item[12]))
                        ->setToNbToken($this->toFloatData($item[11]))

                        ->setCostPrice(0)
                        ->setCostCoin('EUR')

                        ->setTotalReal($this->toFloatData($item[10]))
                        ->setTotal($this->toFloatData($item[10]))

                        ->setUser($user)
                    ;

                    $this->em->persist($obj);
                }
            }

            if($item[19]) { // Vente
                $obj = (new CrTrade())
                    ->setTradeAt($this->sanitizeData->createDate($item[19], null, 'd F Y'))
                    ->setType(TypeType::Vente)

                    ->setFromCoin($item[20])
                    ->setFromPrice($this->toFloatData($item[23]))
                    ->setFromNbToken($this->toFloatData($item[22]))

                    ->setToCoin('EUR')
                    ->setToPrice(1)
                    ->setToNbToken($this->toFloatData($item[21]))

                    ->setCostPrice(0)
                    ->setCostCoin('EUR')

                    ->setTotalReal($this->toFloatData($item[21]))
                    ->setTotal($this->toFloatData($item[21]))

                    ->setUser($user)
                ;

                $this->em->persist($obj);
            }

            if($item[26]) { // retrait
                $obj = (new CrTrade())
                    ->setTradeAt($this->sanitizeData->createDate($item[26], null, 'd F Y'))
                    ->setType(TypeType::Retrait)

                    ->setFromCoin("EUR")
                    ->setFromPrice(1)
                    ->setFromNbToken($this->toFloatData($item[27]))

                    ->setToCoin('EUR')
                    ->setToPrice(1)
                    ->setToNbToken($this->toFloatData($item[27]))

                    ->setCostPrice(0)
                    ->setCostCoin('EUR')

                    ->setTotalReal($this->toFloatData($item[27]))
                    ->setTotal($this->toFloatData($item[27]))

                    ->setUser($user)
                ;

                $this->em->persist($obj);
            }

            if($item[2]) { // dépot
                $obj = (new CrTrade())
                    ->setTradeAt($this->sanitizeData->createDate($item[1], null, 'd F Y'))
                    ->setType(TypeType::Depot)

                    ->setFromCoin("EUR")
                    ->setFromPrice(1)
                    ->setFromNbToken($this->toFloatData($item[3]))

                    ->setToCoin('EUR')
                    ->setToPrice(1)
                    ->setToNbToken($this->toFloatData($item[3]))

                    ->setCostPrice(0)
                    ->setCostCoin('EUR')

                    ->setTotalReal($this->toFloatData($item[3]))
                    ->setTotal($this->toFloatData($item[3]))

                    ->setUser($user)
                ;

                $this->em->persist($obj);
            }
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

    private function toFloatData ($value): float
    {
        return floatval(str_replace(',', '.', $value));
    }
}
