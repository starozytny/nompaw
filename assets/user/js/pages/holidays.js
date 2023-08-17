import '../../css/pages/holidays.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { ProjectFormulaire } from "@userPages/Holidays/Project/ProjectForm";

let el = document.getElementById("projects_update");
if(el){
    createRoot(el).render(<ProjectFormulaire context="update" element={JSON.parse(el.dataset.element)} />)
}

el = document.getElementById("projects_create");
if(el){
    createRoot(el).render(<ProjectFormulaire context="create" element={null} />)
}
