import React from "react";
import { createRoot } from "react-dom/client";
import { PhotosAccess } from "@adminPages/PhotosAccess/PhotosAccess";

let el = document.getElementById("photos_access_list");
if (el) {
    createRoot(el).render(<PhotosAccess />)
}
