import '../css/app.scss';

const routes = require('@publicFolder/js/fos_js_routes.json');
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min';

import React from "react";
import { createRoot } from "react-dom/client";

import { ContactFormulaire } from "@appFolder/pages/components/Contact/ContactForm";
import { UserFormulaire } from "@adminPages/Users/UserForm";
import { AppShell } from "@userPages/Layout/AppShell";

Routing.setRoutingData(routes);

let el = document.getElementById("contacts_create");
if(el){
    createRoot(el).render(<ContactFormulaire />)
}

el = document.getElementById("users_update");
if(el){
    createRoot(el).render(<UserFormulaire context="update" element={JSON.parse(el.dataset.obj)} />)
}

el = document.getElementById("app-shell");
if(el){
    createRoot(el).render(<AppShell
        menu={JSON.parse(el.dataset.menu)}
        menuSecondary={JSON.parse(el.dataset.menuSecondary)}
        activeRoute={el.dataset.activeRoute}
        pageTitle={el.dataset.pageTitle}
        homePath={el.dataset.homePath}
        logoPath={el.dataset.logoPath}
        user={JSON.parse(el.dataset.user)}
        profilePath={el.dataset.profilePath}
        logoutPath={el.dataset.logoutPath}
    />)
}
