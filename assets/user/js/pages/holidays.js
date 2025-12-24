import '../../css/pages/holidays.scss';

import React from "react";
import { createRoot } from "react-dom/client";

import Toastr from "@tailwindFunctions/toastr";

import { ProjectFormulaire } from "@userPages/Holidays/Project/ProjectForm";
import { ProjectDelete } from "@userPages/Holidays/Project/ProjectDelete";
import { ProjectHouse } from "@userPages/Holidays/Project/ProjectHouse";
import { ProjectActivities } from "@userPages/Holidays/Project/ProjectActivities";
import { ProjectTodos } from "@userPages/Holidays/Project/ProjectTodos";
import { ProjectLifestyle } from "@userPages/Holidays/Project/ProjectLifestyle";
import { ProjectBudget } from "@userPages/Holidays/Project/Components/ProjectBudget";
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
                                                lifestyle={projectRead.dataset.lifestyle}
                                                activities={projectRead.dataset.activities}
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

let projectLifestyle = document.getElementById("project_lifestyle");
if(projectLifestyle){
    createRoot(projectLifestyle).render(<ProjectLifestyle {...projectLifestyle.dataset} />)
}

let projectActivities = document.getElementById("project_activities");
if(projectActivities){
    createRoot(projectActivities).render(<ProjectActivities {...projectActivities.dataset} mode={projectActivities.dataset.mode === "1"} />)
}

let projectTodos = document.getElementById("project_todos");
if(projectTodos){
    createRoot(projectTodos).render(<ProjectTodos {...projectTodos.dataset} />)
}

let share = document.getElementById('share_link');
if(share){
    share.addEventListener('click', function () {
        navigator.clipboard.writeText(location.origin + share.dataset.url);
        Toastr.toast('info', 'Lien de partage copié');
    })
}
