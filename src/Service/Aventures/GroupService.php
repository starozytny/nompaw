<?php

namespace App\Service\Aventures;

use App\Entity\Main\User;
use App\Entity\Rando\RaGroupe;
use App\Entity\Rando\RaRando;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaImageRepository;
use App\Repository\Rando\RaLinkRepository;

class GroupService
{
    public function __construct(private readonly RaGroupeRepository $repository,
                                private readonly RaLinkRepository $linkRepository,
                                private readonly RaImageRepository $imageRepository)
    {}

    public function getList(User $user): array
    {
        $groupes = $this->repository->findBy(['isVisible' => true]);

        foreach($this->repository->findBy(['author' => $user]) as $grp){
            if(!in_array($grp, $groupes)){
                $groupes[] = $grp;
            }
        }

        foreach($this->linkRepository->findBy(['user' => $user]) as $link){
            if(!in_array($link->getGroupe(), $groupes)){
                $groupes[] = $link->getGroupe();
            }
        }

        return $groupes;
    }

    /**
     * Groups visible to $user with what their past adventures add up to, for the "souvenirs" cards.
     *
     * @return array<array{g: RaGroupe, covers: RaRando[], count: int, photos: int, km: int, since: ?string, next: ?RaRando}>
     */
    public function getCards(User $user): array
    {
        $groupes = $this->getList($user);
        $photos = $this->imageRepository->countByGroupes($groupes);

        return array_map(function (RaGroupe $g) use ($photos) {
            $randos = $g->getRandos()->toArray();
            $past = array_values(array_filter($randos, fn (RaRando $r) => !$r->isIsNext()));
            usort($past, fn (RaRando $a, RaRando $b) => $b->getStartAt() <=> $a->getStartAt());
            $next = current(array_filter($randos, fn (RaRando $r) => $r->isIsNext())) ?: null;

            return [
                'g' => $g,
                'covers' => array_slice(array_values(array_filter($past, fn (RaRando $r) => $r->getCover())), 0, 6),
                'count' => count($past),
                'photos' => $photos[$g->getId()] ?? 0,
                'km' => (int) round(array_sum(array_map(fn (RaRando $r) => $r->getDistance() ?? 0, $past))),
                'since' => $past ? end($past)->getStartAt()?->format('Y') : null,
                'next' => $next,
            ];
        }, $groupes);
    }
}
