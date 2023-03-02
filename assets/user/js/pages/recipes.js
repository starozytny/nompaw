import '../../css/pages/recipes.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { Recipes } from "./components/Recipes/Recipes";
import { RecipeRead } from "./components/Recipes/RecipeRead";
import { RecipeFormulaire } from "./components/Recipes/RecipeForm";

let el = document.getElementById("recipes_list");
if(el){
    createRoot(el).render(<Recipes />)
}

el = document.getElementById("recipes_read");
if(el){
    createRoot(el).render(<RecipeRead elem={JSON.parse(el.dataset.element)} />)
}

el = document.getElementById("recipes_update");
if(el){
    createRoot(el).render(<RecipeFormulaire context="update" element={JSON.parse(el.dataset.element)} steps={JSON.parse(el.dataset.steps)} />)
}

el = document.getElementById("recipes_create");
if(el){
    createRoot(el).render(<RecipeFormulaire context="create" element={null} steps={[]} />)
}