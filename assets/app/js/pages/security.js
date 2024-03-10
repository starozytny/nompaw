const routes = require('@publicFolder/js/fos_js_routes.json');
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min';

import React from "react";
import { createRoot } from "react-dom/client";
import { Forget } from '@appFolder/pages/components/Security/Forget';
import { Reinit } from "@appFolder/pages/components/Security/Reinit";
import { UserFormulaire } from "@appFolder/pages/components/Security/UserForm";

Routing.setRoutingData(routes);

let el = document.getElementById("forget");
if(el){
    createRoot(el).render(<Forget />)
}

el = document.getElementById("reinit");
if(el){
    createRoot(el).render(<Reinit {...el.dataset} />)
}

el = document.getElementById("registration");
if(el){
    createRoot(el).render(<UserFormulaire />)
}

let inputShow = document.querySelector('.input-show');
if(inputShow){
    let seePassword = false;
    let inputPassword = document.querySelector('#password');
    let iconPassword  = document.getElementById('password-icon');
    inputShow.addEventListener('click', function (e){
        if(seePassword){
            seePassword = false;
            inputPassword.type = "password";
            iconPassword.classList.remove("icon-vision-not");
            iconPassword.classList.add("icon-vision");
        }else{
            seePassword = true;
            inputPassword.type = "text";
            iconPassword.classList.add("icon-vision-not");
            iconPassword.classList.remove("icon-vision");
        }
    })
}
