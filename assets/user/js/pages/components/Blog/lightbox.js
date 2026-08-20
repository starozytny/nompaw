// Lightbox légère pour les photos des articles storytelling (galeries en Twig, pas de React ici).
// Regroupe toutes les <img> de l'article pour naviguer d'une photo à l'autre au clic/flèches.
export function initStoryLightbox () {
    const images = Array.from(document.querySelectorAll('article img'));
    if (images.length === 0) return;

    let currentIndex = 0;

    const overlay = document.createElement('div');
    overlay.className = 'story-lightbox';
    overlay.innerHTML = `
        <button type="button" class="story-lightbox-close" aria-label="Fermer">&times;</button>
        <button type="button" class="story-lightbox-prev" aria-label="Photo précédente">&#10094;</button>
        <img class="story-lightbox-img" src="" alt="" />
        <button type="button" class="story-lightbox-next" aria-label="Photo suivante">&#10095;</button>
        <div class="story-lightbox-counter"></div>
    `;
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('.story-lightbox-img');
    const counterEl = overlay.querySelector('.story-lightbox-counter');

    function show (index) {
        currentIndex = (index + images.length) % images.length;
        const current = images[currentIndex];
        imgEl.src = current.dataset.fullSrc || current.currentSrc || current.src;
        imgEl.alt = current.alt || '';
        counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
    }

    function open (index) {
        show(index);
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function close () {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    images.forEach((img, index) => {
        img.classList.add('story-lightbox-trigger');
        img.addEventListener('click', () => open(index));
    });

    overlay.querySelector('.story-lightbox-close').addEventListener('click', close);
    overlay.querySelector('.story-lightbox-prev').addEventListener('click', () => show(currentIndex - 1));
    overlay.querySelector('.story-lightbox-next').addEventListener('click', () => show(currentIndex + 1));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.addEventListener('keydown', (e) => {
        if (!overlay.classList.contains('active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') show(currentIndex - 1);
        if (e.key === 'ArrowRight') show(currentIndex + 1);
    });
}
