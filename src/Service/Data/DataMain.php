<?php

namespace App\Service\Data;

use App\Entity\Main\Contact;
use App\Entity\Main\Notification;
use App\Entity\Main\Settings;
use App\Entity\Main\Society;
use App\Entity\Main\User;
use App\Service\SanitizeData;
use Doctrine\Persistence\ManagerRegistry;

class DataMain
{
    public function __construct(
        private readonly SanitizeData $sanitizeData,
        private readonly ManagerRegistry $registry
    ) {}

    public function setDataUser(User $obj, $data): User
    {
        if (isset($data->roles)) $obj->setRoles($data->roles);

        $username = $this->sanitizeData->fullSanitize($data->username);

        if(isset($data->firstname) && isset($data->lastname)){
            $obj = ($obj)
                ->setFirstname($this->sanitizeData->sanitizeString($data->firstname))
                ->setLastname($this->sanitizeData->sanitizeString($data->lastname))
            ;
        }else{
            $obj->setLastname($this->sanitizeData->sanitizeString($data->displayName));
        }

        return ($obj)
            ->setUsername($username)
            ->setDisplayName($data->displayName ? $this->sanitizeData->sanitizeString($data->displayName) : $username)
            ->setEmail($data->email)
        ;
    }

    public function setDataSociety(Society $obj, $data, Settings $settings): Society
    {
        $prefix = $settings->isMultipleDatabase() ? $_ENV['DATABASE_NAME_MANAGER'] : "default";

        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setCode($this->sanitizeData->trimData($data->code))
            ->setManager($prefix . $this->sanitizeData->trimData($data->code))
        ;
    }

    public function setDataContact(Contact $obj, $data): Contact
    {
        return ($obj)
            ->setName($this->sanitizeData->trimData($data->name))
            ->setEmail($this->sanitizeData->trimData($data->email))
            ->setPhone($this->sanitizeData->trimData($data->phone))
            ->setMessage($this->sanitizeData->trimData($data->message))
        ;
    }

    public function createDataNotification($name, $icon, $user, $url = null): void
    {
        $obj = (new Notification())
            ->setName($this->sanitizeData->trimData($name))
            ->setIcon($this->sanitizeData->trimData($icon))
            ->setUrl($this->sanitizeData->trimData($url))
            ->setUser($user)
        ;

        $em = $this->registry->getManager();

        $em->persist($obj);
        $em->flush();
    }

}
