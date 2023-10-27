import '../../css/pages/budget.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Budget } from "@userPages/Budget/Budget";
import { InitForm } from "@userPages/Budget/InitForm";
import { Recurrences } from "@userPages/Budget/Reccurences/Recurrences";
import { RecurrentFormulaire } from "@userPages/Budget/Reccurences/RecurrentForm";
import { Categories } from "@userPages/Budget/Categories/Categories";
import { CategoryFormulaire } from "@userPages/Budget/Categories/CategoryForm";

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
    createRoot(el).render(<RecurrentFormulaire context="create" categories={JSON.parse(el.dataset.categories)} element={null} />)
}

el = document.getElementById("recurrences_update");
if(el){
    createRoot(el).render(<RecurrentFormulaire context="update" categories={JSON.parse(el.dataset.categories)} element={JSON.parse(el.dataset.obj)} />)
}

el = document.getElementById("categories_list");
if(el){
    createRoot(el).render(<Categories {...el.dataset} />)
}

el = document.getElementById("categories_create");
if(el){
    createRoot(el).render(<CategoryFormulaire context="create" element={null} />)
}

el = document.getElementById("categories_update");
if(el){
    createRoot(el).render(<CategoryFormulaire context="update" element={JSON.parse(el.dataset.obj)} />)
}
