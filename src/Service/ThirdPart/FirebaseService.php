<?php

namespace App\Service\ThirdPart;

use App\Entity\Firebase\FiToken;
use App\Repository\Firebase\FiTokenRepository;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class FirebaseService
{
    private HttpClientInterface $client;

    public function __construct(HttpClientInterface $client)
    {
        $this->client = $client;
    }

    public function sendNotif($bearToken, FiToken $token, FiTokenRepository $repository, $title, $body, $image = null): void
    {
        $response = $this->client->request('POST', 'https://fcm.googleapis.com/v1/projects/nompaw/messages:send', [
            'headers' => [
                'Accept' => 'application/json',
            ],
            'auth_bearer' => $bearToken,
            'json' => [
                'message' => [
                    'token' => $token->getToken(),
                    'notification' => [
                        'title' => $title,
                    ],
                    'webpush' => [
                        "headers" => [
                            'TTL' => '7200'
                        ],
                        'notification' => [
                            'body' => $body,
                            'badge' => '/favicon.png',
                            'image' => $image ?: ''
                        ]
                    ],
                    'android' => [
                        'ttl' => '7200s',
                        'notification' => [
                            'body' => $body,
                        ]
                    ]
                ]
            ]
        ]);

        if($response->getStatusCode() == 404){
            $repository->remove($token);
        }
    }
}
