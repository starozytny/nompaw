import '../../css/pages/recipes.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { RecipeRead } from "@userPages/Recipes/RecipeRead";
import { RecipeFormulaire } from "@userPages/Recipes/RecipeForm";
import { RecipeDelete } from "@userPages/Recipes/RecipeDelete";

let el = document.getElementById("recipes_read");
if(el){
    createRoot(el).render(<RecipeRead elem={JSON.parse(el.dataset.element)}
                                      steps={JSON.parse(el.dataset.steps)}
                                      ingre={JSON.parse(el.dataset.ingre)} />)
}

el = document.getElementById("recipes_update");
if(el){
    createRoot(el).render(<RecipeFormulaire context="update" element={JSON.parse(el.dataset.element)}
                                            steps={JSON.parse(el.dataset.steps)} />)
}

el = document.getElementById("recipes_create");
if(el){
    createRoot(el).render(<RecipeFormulaire context="create" element={null} steps={[]} />)
}

let deletesRecipe = document.querySelectorAll('.delete-recipe');
if(deletesRecipe){
    deletesRecipe.forEach(elem => {
        createRoot(elem).render(<RecipeDelete context="recipes" {...elem.dataset} />)
    })
}