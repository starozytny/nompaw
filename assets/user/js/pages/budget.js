import '../../css/pages/budget.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Budget } from "@userPages/Budget/Budget";
import { InitForm } from "@userPages/Budget/InitForm";
import {Recurrences} from "@userPages/Budget/Reccurences/Recurrences";
import {RecurrentFormulaire} from "@userPages/Budget/Reccurences/RecurrentForm";

let el = document.getElementById("budget");
if(el){
    createRoot(el).render(<Budget {...el.dataset} />)
}

el = document.getElementById("budget_init");
if(el){
    createRoot(el).render(<InitForm {...el.dataset} />)
}

el = document.getElementById("recurrences_list");
if(el){
    createRoot(el).render(<Recurrences {...el.dataset} />)
}

el = document.getElementById("recurrences_create");
if(el){
    createRoot(el).render(<RecurrentFormulaire context="create" element={null} />)
}

el = document.getElementById("recurrences_update");
if(el){
    createRoot(el).render(<RecurrentFormulaire context="update"  element={JSON.parse(el.dataset.obj)} />)
}
