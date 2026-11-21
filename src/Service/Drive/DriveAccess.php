<?php

namespace App\Service\Drive;

use App\Entity\Drive\DrAlbum;
use App\Entity\Drive\DrFile;
use App\Entity\Main\User;
use App\Repository\Drive\DrAlbumMemberRepository;
use App\Repository\Drive\DrAlbumRepository;

/**
 * Droits du Drive. Un dossier appartient à son propriétaire (toute son arborescence aussi : seuls ses dossiers peuvent
 * y être créés ou déplacés). Partager un dossier donne accès à lui et à ses sous-dossiers ; le partage le plus proche
 * (en remontant) fixe le rôle. Un fichier appartient à celui qui l'a déposé (et compte dans son quota).
 */
class DriveAccess
{
    public const OWNER = 'owner';

    public function __construct(
        private readonly DrAlbumRepository $albumRepository,
        private readonly DrAlbumMemberRepository $memberRepository,
    ) {
    }

    /** 'owner' | 'editor' | 'viewer' | null (aucun accès ; null aussi pour la racine, propre à chacun). */
    public function roleIn(?DrAlbum $album, User $user): ?string
    {
        if (!$album) {
            return null;
        }
        if ($album->getOwner() === $user) {
            return self::OWNER;
        }
        for ($a = $album; $a !== null; $a = $a->getParent()) {
            if ($member = $this->memberRepository->findOneBy(['album' => $a, 'user' => $user])) {
                return $member->getRole();
            }
        }

        return null;
    }

    /** Déposer ou déplacer un de ses fichiers ici : sa propre racine, ou un dossier dont on est propriétaire ou éditeur. */
    public function canWriteInto(?DrAlbum $album, User $user): bool
    {
        return $album === null || in_array($this->roleIn($album, $user), [self::OWNER, 'editor'], true);
    }

    public function canRead(DrFile $file, User $user): bool
    {
        return $file->getOwner() === $user || $this->roleIn($file->getAlbum(), $user) !== null;
    }

    /** Le déposant, ou le propriétaire du dossier qui le contient. */
    public function canDelete(DrFile $file, User $user): bool
    {
        return $file->getOwner() === $user || $this->roleIn($file->getAlbum(), $user) === self::OWNER;
    }

    /**
     * Tous les dossiers accessibles : les siens, plus les arborescences partagées avec soi.
     * @return array<int, array{album: DrAlbum, role: string, sharedRoot: bool}> indexé par id ; sharedRoot = haut d'un partage reçu
     */
    public function accessibleAlbums(User $user): array
    {
        $result = [];
        foreach ($this->albumRepository->findBy(['owner' => $user], ['name' => 'ASC']) as $a) {
            $result[$a->getId()] = ['album' => $a, 'role' => self::OWNER, 'sharedRoot' => false];
        }

        // Partages reçus, regroupés par propriétaire pour ne charger chaque arborescence qu'une fois.
        $byOwner = [];
        foreach ($this->memberRepository->findBy(['user' => $user]) as $m) {
            $owner = $m->getAlbum()->getOwner();
            $byOwner[$owner->getId()]['owner'] = $owner;
            $byOwner[$owner->getId()]['roles'][$m->getAlbum()->getId()] = $m->getRole();
        }

        foreach ($byOwner as $group) {
            $roles = $group['roles'];
            $all = $this->albumRepository->findBy(['owner' => $group['owner']], ['name' => 'ASC']);
            $children = [];
            foreach ($all as $a) {
                $children[$a->getParent()?->getId() ?? 0][] = $a;
            }
            $walk = function (DrAlbum $a, string $role, bool $root) use (&$walk, &$result, $children, $roles): void {
                $role = $roles[$a->getId()] ?? $role; // le partage le plus proche l'emporte
                $result[$a->getId()] = ['album' => $a, 'role' => $role, 'sharedRoot' => $root];
                foreach ($children[$a->getId()] ?? [] as $child) {
                    $walk($child, $role, false);
                }
            };
            foreach ($all as $a) {
                if (!isset($roles[$a->getId()])) {
                    continue;
                }
                // Haut de partage seulement si aucun ancêtre n'est déjà partagé avec soi (sinon il apparaîtrait deux fois).
                for ($p = $a->getParent(); $p !== null; $p = $p->getParent()) {
                    if (isset($roles[$p->getId()])) {
                        continue 2;
                    }
                }
                $walk($a, $roles[$a->getId()], true);
            }
        }

        return $result;
    }
}
