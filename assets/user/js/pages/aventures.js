import '../../css/pages/aventures.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { GroupeFormulaire } from "@userPages/Aventures/Groupe/GroupeForm";
import { GroupeDelete } from "@userPages/Aventures/Groupe/GroupeDelete";
import { RandoFormulaire } from "@userPages/Aventures/Rando/RandoForm";
import { RandoDelete } from "@userPages/Aventures/Rando/RandoDelete";
import { RandoDate } from "@userPages/Aventures/Rando/RandoDate";
import { RandoAdventure } from "@userPages/Aventures/Rando/RandoAdventure";
import { RandoImages } from "@userPages/Aventures/Rando/RandoImages";
import { RandoEnd } from "@userPages/Aventures/Rando/RandoEnd";

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
                                           users={JSON.parse(el.dataset.users)}
                                           userId={parseInt(el.dataset.userId)}
                                           groupeId={parseInt(el.dataset.groupeId)} />)
}

el = document.getElementById("randos_create");
if(el){
    createRoot(el).render(<RandoFormulaire context="create" element={null}
                                           users={JSON.parse(el.dataset.users)}
                                           userId={parseInt(el.dataset.userId)}
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

let randoAdventure = document.getElementById("rando_adventures");
if(randoAdventure){
    createRoot(randoAdventure).render(<RandoAdventure {...randoAdventure.dataset}
                                                      mode={randoAdventure.dataset.mode === "1"}
                                                      haveAdventure={randoAdventure.dataset.haveAdventure === "1"} />)
}

let randoImages = document.getElementById("rando_images");
if(randoImages){
    createRoot(randoImages).render(<RandoImages {...randoImages.dataset} />)
}

let endRandos = document.querySelectorAll('.end-rando');
if(endRandos){
    endRandos.forEach(elem => {
        createRoot(elem).render(<RandoEnd {...elem.dataset} />)
    })
}
