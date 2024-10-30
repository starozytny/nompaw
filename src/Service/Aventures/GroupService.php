<?php

namespace App\Service\Aventures;

use App\Entity\Main\User;
use App\Repository\Rando\RaGroupeRepository;
use App\Repository\Rando\RaLinkRepository;

class GroupService
{
    public function __construct(private readonly RaGroupeRepository $repository,
                                private readonly RaLinkRepository $linkRepository)
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
}
