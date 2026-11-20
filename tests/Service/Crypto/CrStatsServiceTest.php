<?php

namespace App\Tests\Service\Crypto;

use App\Entity\Crypto\CrTrade;
use App\Entity\Enum\Crypto\TypeType;
use App\Entity\Main\User;
use App\Repository\Crypto\CrPriceHistoryRepository;
use App\Repository\Crypto\CrTradeRepository;
use App\Service\Crypto\CrPriceService;
use App\Service\Crypto\CrStatsService;
use App\Service\Crypto\CrTradeReplayService;
use PHPUnit\Framework\TestCase;
use Psr\Log\NullLogger;
use Symfony\Component\HttpClient\MockHttpClient;
use Symfony\Component\HttpClient\Response\MockResponse;
use Symfony\Component\Serializer\Normalizer\NormalizerInterface;

class CrStatsServiceTest extends TestCase
{
    private int $nextId = 1;

    private function trade(string $at, int $type, string $from, float $fromQty, string $to, float $toQty, float $eur): CrTrade
    {
        $trade = (new CrTrade())->setTradeAt(new \DateTime($at))->setType($type)
            ->setFromCoin($from)->setFromNbToken($fromQty)->setToCoin($to)->setToNbToken($toQty)
            ->setTotal($eur)->setTotalReal($eur);
        (new \ReflectionProperty($trade, 'id'))->setValue($trade, $this->nextId++);

        return $trade;
    }

    /** @param array<string, array<string, float>> $prices */
    private function service(array $trades, array $prices): CrStatsService
    {
        $tradeRepo = $this->createMock(CrTradeRepository::class);
        $tradeRepo->method('findBy')->willReturn($trades);
        $priceRepo = $this->createMock(CrPriceHistoryRepository::class);
        $priceRepo->method('findWeeklyPrices')->willReturn($prices);
        $replay = new CrTradeReplayService($tradeRepo, $this->createMock(NormalizerInterface::class));

        return new CrStatsService($tradeRepo, $replay, $priceRepo, $this->createMock(CrPriceService::class));
    }

    public function testWeeklyQuantitiesPricesAndInvested(): void
    {
        $service = $this->service([
            $this->trade('2024-01-01 10:00', TypeType::Depot, 'EUR', 0, 'EUR', 1000, 1000),   // Monday
            $this->trade('2024-01-02 10:00', TypeType::Achat, 'EUR', 500, 'BTC', 0.02, 500),
            $this->trade('2024-01-10 10:00', TypeType::Vente, 'BTC', 0.005, 'EUR', 200, 200),
        ], [
            // Sundays 2024-01-07 and 2024-01-14; no price on 2024-01-21 → reuses the 14th (within 14 days)
            'BTC' => ['2024-01-07' => 40000.0, '2024-01-14' => 42000.0],
        ]);

        $points = $service->coinSeries(new User(), 'BTC');

        $this->assertSame('2024-01-07', $points[0]['date']);
        $this->assertEqualsWithDelta(0.02, $points[0]['quantity'], 1e-9);
        $this->assertSame(800.0, $points[0]['value']);
        $this->assertEqualsWithDelta(0.02, $points[0]['bought'], 1e-9);

        $this->assertEqualsWithDelta(0.015, $points[1]['quantity'], 1e-9);
        $this->assertSame(630.0, $points[1]['value']);
        $this->assertEqualsWithDelta(0.005, $points[1]['sold'], 1e-9);

        $this->assertSame('2024-01-21', $points[2]['date']);
        $this->assertSame(42000.0, $points[2]['price']);
        // 5 weeks later the price is stale (> 14 days) → unvalued rather than wrong
        $this->assertNull($points[5]['price']);
    }

    public function testTopCoinsAndOthersAndKpis(): void
    {
        $service = $this->service([
            $this->trade('2024-01-01', TypeType::Depot, 'EUR', 0, 'EUR', 1000, 1000),
            $this->trade('2024-01-02', TypeType::Achat, 'EUR', 600, 'BTC', 0.01, 600),
            $this->trade('2024-01-02', TypeType::Achat, 'EUR', 300, 'ETH', 0.1, 300),
            $this->trade('2024-01-02', TypeType::Achat, 'EUR', 100, 'DOT', 10, 100),
        ], [
            'BTC' => ['2024-01-07' => 60000.0],
            'ETH' => ['2024-01-07' => 3000.0],
            'DOT' => ['2024-01-07' => 10.0],
        ]);

        $stats = $service->build(new User(), 2);

        $this->assertSame(['BTC', 'ETH'], $stats['coins']);
        $first = $stats['series'][0];
        $this->assertSame(600.0, $first['BTC']);
        $this->assertSame(300.0, $first['ETH']);
        $this->assertSame(100.0, $first[CrStatsService::OTHERS]);
        $this->assertSame(1000.0, $first['total']);
        $this->assertSame(1000.0, $first['invested']);
        $this->assertSame(1000.0, $stats['kpis']['invested']);
        $this->assertSame(3, $stats['kpis']['heldCount']);
    }

    public function testBinanceImportFallsBackToUsdtConvertedWithEurUsdt(): void
    {
        $day = fn (string $d) => (new \DateTimeImmutable($d . ' 00:00:00', new \DateTimeZone('UTC')))->getTimestamp() * 1000;
        $kline = fn (string $d, float $open) => [$day($d), (string) $open, '0', '0', '0', '0', 0];

        $http = new MockHttpClient(function (string $method, string $url) use ($kline) {
            parse_str(parse_url($url, PHP_URL_QUERY), $q);

            return match ($q['symbol']) {
                'EURUSDT' => new MockResponse(json_encode([$kline('2024-01-01', 1.10), $kline('2024-01-02', 1.0)])),
                'ABCEUR' => new MockResponse('{"code":-1121,"msg":"Invalid symbol."}', ['http_code' => 400]),
                'ABCUSDT' => new MockResponse(json_encode([$kline('2024-01-01', 11.0), $kline('2024-01-02', 5.0)])),
            };
        });

        $repo = $this->createMock(CrPriceHistoryRepository::class);
        $repo->method('findLastDate')->willReturn(null);
        $repo->expects($this->once())->method('upsertImported')
            ->with('ABC', ['2024-01-01' => 10.0, '2024-01-02' => 5.0], 'binance')
            ->willReturn(2);

        $service = new CrPriceService(new MockHttpClient(), $repo, new NullLogger(), '', $http);

        $this->assertSame(2, $service->importDailyHistory('abc', new \DateTimeImmutable('2024-01-01')));
    }

    public function testCryptoFundedPurchaseSpendsTheCryptoUsed(): void
    {
        $service = $this->service([
            $this->trade('2024-01-01', TypeType::Achat, 'EUR', 1000, 'USDT', 1100, 1000),
            $this->trade('2024-01-02', TypeType::Achat, 'USDT', 600, 'LINK', 40, 550),
        ], ['USDT' => ['2024-01-07' => 0.9], 'LINK' => ['2024-01-07' => 14.0]]);

        $first = $service->coinSeries(new User(), 'USDT')[0];

        $this->assertEqualsWithDelta(500, $first['quantity'], 1e-9);
    }
}
