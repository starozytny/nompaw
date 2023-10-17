import '../../css/pages/budget.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Budget } from "@userPages/Budget/Budget";

let el = document.getElementById("budget");
if(el){
    createRoot(el).render(<Budget />)
}