import React from "react";
import { createRoot } from "react-dom/client";
import { VideoFormulaire } from "@userPages/Video/VideoForm";
import { Videos } from "@userPages/Video/Videos";

let el = document.getElementById("videos_list");
if(el){
    createRoot(el).render(<Videos {...el.dataset} />)
}

el = document.getElementById("videos_create");
if(el){
    createRoot(el).render(<VideoFormulaire context="create" fileInfo={JSON.parse(el.dataset.fileInfo)} element={null} />)
}
