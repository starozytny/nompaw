<?php

namespace App\Tests\Service\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Crypto\CrTradeReplayService;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class CrTradeReplayServiceIssuesTest extends TestCase
{
    private int $nextId = 1;

    private function trade(string $at, int $type, string $from, float $fromQty, string $to, float $toQty, string $platform = 'Kraken'): CrTrade
    {
        $trade = (new CrTrade())
            ->setTradeAt(new \DateTime($at))
            ->setType($type)
            ->setFromCoin($from)
            ->setFromNbToken($fromQty)
            ->setToCoin($to)
            ->setToNbToken($toQty)
            ->setImportedFrom($platform)
        ;
        $ref = new \ReflectionProperty($trade, 'id');
        $ref->setValue($trade, $this->nextId++);

        return $trade;
    }

    private function findIssues(array $trades): array
    {
        $service = new CrTradeReplayService($this->createMock(CrTradeRepository::class), $this->createMock(NormalizerInterface::class));

        return $service->findIssues($trades);
    }

    public function testCleanHistoryHasNoIssue(): void
    {
        $this->assertSame([], $this->findIssues([
            $this->trade('2023-01-01', TypeType::Depot, 'EUR', 0, 'EUR', 1000),
            $this->trade('2023-01-02', TypeType::Achat, 'EUR', 600, 'BTC', 0.02),
            $this->trade('2023-02-01', TypeType::Vente, 'BTC', 0.02, 'EUR', 700),
        ]));
    }

    public function testCascadeOfRedRowsIsOneEpisodeClosedByLaterDeposit(): void
    {
        $issues = $this->findIssues([
            $this->trade('2023-01-01', TypeType::Depot, 'EUR', 0, 'EUR', 150, 'Binance'),
            $root = $this->trade('2023-03-14', TypeType::Achat, 'EUR', 500, 'BTC', 0.02, 'Binance'),
            $this->trade('2023-03-29', TypeType::Achat, 'EUR', 150, 'ADA', 400, 'Binance'),
            $this->trade('2023-04-11', TypeType::Depot, 'EUR', 0, 'EUR', 1000, 'Binance'),
            $this->trade('2023-04-12', TypeType::Achat, 'EUR', 100, 'ETH', 0.05, 'Binance'),
        ]);

        $this->assertCount(1, $issues);
        $this->assertSame('EUR', $issues[0]['coin']);
        $this->assertSame('deposit', $issues[0]['kind']);
        $this->assertSame($root->getId(), $issues[0]['rootId']);
        $this->assertSame(2, $issues[0]['count']);
        $this->assertEqualsWithDelta(350, $issues[0]['rootDeficit'], 0.001);
        $this->assertEqualsWithDelta(500, $issues[0]['maxDeficit'], 0.001);
        $this->assertNotNull($issues[0]['endAt']);
        $this->assertSame('Binance', $issues[0]['platform']);
    }

    public function testCryptoSoldWithoutHoldingIsTransferAndSmallGapIsReward(): void
    {
        $issues = $this->findIssues([
            $this->trade('2022-01-01', TypeType::Depot, 'EUR', 0, 'EUR', 2000),
            $this->trade('2022-01-02', TypeType::Achat, 'EUR', 400, 'ETH', 0.3),
            $this->trade('2022-01-03', TypeType::Achat, 'EUR', 1000, 'SOL', 12.5),
            $this->trade('2023-06-18', TypeType::Vente, 'ETH', 0.8, 'EUR', 1400),
            $this->trade('2024-03-11', TypeType::Vente, 'SOL', 12.6, 'EUR', 1500),
        ]);

        $this->assertSame(['ETH', 'SOL'], array_column($issues, 'coin'));
        $this->assertSame('transfer', $issues[0]['kind']);
        $this->assertNull($issues[0]['endAt']);
        $this->assertSame('reward', $issues[1]['kind']);
        $this->assertEqualsWithDelta(0.1, $issues[1]['maxDeficit'], 0.0001);
    }

    public function testCoinFlappingAroundZeroIsOneIssueWhoseFixClearsEverything(): void
    {
        $issues = $this->findIssues([
            $this->trade('2021-04-01', TypeType::Vente, 'USDC', 50, 'EUR', 45),
            $this->trade('2021-04-20', TypeType::Achat, 'EUR', 60, 'USDC', 60),
            $this->trade('2021-05-01', TypeType::Vente, 'USDC', 30, 'EUR', 27),
            $this->trade('2021-11-05', TypeType::Vente, 'USDC', 40, 'EUR', 36),
        ]);

        $usdc = array_values(array_filter($issues, fn (array $i) => $i['coin'] === 'USDC'));
        $this->assertCount(1, $usdc);
        $this->assertSame(1, $usdc[0]['rootId']);
        $this->assertSame(3, $usdc[0]['count']);
        // balances: -50, +10, -20, -60 -> adding 60 before the first sale keeps it >= 0 throughout
        $this->assertEqualsWithDelta(60, $usdc[0]['maxDeficit'], 0.001);
        $this->assertNull($usdc[0]['endAt']);
    }
}
