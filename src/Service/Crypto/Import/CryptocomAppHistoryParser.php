<?php

namespace App\Service\Crypto\Import;

use App\Entity\Enum\Crypto\TypeType;

/**
 * Crypto.com App (DeFi Wallet / main app, as opposed to the Exchange product covered by
 * CryptocomDepositWithdrawalParser) "Transaction history" CSV export — a flat per-event ledger, one row
 * per balance change, covering every product (Card, Crypto Earn, Supercharger, Lockup, trading...), not
 * just trades. Crypto.com's own export currently lists ~40 distinct "Transaction Kind" values across a
 * real multi-year account history; this parser buckets them into a handful of CrTrade types rather than
 * hardcoding every one, the same approach as BinanceHistoryParser:
 *
 *  - Some kinds (crypto_exchange, trading.limit_order.crypto_wallet.exchange, crypto_viban_exchange) are
 *    a complete swap in a single row: Currency/Amount is what's given up, To Currency/To Amount is what's
 *    received. crypto_purchase and card_top_up are the same shape but the counter-leg is only ever
 *    expressed via the Native Currency/Native Amount columns (buying crypto with card funds, or selling
 *    crypto to top up the card), so those are used as the missing leg instead.
 *  - Other kinds come as a *_credited/*_debited pair sharing the exact same timestamp (crypto_wallet_swap,
 *    dust_conversion, dynamic_coin_swap, lockup_swap — all internal one-asset-for-another conversions,
 *    e.g. the 2020 MCO->CRO migration or a small-balance dust sweep): paired by (timestamp, kind with the
 *    suffix stripped) into a single swap trade, generically, without listing every prefix.
 *  - trading.limit_order.{crypto_wallet.fund,cash_account.sell}_{lock,unlock} are temporary balance holds
 *    for a limit order, always exactly offsetting (confirmed against a real export: every lock has a
 *    matching unlock for the identical currency/amount) — skipped entirely, since they never reflect a
 *    completed transaction on their own; a filled order shows up separately as crypto_viban_exchange or
 *    a trading.limit_order.*.exchange row.
 *  - crypto_to_exchange_transfer / exchange_to_crypto_transfer (App <-> Exchange sub-account) and
 *    lockup_lock/lockup_unlock, supercharger_deposit/withdrawal, crypto_earn_program_created/withdrawn,
 *    finance.dpos.{,un}staking.crypto_wallet and finance.lockup.dpos_lock*.crypto_wallet (Cronos DPoS
 *    staking/cardholder lock) — all locking/unlocking a balance into a product — move funds between the
 *    user's own wallets/products without changing what they own → Transfert, same treatment as
 *    BinanceHistoryParser's equivalent Earn/Staking subscription rows. Confirmed against a real export:
 *    every crypto_to_exchange_transfer/exchange_to_crypto_transfer row here has a matching Dépôt/Retrait
 *    entry in the Exchange's own "Dépôts et retraits" export (CryptocomDepositWithdrawalParser) — both
 *    describe the same internal movement from two different ledgers, not two separate real-world events.
 *  - crypto_deposit/crypto_withdrawal are real on-chain movements (real Transaction Hash) → Depot/Retrait.
 *  - Recurring yield (crypto_earn_interest_paid, supercharger_reward_to_app_credited,
 *    finance.dpos.non_compound_interest.crypto_wallet) → Stacking. One-off bonuses/rewards/adjustments
 *    (referral_card_cashback, reimbursement, rewards_platform_deposit_credited, referral_bonus,
 *    referral_gift, admin_wallet_credited, lockup_swap_rebate) → Recuperation. card_cashback_reverted (a
 *    negative correction of a previous cashback reward) can't be a negative Recuperation (CrTrade requires
 *    fromNbToken >= 0), so it's recorded as Retrait instead — same net holdings effect (a coin leaving the
 *    balance) via a type the validator accepts.
 *  - Anything not recognized above is kept as ACategoriser with Crypto.com's own kind label, never
 *    silently dropped.
 *
 * There's no per-row transaction id in this export (besides the deposit/withdrawal hash), so importedId
 * for every other row is a hash of the entry's own content (or of the paired legs, for a swap), with a
 * per-signature occurrence counter for exact duplicates — stable across re-imports of a re-downloaded
 * (growing) export as long as row order for already-seen rows doesn't change, which holds since this
 * export is the full account history in chronological order.
 */
class CryptocomAppHistoryParser implements CryptoImportParserInterface
{
    private const STACKING_KINDS = [
        'crypto_earn_interest_paid', 'supercharger_reward_to_app_credited',
        'finance.dpos.non_compound_interest.crypto_wallet',
    ];

    private const BONUS_KINDS = [
        'referral_card_cashback', 'reimbursement', 'rewards_platform_deposit_credited',
        'referral_bonus', 'referral_gift', 'admin_wallet_credited', 'lockup_swap_rebate',
    ];

    private const REVERSAL_KINDS = ['card_cashback_reverted'];

    private const TRANSFER_KINDS = [
        'crypto_to_exchange_transfer', 'exchange_to_crypto_transfer', 'lockup_lock', 'lockup_unlock',
        'supercharger_deposit', 'supercharger_withdrawal', 'crypto_earn_program_created',
        'crypto_earn_program_withdrawn', 'dynamic_coin_swap_bonus_exchange_deposit',
        'finance.dpos.staking.crypto_wallet', 'finance.dpos.unstaking.crypto_wallet',
        'finance.lockup.dpos_lock.crypto_wallet', 'finance.lockup.dpos_lock_upgrade.crypto_wallet',
    ];

    private const SKIPPED_KINDS = [
        'trading.limit_order.crypto_wallet.fund_lock', 'trading.limit_order.crypto_wallet.fund_unlock',
        'trading.limit_order.cash_account.sell_lock', 'trading.limit_order.cash_account.sell_unlock',
    ];

    private const INLINE_SWAP_KINDS = [
        'crypto_exchange', 'trading.limit_order.crypto_wallet.exchange', 'crypto_viban_exchange',
    ];

    /**
     * Kind prefixes that come as a *_credited/*_debited pair sharing one timestamp (see class docblock).
     * Deliberately NOT every kind ending in "_credited"/"_debited" — several standalone kinds happen to
     * share that suffix without ever having a counterpart row (e.g. supercharger_reward_to_app_credited,
     * admin_wallet_credited), so pairedBaseKind() only recognizes these explicitly.
     */
    private const PAIRABLE_BASE_KINDS = ['crypto_wallet_swap', 'dust_conversion', 'dynamic_coin_swap', 'lockup_swap'];

    /** @var array<string, int> content signature => number of times already seen, for stable dedup ids */
    private array $idOccurrences = [];

    public function getSourceName(): string
    {
        return 'Crypto.com App';
    }

    public function supports(array $rows): bool
    {
        $header = $rows[0] ?? [];

        return ($header[0] ?? null) === 'Timestamp (UTC)'
            && ($header[3] ?? null) === 'Amount'
            && ($header[9] ?? null) === 'Transaction Kind'
            && ($header[10] ?? null) === 'Transaction Hash';
    }

    public function parse(array $rows): array
    {
        if (!$this->supports($rows)) {
            return [];
        }

        $this->idOccurrences = [];

        $entries = [];
        foreach (array_slice($rows, 1) as $row) {
            if (count($row) < 11 || $row[0] === '') {
                continue;
            }

            $entries[] = [
                'time' => $row[0],
                'currency' => $row[2],
                'amount' => (float) $row[3],
                'toCurrency' => $row[4],
                'toAmount' => $row[5] !== '' ? (float) $row[5] : null,
                'nativeCurrency' => $row[6],
                'nativeAmount' => $row[7] !== '' ? (float) $row[7] : null,
                'kind' => $row[9],
                'hash' => $row[10],
            ];
        }

        // *_credited/*_debited legs of the same internal conversion share one timestamp — bucketed by
        // (timestamp, kind with the suffix stripped) so pairing doesn't depend on file-order contiguity.
        $pairGroups = [];
        foreach ($entries as $entry) {
            $base = $this->pairedBaseKind($entry['kind']);
            if ($base !== null) {
                $pairGroups[$entry['time'] . '|' . $base][] = $entry;
            }
        }
        $pairHandled = [];

        $trades = [];
        foreach ($entries as $entry) {
            $base = $this->pairedBaseKind($entry['kind']);
            if ($base !== null) {
                $groupKey = $entry['time'] . '|' . $base;
                if (isset($pairHandled[$groupKey])) {
                    continue;
                }
                $pairHandled[$groupKey] = true;

                $trades[] = $this->buildFromPairGroup($pairGroups[$groupKey]);
                continue;
            }

            $trades[] = $this->buildStandaloneEntry($entry);
        }

        return array_merge(...$trades);
    }

    private function buildStandaloneEntry(array $entry): array
    {
        $kind = $entry['kind'];
        $coin = $entry['currency'];
        $amount = $entry['amount'];

        if (in_array($kind, self::SKIPPED_KINDS, true)) {
            return []; // temporary order-fund hold, always offset by a matching lock/unlock — see class docblock
        }

        if ($kind === 'crypto_deposit') {
            return $this->buildSingleLeg($entry['time'], $coin, $amount, TypeType::Depot, null, $this->depositWithdrawalId('d', $entry));
        }

        if ($kind === 'crypto_withdrawal') {
            return $this->buildSingleLeg($entry['time'], $coin, $amount, TypeType::Retrait, null, $this->depositWithdrawalId('w', $entry));
        }

        if (in_array($kind, self::INLINE_SWAP_KINDS, true)) {
            return $this->buildInlineSwap($entry);
        }

        if ($kind === 'crypto_purchase') {
            // Only leg expressed on the row is what was received (Currency/Amount); what was paid is only
            // visible via the Native Currency/Native Amount columns.
            return $this->buildSwapTrade(
                $entry['time'],
                $entry['nativeCurrency'] ?? '',
                $entry['nativeAmount'] ?? 0.0,
                $coin,
                $amount,
                TypeType::Achat,
                $kind,
            );
        }

        if ($kind === 'card_top_up') {
            // Crypto sold to fund a card top-up; the fiat received is only visible via Native Currency/Amount.
            return $this->buildSwapTrade(
                $entry['time'],
                $coin,
                $amount,
                $entry['nativeCurrency'] ?? '',
                $entry['nativeAmount'] ?? 0.0,
                TypeType::Vente,
                $kind,
            );
        }

        if (in_array($kind, self::STACKING_KINDS, true)) {
            return $this->buildSingleLeg($entry['time'], $coin, $amount, TypeType::Stacking);
        }

        if (in_array($kind, self::BONUS_KINDS, true)) {
            return $this->buildSingleLeg($entry['time'], $coin, $amount, TypeType::Recuperation);
        }

        if (in_array($kind, self::REVERSAL_KINDS, true)) {
            return $this->buildSingleLeg($entry['time'], $coin, $amount, TypeType::Retrait);
        }

        if (in_array($kind, self::TRANSFER_KINDS, true)) {
            return $this->buildSingleLeg($entry['time'], $coin, $amount, TypeType::Transfert);
        }

        return $this->buildSingleLeg($entry['time'], $coin, $amount, TypeType::ACategoriser, $kind);
    }

    /**
     * @return list<array> exactly 1 trade
     */
    private function buildInlineSwap(array $entry): array
    {
        $toCoin = $entry['toCurrency'] !== '' ? $entry['toCurrency'] : ($entry['nativeCurrency'] ?? '');
        $toAmount = $entry['toAmount'] ?? $entry['nativeAmount'] ?? 0.0;
        $type = $toCoin === 'EUR' ? TypeType::Vente : TypeType::Achat;

        return $this->buildSwapTrade($entry['time'], $entry['currency'], $entry['amount'], $toCoin, $toAmount, $type, $entry['kind']);
    }

    /**
     * @return list<array> exactly 1 trade
     */
    private function buildSwapTrade(string $time, string $fromCoin, float $fromAmount, string $toCoin, float $toAmount, int $type, string $signatureTag): array
    {
        return [[
            'importedId' => $this->makeImportedId(sprintf('%s|%s|%s|%s|%s|%s', $time, $signatureTag, $fromCoin, $fromAmount, $toCoin, $toAmount)),
            'tradeAt' => new \DateTimeImmutable($time),
            'type' => $type,
            'fromCoin' => $fromCoin,
            'fromNbToken' => abs($fromAmount),
            'toCoin' => $toCoin,
            'toNbToken' => abs($toAmount),
            'costPrice' => 0.0,
            'costCoin' => $toCoin,
            'totalReal' => 0.0,
            'total' => 0.0,
        ]];
    }

    /**
     * Groups a set of legs sharing one (timestamp, base kind) key — normally exactly one *_credited and
     * one *_debited leg, but degrades gracefully to one ACategoriser entry per leg when that's not the
     * case (rare/malformed data), same as SwissBorgParser/BinanceHistoryParser.
     *
     * @return list<array>
     */
    private function buildFromPairGroup(array $legs): array
    {
        $credited = null;
        $debited = null;
        foreach ($legs as $leg) {
            if (str_ends_with($leg['kind'], '_credited') && $credited === null) {
                $credited = $leg;
            } elseif (str_ends_with($leg['kind'], '_debited') && $debited === null) {
                $debited = $leg;
            }
        }

        if (count($legs) !== 2 || $credited === null || $debited === null) {
            $trades = [];
            foreach ($legs as $leg) {
                $trades[] = $this->buildSingleLeg($leg['time'], $leg['currency'], $leg['amount'], TypeType::ACategoriser, $leg['kind']);
            }

            return array_merge(...$trades);
        }

        $type = $credited['currency'] === 'EUR' ? TypeType::Vente : TypeType::Achat;

        return $this->buildSwapTrade($debited['time'], $debited['currency'], $debited['amount'], $credited['currency'], $credited['amount'], $type, $this->pairedBaseKind($credited['kind']) ?? $credited['kind']);
    }

    private function pairedBaseKind(string $kind): ?string
    {
        foreach (self::PAIRABLE_BASE_KINDS as $base) {
            if ($kind === $base . '_credited' || $kind === $base . '_debited') {
                return $base;
            }
        }

        return null;
    }

    /**
     * @return list<array> 0 or 1 trade (dropped if the moved quantity is negligible)
     */
    private function buildSingleLeg(string $time, string $coin, float $amount, int $type, ?string $rawCategory = null, ?string $importedId = null): array
    {
        $qty = abs($amount);
        if ($qty < 0.00000001) {
            return [];
        }

        return [[
            'importedId' => $importedId ?? $this->makeImportedId(sprintf('%s|%s|%s|%s', $time, $rawCategory ?? $type, $coin, $amount)),
            'tradeAt' => new \DateTimeImmutable($time),
            'type' => $type,
            'fromCoin' => $coin,
            'fromNbToken' => $qty,
            'toCoin' => $coin,
            'toNbToken' => $qty,
            'costPrice' => 0.0,
            'costCoin' => $coin,
            'totalReal' => 0.0,
            'total' => 0.0,
            'rawCategory' => $rawCategory,
        ]];
    }

    private function depositWithdrawalId(string $prefix, array $entry): string
    {
        if ($entry['hash'] !== '') {
            return $prefix . '-' . $entry['hash'];
        }

        return $prefix . '-' . $this->makeImportedId(sprintf('%s|%s|%s|%s', $entry['time'], $entry['kind'], $entry['currency'], $entry['amount']));
    }

    private function makeImportedId(string $signature): string
    {
        $occurrence = $this->idOccurrences[$signature] ?? 0;
        $this->idOccurrences[$signature] = $occurrence + 1;

        return hash('sha1', $signature . '#' . $occurrence);
    }
}
