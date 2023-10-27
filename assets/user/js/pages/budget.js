import '../../css/pages/budget.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Budget } from "@userPages/Budget/Budget";
import { InitForm } from "@userPages/Budget/InitForm";

let el = document.getElementById("budget");
if(el){
    createRoot(el).render(<Budget {...el.dataset} />)
}

el = document.getElementById("budget_init");
if(el){
    createRoot(el).render(<InitForm {...el.dataset} />)
}
