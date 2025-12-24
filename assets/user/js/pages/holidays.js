import '../../css/pages/holidays.scss';

import React from "react";
import { createRoot } from "react-dom/client";

import Toastr from "@tailwindFunctions/toastr";

import { ProjectFormulaire } from "@userPages/Holidays/Project/ProjectForm";
import { ProjectDelete } from "@userPages/Holidays/Project/ProjectDelete";
import { ProjectHouse } from "@userPages/Holidays/Project/ProjectHouse";
import { ProjectRead } from "@userPages/Holidays/Project/ProjectRead";

let el = document.getElementById("projects_update");
if(el){
    createRoot(el).render(<ProjectFormulaire context="update" element={JSON.parse(el.dataset.element)} />)
}

el = document.getElementById("projects_create");
if(el){
    createRoot(el).render(<ProjectFormulaire context="create" element={null} />)
}

let projectRead = document.getElementById("projects_read");
if(projectRead){
    createRoot(projectRead).render(<ProjectRead elem={JSON.parse(projectRead.dataset.elem)}
                                                userId={projectRead.dataset.userId}
                                                lifestyles={projectRead.dataset.lifestyles}
                                                activities={projectRead.dataset.activities}
                                                todos={projectRead.dataset.todos}
    />)
}

let deletesProject = document.querySelectorAll('.delete-project');
if(deletesProject){
    deletesProject.forEach(elem => {
        createRoot(elem).render(<ProjectDelete context="projects" {...elem.dataset} />)
    })
}

let projectHouse = document.getElementById("project_house");
if(projectHouse){
    createRoot(projectHouse).render(<ProjectHouse {...projectHouse.dataset} mode={projectHouse.dataset.mode === "1"} />)
}

let share = document.getElementById('share_link');
if(share){
    share.addEventListener('click', function () {
        navigator.clipboard.writeText(location.origin + share.dataset.url);
        Toastr.toast('info', 'Lien de partage copié');
    })
}
