<?php

namespace App\Service\ThirdPart;

use Google\Client;
use Google\Exception;

class GoogleService
{
    private $configDirectory;

    public function __construct($configDirectory)
    {
        $this->configDirectory = $configDirectory;
    }

    /**
     * @throws Exception
     */
    public function connect()
    {
        $client = new Client();
        $client->setAuthConfig($this->configDirectory . 'credentials.json');
        $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
        $client->fetchAccessTokenWithAssertion();
        $token = $client->getAccessToken();

        return $token['access_token'];
    }
}
