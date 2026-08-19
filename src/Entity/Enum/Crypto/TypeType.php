<?php

namespace App\Entity\Enum\Crypto;

enum TypeType: int
{
    const Achat = 0;
    const Vente = 1;
    const Depot = 2;
    const Retrait = 3;
    const Recuperation = 4;
    const Stacking = 5;
    const Transfert = 6;

    /**
     * Fallback for import mappers when a platform-provided transaction/operation category isn't
     * recognized — kept visible with its raw platform label (CrTrade::rawCategory) for manual review
     * instead of being silently dropped.
     */
    const ACategoriser = 7;
}
