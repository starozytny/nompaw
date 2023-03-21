import '../../css/pages/randos.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { GroupeFormulaire } from "@userPages/Randos/Groupe/GroupeForm";
import { GroupeDelete } from "@userPages/Randos/Groupe/GroupeDelete";
import { RandoFormulaire } from "@userPages/Randos/Rando/RandoForm";
import { RandoDelete } from "@userPages/Randos/Rando/RandoDelete";
import {RandoDate} from "@userPages/Randos/Rando/RandoDate";

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

let deletesGroupes = document.querySelectorAll('.delete-groupe');
if(deletesGroupes){
    deletesGroupes.forEach(elem => {
        createRoot(elem).render(<GroupeDelete {...elem.dataset} />)
    })
}

el = document.getElementById("randos_update");
if(el){
    createRoot(el).render(<RandoFormulaire context="update" element={JSON.parse(el.dataset.element)}
                                           groupeId={parseInt(el.dataset.groupeId)} />)
}

el = document.getElementById("randos_create");
if(el){
    createRoot(el).render(<RandoFormulaire context="create" element={null}
                                           groupeId={parseInt(el.dataset.groupeId)} />)
}

let deletesRandos = document.querySelectorAll('.delete-rando');
if(deletesRandos){
    deletesRandos.forEach(elem => {
        createRoot(elem).render(<RandoDelete {...elem.dataset} />)
    })
}

let randoDate = document.getElementById("rando_date");
if(randoDate){
    createRoot(randoDate).render(<RandoDate {...randoDate.dataset} mode={randoDate.dataset.mode === "1"} />)
}