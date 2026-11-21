import React from "react";
import { createRoot } from "react-dom/client";
import { DriveQuotas } from "@adminPages/Drive/DriveQuotas";

let el = document.getElementById("drive_quotas");
if (el) {
    createRoot(el).render(<DriveQuotas />)
}
