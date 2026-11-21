<?php

namespace App\Controller;

use App\Repository\Drive\DrFileRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\ResponseHeaderBag;
use Symfony\Component\Routing\Attribute\Route;

class DriveShareController extends AbstractController
{
    /** Affichés dans le navigateur ; tout le reste est forcé en téléchargement (un HTML/SVG servi en ligne depuis notre domaine = XSS). */
    private const INLINE_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

    #[Route('/partage-drive/{token}', name: 'app_drive_share', requirements: ['token' => '[a-f0-9]{64}'], methods: ['GET'])]
    public function share(string $token, DrFileRepository $repository): Response
    {
        $file = $repository->findOneBy(['shareToken' => $token]);
        $path = $file ? $this->getParameter('private_directory') . $file->getFolder() . '/' . $file->getFile() : null;

        if (!$path || !is_file($path)) {
            throw $this->createNotFoundException("Ce lien de partage n'existe pas ou n'est plus actif.");
        }

        $inline = in_array($file->getMime(), self::INLINE_MIMES, true);
        $response = $this->file($path, $file->getName(), $inline ? ResponseHeaderBag::DISPOSITION_INLINE : ResponseHeaderBag::DISPOSITION_ATTACHMENT);
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        return $response;
    }
}
