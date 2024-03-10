import '../css/app.scss';

const routes = require('@publicFolder/js/fos_js_routes.json');
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min';

import React from "react";
import { createRoot } from "react-dom/client";

import Menu from "@tailwindFunctions/menu";

import { ContactFormulaire } from "@appFolder/pages/components/Contact/ContactForm";
import { UserFormulaire } from "@adminPages/Users/UserForm";

import "./functions/firebase-push";

Routing.setRoutingData(routes);

Menu.menuListener();

let el = document.getElementById("contacts_create");
if(el){
    createRoot(el).render(<ContactFormulaire />)
}

el = document.getElementById("users_update");
if(el){
    createRoot(el).render(<UserFormulaire context="update" element={JSON.parse(el.dataset.obj)} />)
}
