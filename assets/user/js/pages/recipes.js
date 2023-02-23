import '../../css/pages/recipes.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Recipes } from "./components/Recipes/Recipes";

let el = document.getElementById("recipes_list");
if(el){
    createRoot(el).render(<Recipes />)
}