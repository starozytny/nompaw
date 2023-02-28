import '../../css/pages/recipes.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Recipes } from "./components/Recipes/Recipes";
import { RecipeRead } from "./components/Recipes/RecipeRead";

let el = document.getElementById("recipes_list");
if(el){
    createRoot(el).render(<Recipes />)
}

el = document.getElementById("recipes_read");
if(el){
    createRoot(el).render(<RecipeRead />)
}