import '../css/app.scss';

const routes = require('@publicFolder/js/fos_js_routes.json');
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min';

import React from "react";
import { createRoot } from "react-dom/client";
import { ContactFormulaire } from "@appFolder/pages/components/Contact/ContactForm";
import { Notifications } from "@commonComponents/Elements/Notifications";
import { Cookies } from "@commonComponents/Modules/Cookies/Cookies";
import { UserFormulaire } from "@adminPages/Users/UserForm";
import { Theme } from "@userPages/Theme/Theme";

Routing.setRoutingData(routes);

let notifs = document.getElementById("notifs_list");
if(notifs){
    createRoot(notifs).render(<Notifications />)
}

let ck = document.getElementById("cookies");
if(ck){
    createRoot(ck).render(<Cookies {...ck.dataset} />)
}

let el = document.getElementById("contacts_create");
if(el){
    createRoot(el).render(<ContactFormulaire />)
}

el = document.getElementById("users_update");
if(el){
    createRoot(el).render(<UserFormulaire context="update" element={JSON.parse(el.dataset.obj)} />)
}

menu();

function menu() {
    let btn = document.querySelector('.nav-mobile');
    if(btn){
        btn.addEventListener('click', function () {
            let content = document.querySelector('.nav-content');
            if(content.classList.contains('active')){
                content.classList.remove('active');
            }else{
                content.classList.add('active');
            }
        })
    }
}

let theme = document.getElementById('theme');
if(theme){
    createRoot(theme).render(<Theme />)
}
