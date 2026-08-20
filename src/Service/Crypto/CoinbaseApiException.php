<?php

namespace App\Service\Crypto;

/**
 * Message is always safe to show to the user (never includes the private key or raw JWT).
 */
class CoinbaseApiException extends \RuntimeException
{
}
