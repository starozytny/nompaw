import React from "react";
import { createRoot } from "react-dom/client";
import { Drive } from "@userPages/Drive/Drive";

let el = document.getElementById("drive");
if (el) {
    createRoot(el).render(<Drive />)
}
