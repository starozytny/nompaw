<?php

namespace App\Controller\ThirdParty;

use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\Routing\Annotation\Route;

class LoginController extends AbstractController
{
    #[Route('/connect/google', name: 'connect_google')]
    public function connectGoogle(ClientRegistry $clientRegistry): RedirectResponse
    {
        //Redirect to google
        return $clientRegistry->getClient('google')->redirect([], []);
    }
    #[Route('/connect/facebook', name: 'connect_facebook')]
    public function connectFacebook(ClientRegistry $clientRegistry): RedirectResponse
    {
        //Redirect to google
        return $clientRegistry->getClient('facebook')->redirect([], []);
    }

    /**
     * After going to Google, you're redirected back here
     * because this is the "redirect_route" you configured
     * in config/packages/knpu_oauth2_client.yaml
     */
    #[Route('/connect/google/check', name: 'connect_google_check')]
    public function checkGoogle(): RedirectResponse
    {
        return $this->redirectToRoute('app_login');
    }

    #[Route('/connect/facebook/check', name: 'connect_facebook_check')]
    public function checkFacebook(): RedirectResponse
    {
        return $this->redirectToRoute('app_login');
    }
}
