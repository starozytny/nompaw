import "../../css/pages/agenda.scss"

const routes = require('@publicFolder/js/fos_js_routes.json');
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min';

import React from "react";
import { createRoot } from "react-dom/client";
import { ChangelogFormulaire } from "@adminPages/Changelogs/ChangelogForm";
import { Agenda } from "@commonComponents/Modules/Agenda";

Routing.setRoutingData(routes);

let el = document.getElementById("agenda_list");
if(el){
    createRoot(el).render(<Agenda />)
}

el = document.getElementById("agenda_update");
if(el){
    createRoot(el).render(<ChangelogFormulaire context="update" element={JSON.parse(el.dataset.obj)} />)
}

el = document.getElementById("agenda_create");
if(el){
    createRoot(el).render(<ChangelogFormulaire context="create" element={null} />)
}