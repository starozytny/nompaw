import '../../css/pages/randos.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { GroupeFormulaire } from "@userPages/Randos/Groupe/GroupeForm";
import { GroupeDelete } from "@userPages/Randos/Groupe/GroupeDelete";

let el = document.getElementById("groupes_update");
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
        createRoot(elem).render(<GroupeDelete context="groupe" {...elem.dataset} />)
    })
}
