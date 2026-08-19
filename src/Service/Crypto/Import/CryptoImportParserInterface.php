<?php

namespace App\Service\Crypto\Import;

/**
 * One implementation per exchange export format. CryptoImportService reads a CSV file's raw rows
 * (no header offset applied — some exports, e.g. Bitpanda, have a few metadata lines before the real
 * header) and asks each registered parser in turn whether it recognizes the header row; the first
 * match parses the file.
 */
interface CryptoImportParserInterface
{
    /**
     * Stored as CrTrade::importedFrom and used to scope the dedup lookup.
     */
    public function getSourceName(): string;

    /**
     * @param list<list<string>> $rows all raw CSV rows, in file order
     */
    public function supports(array $rows): bool;

    /**
     * @param list<list<string>> $rows all raw CSV rows, in file order
     * @return list<array{
     *     importedId: string,
     *     tradeAt: \DateTimeImmutable,
     *     type: int,
     *     fromCoin: string,
     *     fromNbToken: float,
     *     toCoin: string,
     *     toNbToken: ?float,
     *     costPrice: float,
     *     costCoin: string,
     *     totalReal: float,
     *     total: float,
     *     rawCategory?: string,
     * }>
     */
    public function parse(array $rows): array;
}
