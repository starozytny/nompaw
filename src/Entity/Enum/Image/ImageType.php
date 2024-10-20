<?php

namespace App\Entity\Enum\Image;

enum ImageType: int
{
    const Changelog = 0;
    const AgEvent = 1;
    const Mail = 2;
    const Question = 3;
    const Recipe = 4;
    const Commentary = 5;
    const Groupe = 6;
    const Rando = 7;
    const Route = 8;
}
