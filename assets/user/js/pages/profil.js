import '../../css/pages/profil.scss';

import React from "react";
import { createRoot } from "react-dom/client";
import { UserFormulaire } from "@adminPages/Users/UserForm";

let el = document.getElementById("profil_update");
if(el){
    createRoot(el).render(<UserFormulaire context="update" page='profil' element={JSON.parse(el.dataset.obj)} />)
}