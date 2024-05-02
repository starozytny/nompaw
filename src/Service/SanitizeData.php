<?php


namespace App\Service;


use DateTime;
use DateTimeZone;
use Exception;
use Symfony\Component\String\AbstractUnicodeString;
use Symfony\Component\String\Slugger\AsciiSlugger;

class SanitizeData
{
    public function fullSanitize($value, $return = null): ?AbstractUnicodeString
    {
        if($value != null){
            $value = trim($value);
            $value = mb_strtolower($value);
            $value = str_replace(" ", "", $value);

            return $this->slugString($value);
        }

        return $return;
    }

    public function slugString($data, $return = null): ?AbstractUnicodeString
    {
        if($data != null){
            $slug = new AsciiSlugger();
            return $slug->slug($data);
        }

        return $return;
    }

    public function sanitizeString($value, $return = null): ?string
    {
        if($value != "" && $value != null){
            $value = trim($value);
            return htmlspecialchars($value);
        }

        return $return;
    }

    public function trimData($value, $return = null): ?string
    {
        if($value != "" && $value != null){
            return trim($value);
        }

        return $return;
    }

    public function createDateTimePicker($value, $return = null): ?DateTime
    {
        if($value != "" && $value != null){
            return DateTime::createFromFormat('d/m/Y H:i', $value);
        }

        return $return;
    }

    public function createDatePicker($value, $return = null): ?DateTime
    {
        if($value != "" && $value != null){
            return DateTime::createFromFormat('d/m/Y', $value);
        }

        return $return;
    }

    public function createTime($value, $return = null): ?DateTime
    {
        if($value != "" && $value != null){
            $time = explode(':', $value);

            $duration = new \DateTime();
            $duration->setTime($time[0], $time[1]);

            return $duration;
        }

        return $return;
    }

    public function setIntValue($value, $return = null)
    {
        if($value != "" && $value != null){
            return (int) $value;
        }

        return $return;
    }

    public function setFloatValue($value, $return = null)
    {
        if($value != "" && $value != null){
            return (float) $value;
        }

        return $return;
    }
}
