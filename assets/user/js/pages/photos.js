import React from "react";
import { createRoot } from "react-dom/client";
import { PhotosGallery } from "@userPages/Photos/PhotosGallery";

let el = document.getElementById("photos_gallery");
if (el) {
    createRoot(el).render(<PhotosGallery userId={el.dataset.userId} isAdmin={el.dataset.isAdmin === '1'} />)
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', { scope: '/espace-membre/photos/' });
}

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__deferredPhotosInstallPrompt = e;
});
