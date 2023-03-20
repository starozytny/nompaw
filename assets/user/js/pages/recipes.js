import '../../css/pages/recipes.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { RecipeRead } from "@userPages/Recipes/RecipeRead";
import { RecipeFormulaire } from "@userPages/Recipes/RecipeForm";
import { RecipeDelete } from "@userPages/Recipes/RecipeDelete";
import {Favorite} from "@userPages/Favorite/Favorite";

let el = document.getElementById("recipes_read");
if(el){
    createRoot(el).render(<RecipeRead mode={el.dataset.mode === "1"}
                                      elem={JSON.parse(el.dataset.element)}
                                      steps={JSON.parse(el.dataset.steps)}
                                      ingre={JSON.parse(el.dataset.ingre)}
                                      coms={JSON.parse(el.dataset.coms)} />)
}

el = document.getElementById("recipes_update");
if(el){
    createRoot(el).render(<RecipeFormulaire context="update" element={JSON.parse(el.dataset.element)} />)
}

el = document.getElementById("recipes_create");
if(el){
    createRoot(el).render(<RecipeFormulaire context="create" element={null} />)
}

let deletesRecipe = document.querySelectorAll('.delete-recipe');
if(deletesRecipe){
    deletesRecipe.forEach(elem => {
        createRoot(elem).render(<RecipeDelete context="recipes" {...elem.dataset} />)
    })
}

let favorites = document.querySelectorAll('.favorite');
if(favorites){
    favorites.forEach(elem => {
        createRoot(elem).render(<Favorite {...elem.dataset} />)
    })
}
