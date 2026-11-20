<?php

namespace App\Service\Garmin;

/**
 * Message is always safe to show to the user (never includes the API key or access token).
 */
class GarminApiException extends \RuntimeException
{
}
