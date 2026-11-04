<?php

namespace App\Command\Invest;

use App\Entity\Enum\Invest\EnveloppeType;
use App\Entity\Invest\InEnveloppe;
use App\Entity\Invest\InLine;
use App\Entity\Invest\InSnapshot;
use App\Entity\Main\User;
use App\Repository\Invest\InEnveloppeRepository;
use DateTime;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * One-shot seed of Shanbo's (user_id=1) real positions as of 2026-11-04, from docs/INVEST_CONTEXT.md,
 * so the Invest module starts with real data instead of an empty page. Not meant to be run twice:
 * aborts if the user already has an InEnveloppe.
 */
#[AsCommand(
    name: 'app:invest:seed-initial-data',
    description: "Seed les positions d'investissement initiales de l'utilisateur 1 à partir de docs/INVEST_CONTEXT.md",
)]
class SeedInvestDataCommand extends Command
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly InEnveloppeRepository $enveloppeRepository,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $user = $this->em->find(User::class, 1);
        if (!$user) {
            $io->error('Utilisateur 1 introuvable.');
            return Command::FAILURE;
        }

        if (!empty($this->enveloppeRepository->findAllByUser($user))) {
            $io->error("L'utilisateur a déjà des enveloppes d'investissement : commande déjà exécutée, abandon.");
            return Command::FAILURE;
        }

        $date = new DateTime('2026-11-04');
        $position = 0;

        $this->createEnveloppe($user, 'PEA XTB', EnveloppeType::Pea, 258, new DateTime('2031-01-01'), $position++, $date, [
            'MSCI World ETF' => 509.21,
            'MSCI Europe ETF' => 158.84,
            'BNP Paribas Easy Bloomberg Europe Defense Acc' => [92.44, 'LU3047998896'],
            'Cash à investir' => 58.57,
        ]);

        $this->createEnveloppe($user, 'AV Linxea', EnveloppeType::Av, 257, null, $position++, $date, [
            'Fonds euros FONDSEURNG' => 400.00,
            'Amundi MSCI World Swap Acc' => [320.95, 'LU1681043599'],
            'Amundi Core Nasdaq-100 Swap Acc' => [330.14, 'LU1829221024'],
        ]);

        $this->createEnveloppe($user, 'CTO XTB', EnveloppeType::Cto, 259, null, $position++, $date, [
            'Non détaillé (à affiner)' => 350.00,
        ]);

        $this->createEnveloppe($user, 'Livret A', EnveloppeType::Livret, null, null, $position++, $date, [
            'Livret A' => 1080.00,
        ]);

        $this->createEnveloppe($user, 'Épargne de précaution', EnveloppeType::Livret, 203, null, $position++, $date, [
            'Solde' => 2000.00,
        ]);

        $this->em->flush();

        $io->success("Positions d'investissement initiales créées pour l'utilisateur 1.");
        return Command::SUCCESS;
    }

    /**
     * @param array<string, float|array{0: float, 1: string}> $lines name => value, or [value, isin]
     */
    private function createEnveloppe(User $user, string $name, EnveloppeType $type, ?int $buCategoryId,
                                      ?DateTime $taxExemptDate, int $position, DateTime $date, array $lines): void
    {
        $enveloppe = (new InEnveloppe())
            ->setUser($user)
            ->setName($name)
            ->setType($type)
            ->setBuCategoryId($buCategoryId)
            ->setTaxExemptDate($taxExemptDate)
            ->setPosition($position)
        ;
        $this->em->persist($enveloppe);

        $linePosition = 0;
        foreach ($lines as $lineName => $value) {
            [$amount, $isin] = is_array($value) ? $value : [$value, null];

            $line = (new InLine())
                ->setEnveloppe($enveloppe)
                ->setName($lineName)
                ->setIsin($isin)
                ->setPosition($linePosition++)
            ;
            $this->em->persist($line);

            $snapshot = (new InSnapshot())
                ->setLine($line)
                ->setDate($date)
                ->setValue($amount)
            ;
            $this->em->persist($snapshot);
        }
    }
}
