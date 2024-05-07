import React from "react";
import { createRoot } from "react-dom/client";
import { Forget } from '@appFolder/pages/components/Security/Forget';
import { Reinit } from "@appFolder/pages/components/Security/Reinit";
import { UserFormulaire } from "@appFolder/pages/components/Security/UserForm";

let el = document.getElementById("forget");
if(el){
    createRoot(el).render(<Forget />)
}

el = document.getElementById("reinit");
if(el){
    createRoot(el).render(<Reinit {...el.dataset} />)
}

el = document.getElementById("registration");
if(el){
    createRoot(el).render(<UserFormulaire />)
}
