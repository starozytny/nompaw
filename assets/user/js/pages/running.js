import React from "react";
import { createRoot } from "react-dom/client";
import Running from "@userPages/Running/Running";

let el = document.getElementById("running");
if (el) {
    createRoot(el).render(<Running />)
}
