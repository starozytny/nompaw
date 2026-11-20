import React from "react";
import { createRoot } from "react-dom/client";
import Invest from "@userPages/Invest/Invest";

let el = document.getElementById("invest");
if (el) {
    createRoot(el).render(<Invest />)
}
