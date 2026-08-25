<?php

namespace App\Service\Crypto;

use App\Entity\Crypto\CrForeignAccount;
use App\Entity\Main\User;
use App\Repository\Crypto\CrForeignAccountRepository;
use App\Repository\Crypto\CrTradeRepository;

/**
 * Keeps CrForeignAccount (the 3916-BIS account list) in sync with the platforms actually present in
 * CrTrade::importedFrom — one row per distinct platform, created once and never overwritten afterwards
 * so the user's own edits (address, dates, notes, or a merged/renamed platform) always stick.
 */
class CrForeignAccountService
{
    public function __construct(
        private readonly CrTradeRepository $tradeRepository,
        private readonly CrForeignAccountRepository $accountRepository,
    ) {}

    public function sync(User $user): void
    {
        $platforms = $this->tradeRepository->findDistinctPlatformsWithFirstTradeDate($user);
        if (empty($platforms)) {
            return;
        }

        $existingSources = array_map(
            fn (CrForeignAccount $account) => $account->getSourceImportedFrom(),
            $this->accountRepository->findBy(['user' => $user])
        );

        foreach ($platforms as $platform => $firstTradeAt) {
            if (in_array($platform, $existingSources, true)) {
                continue;
            }

            $account = (new CrForeignAccount())
                ->setUser($user)
                ->setPlatform($platform)
                ->setSourceImportedFrom($platform)
                ->setOpenedAt($firstTradeAt instanceof \DateTimeInterface ? $firstTradeAt : new \DateTime((string) $firstTradeAt))
            ;

            $this->accountRepository->save($account, true);
        }
    }
}
