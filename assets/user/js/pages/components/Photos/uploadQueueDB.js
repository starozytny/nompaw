// File d'attente d'upload persistée en IndexedDB : si l'onglet est fermé ou l'appli mise en
// arrière-plan (mobile) avant la fin d'un envoi groupé, les fichiers pas encore confirmés uploadés
// restent sur disque et sont repris automatiquement à la prochaine ouverture de la page (voir
// resumeQueuedUploads dans PhotosGallery.jsx). Ne survit pas à une fermeture d'onglet en cours de
// route (pas de Background Sync ici, support trop inégal sur iOS/Safari) : seulement à la reprise.

const DB_NAME = 'nompaw-photos-upload-queue';
const STORE_NAME = 'pending';

function openDB () {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);

		request.onupgradeneeded = () => {
			request.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function enqueueFiles (files, albumId) {
	const db = await openDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	const store = tx.objectStore(STORE_NAME);

	return Promise.all(files.map(file => new Promise((resolve, reject) => {
		const request = store.add({ file, albumId: albumId || null, addedAt: Date.now() });
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	})));
}

export async function getAllQueued () {
	const db = await openDB();
	const tx = db.transaction(STORE_NAME, 'readonly');

	return new Promise((resolve, reject) => {
		const request = tx.objectStore(STORE_NAME).getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export async function dequeue (id) {
	const db = await openDB();
	const tx = db.transaction(STORE_NAME, 'readwrite');
	tx.objectStore(STORE_NAME).delete(id);

	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}
