import React from "react";
import { createRoot } from "react-dom/client";
import { Videos } from "@userPages/Video/Videos";

let el = document.getElementById("videos_list");
if(el){
    createRoot(el).render(<Videos {...el.dataset} />)
}
