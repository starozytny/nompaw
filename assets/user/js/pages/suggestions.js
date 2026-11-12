import React from "react";
import { createRoot } from "react-dom/client";
import { SuggestionsList } from "@userPages/Aventures/Suggestions/SuggestionsList";

let el = document.getElementById("suggestions");
if (el) {
    createRoot(el).render(<SuggestionsList />)
}
