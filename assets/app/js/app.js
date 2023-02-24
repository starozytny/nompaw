import '../css/app.scss';

const routes = require('@publicFolder/js/fos_js_routes.json');
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min';

import React from "react";
import { createRoot } from "react-dom/client";
import { ContactFormulaire } from "@appFolder/pages/components/Contact/ContactForm";
import { Cookies } from "@commonComponents/Modules/Cookies/Cookies";

Routing.setRoutingData(routes);

let el = document.getElementById("contacts_create");
if(el){
    createRoot(el).render(<ContactFormulaire />)
}

let ck = document.getElementById("cookies");
if(ck){
    createRoot(ck).render(<Cookies {...ck.dataset} />)
}


menu();

function menu () {
    let btns = document.querySelectorAll('.btn-menu-mobile');
    let elements = document.querySelector('nav');

    if(btns){
        btns.forEach(btn => {
            btn.addEventListener('click', () => switchActive(elements))
        })

        window.onclick = (e) => {
            if(e.target === elements){
                switchActive(elements)
            }
        }
    }

    function switchActive(elements) {
        if(elements.classList.contains('active')){
            elements.classList.remove('active');
        }else{
            elements.classList.add('active');
        }
    }
}
