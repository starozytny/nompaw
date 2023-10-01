import '../../css/pages/birthdays.scss';

import React from "react";
import toastr from "toastr";
import { createRoot } from "react-dom/client";
import { BirthdayFormulaire } from "@userPages/Birthdays/Birthday/BirthdayForm";
import { BirthdayDelete } from "@userPages/Birthdays/Birthday/BirthdayDelete";
import { Presents } from "@userPages/Birthdays/Birthday/Presents";

let el = document.getElementById("birthdays_update");
if(el){
    createRoot(el).render(<BirthdayFormulaire context="update" element={JSON.parse(el.dataset.element)} />)
}

el = document.getElementById("birthdays_create");
if(el){
    createRoot(el).render(<BirthdayFormulaire context="create" element={null} />)
}

let deletesBirthday = document.querySelectorAll('.delete-birthday');
if(deletesBirthday){
    deletesBirthday.forEach(elem => {
        createRoot(elem).render(<BirthdayDelete context="birthdays" {...elem.dataset} />)
    })
}

let birthdayPresents = document.getElementById("birthdays_presents");
if(birthdayPresents){
    createRoot(birthdayPresents).render(<Presents {...birthdayPresents.dataset} mode={birthdayPresents.dataset.mode === "1"} />)
}

let share = document.getElementById('share_link');
if(share){
    share.addEventListener('click', function () {
        navigator.clipboard.writeText(location.origin + share.dataset.url);
        toastr.info('Lien de partage copié')
    })
}
