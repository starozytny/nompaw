import '../../css/pages/holidays.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { ProjectFormulaire } from "@userPages/Holidays/Project/ProjectForm";
import { ProjectDelete } from "@userPages/Holidays/Project/ProjectDelete";
import { ProjectDate } from "@userPages/Holidays/Project/ProjectDate";

let el = document.getElementById("projects_update");
if(el){
    createRoot(el).render(<ProjectFormulaire context="update" element={JSON.parse(el.dataset.element)} />)
}

el = document.getElementById("projects_create");
if(el){
    createRoot(el).render(<ProjectFormulaire context="create" element={null} />)
}

let deletesProject = document.querySelectorAll('.delete-project');
if(deletesProject){
    deletesProject.forEach(elem => {
        createRoot(elem).render(<ProjectDelete context="projects" {...elem.dataset} />)
    })
}

let projectDate = document.getElementById("project_date");
if(projectDate){
    createRoot(projectDate).render(<ProjectDate {...projectDate.dataset} mode={projectDate.dataset.mode === "1"} />)
}
