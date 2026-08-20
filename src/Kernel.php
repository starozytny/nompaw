<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

class Kernel extends BaseKernel
{
    use MicroKernelTrait;

    public function __construct(string $environment, bool $debug)
    {
        // Pin the default timezone regardless of the host's php.ini date.timezone setting: dates are
        // always converted to/from Europe/Paris explicitly at the boundaries (see SanitizeData), and
        // naive DB datetimes must be hydrated as UTC consistently across every environment.
        date_default_timezone_set('UTC');

        parent::__construct($environment, $debug);
    }
}
