<?php

namespace App\Service\Crypto;

/**
 * Message is always safe to show to the user (never includes the API key).
 */
class BitpandaApiException extends \RuntimeException
{
}
