<?php

namespace App\Controller;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

class PhotosMagicLinkController extends AbstractController
{
    /**
     * Intercepted by PhotosMagicLinkAuthenticator::supports() before this ever runs,
     * same pattern as ThirdParty/LoginController's OAuth check routes.
     */
    #[Route('/connexion-photos/{token}', name: 'app_photos_magic_link', methods: ['GET'])]
    public function link(): RedirectResponse
    {
        return $this->redirectToRoute('app_photos_link_invalid');
    }

    #[Route('/connexion-photos/invalide', name: 'app_photos_link_invalid', methods: ['GET'])]
    public function invalid(): Response
    {
        return $this->render('app/pages/security/photos_link_invalid.html.twig');
    }
}
