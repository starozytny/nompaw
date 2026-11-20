import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "@userPages/Dashboard/Dashboard";

let el = document.getElementById("dashboard");
if (el) {
    createRoot(el).render(<Dashboard paths={JSON.parse(el.dataset.paths)} />)
}
