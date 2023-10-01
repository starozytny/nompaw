import '../../css/pages/holidays.scss';

import React from "react";
import toastr from "toastr";
import { createRoot } from "react-dom/client";
import { ProjectFormulaire } from "@userPages/Holidays/Project/ProjectForm";
import { ProjectDelete } from "@userPages/Holidays/Project/ProjectDelete";
import { ProjectDate } from "@userPages/Holidays/Project/ProjectDate";
import { ProjectHouse } from "@userPages/Holidays/Project/ProjectHouse";
import { ProjectActivities } from "@userPages/Holidays/Project/ProjectActivities";
import { ProjectTodos } from "@userPages/Holidays/Project/ProjectTodos";
import { ProjectLifestyle } from "@userPages/Holidays/Project/ProjectLifestyle";
import { ProjectRoute } from "@userPages/Holidays/Project/ProjectRoute";
import { ProjectBudget } from "@userPages/Holidays/Project/ProjectBudget";

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

let projectBudget = document.getElementById("project_budget");
if(projectBudget){
    createRoot(projectBudget).render(<ProjectBudget {...projectBudget.dataset} />)
}

let projectRoute = document.getElementById("project_route");
if(projectRoute){
    createRoot(projectRoute).render(<ProjectRoute {...projectRoute.dataset} />)
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
        toastr.info('Lien de partage copié')
    })
}
