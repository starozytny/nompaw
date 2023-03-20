import '../../css/pages/randos.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { RecipeRead } from "@userPages/Recipes/RecipeRead";
import { RecipeDelete } from "@userPages/Recipes/RecipeDelete";
import { GroupeFormulaire } from "@userPages/Randos/Groupe/GroupeForm";

let el = document.getElementById("recipes_read");
if(el){
    createRoot(el).render(<RecipeRead mode={el.dataset.mode === "1"}
                                      elem={JSON.parse(el.dataset.element)}
                                      steps={JSON.parse(el.dataset.steps)}
                                      ingre={JSON.parse(el.dataset.ingre)}
                                      coms={JSON.parse(el.dataset.coms)} />)
}

el = document.getElementById("groupes_update");
if(el){
    createRoot(el).render(<GroupeFormulaire context="update" element={JSON.parse(el.dataset.element)}
                                            users={JSON.parse(el.dataset.users)}
                                            members={JSON.parse(el.dataset.members)} />)
}

el = document.getElementById("groupes_create");
if(el){
    createRoot(el).render(<GroupeFormulaire context="create" element={null}
                                            users={JSON.parse(el.dataset.users)}
                                            members={[]} />)
}

let deletes = document.querySelectorAll('.delete-groupe');
if(deletes){
    deletes.forEach(elem => {
        createRoot(elem).render(<RecipeDelete context="groupe" {...elem.dataset} />)
    })
}
