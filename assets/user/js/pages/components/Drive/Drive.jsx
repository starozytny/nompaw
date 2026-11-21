import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Check, ChevronLeft, ChevronRight, Copy, CornerUpRight, Download, ExternalLink, Folder, FolderInput, FolderPlus, Link2, LogOut, Pencil, Search, Trash2, Upload, Users, X } from "lucide-react";
import { Button, ButtonA } from "@tailwindComponents/Elements/Button";
import { TooltipProvider } from "@shadcnComponents/ui/tooltip";
import {
	DropOverlay, FILTERS, FileGlyph, Hint, KINDS, Lightbox, SidePanel, Snackbar,
	formatDate, formatSize, kindOf, period, useConfirmTap, useMediaQuery, useSnackbar, useWindowDrop,
} from "./DriveUi";
import "./drive.css";

const URL_LIST = "intern_api_drive_list";
const URL_UPLOAD = "intern_api_drive_upload";
const URL_DOWNLOAD = "intern_api_drive_download";
const URL_THUMB = "intern_api_drive_thumb";
const URL_PDF_PAGES = "intern_api_drive_pdf_pages";
const URL_DELETE = "intern_api_drive_delete";
const URL_RENAME = "intern_api_drive_rename";
const URL_SHARE = "intern_api_drive_share";
const URL_UNSHARE = "intern_api_drive_unshare";
const URL_MOVE = "intern_api_drive_move";
const URL_ALBUM_CREATE = "intern_api_drive_album_create";
const URL_ALBUM_RENAME = "intern_api_drive_album_rename";
const URL_ALBUM_DELETE = "intern_api_drive_album_delete";
const URL_ALBUM_MOVE = "intern_api_drive_album_move";
const URL_USERS = "intern_api_drive_users";
const URL_MEMBER_SET = "intern_api_drive_album_member_set";
const URL_MEMBER_REMOVE = "intern_api_drive_album_member_remove";
const ROLE_LABELS = { owner: "Propriétaire", editor: "Éditeur", viewer: "Lecteur" };
const URL_SHORTCUT_CREATE = "intern_api_drive_shortcut_create";
const URL_SHORTCUT_DELETE = "intern_api_drive_shortcut_delete";

// Mêmes durées que les partages de photos (clés validées côté serveur).
const SHARE_DURATIONS = [{ value: "1d", label: "1 jour" }, { value: "7d", label: "7 jours" }, { value: "30d", label: "30 jours" }];

// Erreurs simples : { message } ; erreurs de validation : [{ name, message }].
const errorMessage = (error) => error?.response?.data?.message || error?.response?.data?.[0]?.message || "Une erreur est survenue, réessaie.";

export function Drive () {
	const isMobile = useMediaQuery("(max-width: 767px)");
	const { snack, show } = useSnackbar();
	const input = useRef();

	const [loading, setLoading] = useState(true);
	const [files, setFiles] = useState([]);
	const [used, setUsed] = useState(0);
	const [quota, setQuota] = useState(0);
	const [pending, setPending] = useState([]); // fichiers en cours d'envoi
	const [progress, setProgress] = useState(0);
	const [freshIds, setFreshIds] = useState([]);
	const [query, setQuery] = useState("");
	const [filter, setFilter] = useState(null);
	const [open, setOpen] = useState(null);
	const [albums, setAlbums] = useState([]);
	const [albumId, setAlbumId] = useState(null); // dossier ouvert ; null = « Mon Drive »
	const [creating, setCreating] = useState(false);
	// Déposer : à sa racine, ou dans un dossier dont on est propriétaire ou éditeur.
	const canUpload = albumId === null || ["owner", "editor"].includes(albums.find(a => a.id === albumId)?.role);
	const [shortcuts, setShortcuts] = useState([]); // [{ id, fileId, albumId }]
	const [me, setMe] = useState(null);
	const [sharing, setSharing] = useState(false); // panneau « Partager » du dossier ouvert

	const applyState = (data) => {
		setFiles(data.files);
		setAlbums(data.albums);
		setShortcuts(data.shortcuts);
		setMe(data.me);
		setUsed(data.used);
		setQuota(data.quota);
	};

	useEffect(() => {
		axios.get(Routing.generate(URL_LIST))
			.then((response) => applyState(response.data))
			.catch((error) => show(errorMessage(error)))
			.then(() => setLoading(false));
	}, []);

	const onFiles = useCallback((fileList) => {
		const list = Array.from(fileList || []);
		if (list.length === 0 || pending.length > 0) return;
		if (!canUpload) { show("Ce dossier partagé est en lecture seule."); return; }

		const total = list.reduce((s, f) => s + f.size, 0);
		if (used + total > quota) {
			show("Espace insuffisant : il te reste " + formatSize(Math.max(0, quota - used)) + ".");
			return;
		}

		const formData = new FormData();
		list.forEach(f => formData.append("files[]", f));
		if (albumId) formData.append("albumId", albumId);
		setPending(list.map((f, i) => ({ key: i + f.name, name: f.name, mime: f.type })));
		setProgress(0);

		const before = new Set(files.map(f => f.id));
		axios.post(Routing.generate(URL_UPLOAD), formData, {
			headers: { 'Content-Type': 'multipart/form-data' },
			onUploadProgress: (e) => e.total && setProgress(Math.round((e.loaded / e.total) * 100)),
		})
			.then((response) => {
				applyState(response.data);
				const ids = response.data.files.filter(f => !before.has(f.id)).map(f => f.id);
				setFreshIds(ids);
				setTimeout(() => setFreshIds([]), 1600);
				show(list.length > 1 ? `${list.length} fichiers importés` : "Fichier importé");
			})
			.catch((error) => show(errorMessage(error)))
			.then(() => setPending([]));
	}, [pending.length, used, quota, files, show, albumId, canUpload]);

	const dragging = useWindowDrop(onFiles);

	const remove = (file) => {
		setOpen(null);
		axios.delete(Routing.generate(URL_DELETE, { id: file.id }))
			.then((response) => { applyState(response.data); show(`« ${file.name} » supprimé`); })
			.catch((error) => show(errorMessage(error)));
	};

	// Chaque action renvoie la liste à jour ; avec openId, on y relit le fichier ouvert pour garder l'aperçu synchronisé.
	const update = (request, message, openId) => request
		.then((response) => {
			applyState(response.data);
			if (openId !== undefined) setOpen(response.data.files.find(f => f.id === openId) || null);
			show(message);
			return true;
		})
		.catch((error) => { show(errorMessage(error)); return false; });
	const actions = (file) => ({
		onDelete: () => remove(file),
		onRename: (name) => update(axios.put(Routing.generate(URL_RENAME, { id: file.id }), { name }), "Fichier renommé", file.id),
		onShare: (duration) => update(axios.post(Routing.generate(URL_SHARE, { id: file.id }), { duration }), file.shareUrl ? "Durée du partage mise à jour" : "Lien de partage créé", file.id),
		onUnshare: () => update(axios.delete(Routing.generate(URL_UNSHARE, { id: file.id })), "Partage arrêté : l'ancien lien ne fonctionne plus", file.id),
		onMove: (id) => moveFile(file, id, file.id),
		albums: tree(writable), // où ranger le fichier ; les raccourcis ne vont que dans ses propres dossiers (filtré dans Preview)
		shortcuts: shortcuts.filter(sc => sc.fileId === file.id),
		albumName: (id) => id ? albums.find(a => a.id === id)?.name : "Mon Drive",
		onAddShortcut: (id) => update(axios.post(Routing.generate(URL_SHORTCUT_CREATE), { fileId: file.id, albumId: id }),
			`Raccourci ajouté dans « ${id ? albums.find(a => a.id === id)?.name : "Mon Drive"} »`, file.id),
		onRemoveShortcut: (shortcutId) => update(axios.delete(Routing.generate(URL_SHORTCUT_DELETE, { id: shortcutId })), "Raccourci retiré (le fichier est conservé)", file.id),
		notify: show,
	});
	// openId : garde l'aperçu ouvert synchronisé (déplacement depuis le panneau) ; absent pour un glisser-déposer.
	function moveFile (file, id, openId) {
		return update(axios.put(Routing.generate(URL_MOVE, { id: file.id }), { albumId: id }),
			id ? `« ${file.name} » déplacé dans « ${albums.find(a => a.id === id)?.name} »` : `« ${file.name} » déplacé dans Mon Drive`, openId);
	}
	const nameOf = (id) => id ? albums.find(a => a.id === id)?.name : "Mon Drive";
	const descendantsOf = (id) => childrenOf(id).flatMap(a => [a.id, ...descendantsOf(a.id)]);
	function moveAlbum (id, parentId) {
		const album = albums.find(a => a.id === id);
		if (!album || (album.parentId ?? null) === parentId) return;
		if (parentId !== null && (parentId === id || descendantsOf(id).includes(parentId))) {
			return show("Impossible de déplacer un dossier dans lui-même ou dans un de ses sous-dossiers.");
		}
		return update(axios.put(Routing.generate(URL_ALBUM_MOVE, { id }), { parentId }), `Dossier « ${album.name} » déplacé dans « ${nameOf(parentId)} »`);
	}
	// Dépôt sur un dossier (targetId) ou sur « Mon Drive » (null). Un fichier glissé depuis Mon Drive vers un dossier
	// y reçoit un raccourci (il reste en place) ; depuis un dossier, il est déplacé. Un dossier glissé est déplacé.
	const shortcutOnDrop = albumId === null;
	const dropInto = (targetId) => (kind, id) => {
		if (kind === "folder") return moveAlbum(id, targetId);
		const file = files.find(f => f.id === id);
		if (!file) return;
		const alreadyThere = (file.albumId ?? null) === targetId || shortcuts.some(sc => sc.fileId === id && (sc.albumId ?? null) === targetId);
		if (shortcutOnDrop && targetId !== null && albums.find(a => a.id === targetId)?.role === "owner") {
			if (alreadyThere) return show(`« ${file.name} » est déjà dans « ${nameOf(targetId)} »`);
			return update(axios.post(Routing.generate(URL_SHORTCUT_CREATE), { fileId: id, albumId: targetId }), `Raccourci vers « ${file.name} » ajouté dans « ${nameOf(targetId)} »`);
		}
		if ((file.albumId ?? null) !== targetId) moveFile(file, targetId);
	};
	const setMember = (userId, role) => update(axios.post(Routing.generate(URL_MEMBER_SET, { id: albumId }), { userId, role }), "Partage mis à jour");
	const removeMember = (userId) => update(axios.delete(Routing.generate(URL_MEMBER_REMOVE, { id: albumId, userId })), "Accès retiré");
	const leaveAlbum = () => update(axios.delete(Routing.generate(URL_MEMBER_REMOVE, { id: albumId, userId: me })), "Tu as quitté le dossier partagé")
		.then((ok) => ok && go(null));
	const createAlbum = (name) => update(axios.post(Routing.generate(URL_ALBUM_CREATE), { name, parentId: albumId }), "Dossier créé");
	const renameAlbum = (name) => update(axios.put(Routing.generate(URL_ALBUM_RENAME, { id: albumId }), { name }), "Dossier renommé");
	const deleteAlbum = () => {
		const parent = albums.find(a => a.id === albums.find(x => x.id === albumId)?.parentId);
		return update(axios.delete(Routing.generate(URL_ALBUM_DELETE, { id: albumId })), `Dossier supprimé : son contenu est dans « ${parent ? parent.name : "Mon Drive"} »`)
			.then((ok) => ok && go(parent ? parent.id : null));
	};
	const go = (id) => { setCreating(false); setSharing(false); setAlbumId(id); };
	const childrenOf = (id) => albums.filter(a => (a.parentId ?? null) === id);
	// Ancêtres du dossier, de la racine vers lui (sans lui-même).
	const ancestorsOf = (id) => { const path = []; let a = albums.find(x => x.id === albums.find(y => y.id === id)?.parentId); while (a) { path.unshift(a); a = albums.find(x => x.id === a.parentId); } return path; };
	// Arborescence aplatie pour le sélecteur « Dossier » : [{ id, name, depth }] dans l'ordre d'affichage.
	const tree = (keep = () => true, parentId = null, depth = 0) => childrenOf(parentId).filter(keep).flatMap(a => [{ ...a, depth }, ...tree(keep, a.id, depth + 1)]);
	const writable = (a) => a.role === "owner" || a.role === "editor";
	const owned = (a) => a.role === "owner";

	// Recherche et filtres portent sur tout le Drive ; sinon on liste le dossier ouvert (ou la racine).
	const searching = !!(query || filter);

	// Dans un dossier : ses fichiers + les raccourcis qui y pointent (marqués shortcutId). La recherche ne liste que les fichiers, une fois.
	const visible = useMemo(() => {
		const match = (f) => (!filter || kindOf(f.mime) === filter) && (!query || f.name.toLowerCase().includes(query.toLowerCase()));
		if (searching) return files.filter(match);
		const here = files.filter(f => (f.albumId ?? null) === albumId);
		const linked = shortcuts.filter(sc => (sc.albumId ?? null) === albumId)
			.flatMap(sc => { const f = files.find(x => x.id === sc.fileId); return f ? [{ ...f, shortcutId: sc.id }] : []; });
		return [...here, ...linked].filter(match).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
	}, [files, shortcuts, filter, query, searching, albumId]);

	const groups = useMemo(() => {
		const g = [];
		visible.forEach(f => {
			const p = period(f.createdAt);
			const last = g[g.length - 1];
			last && last.label === p ? last.files.push(f) : g.push({ label: p, files: [f] });
		});
		return g;
	}, [visible]);

	const byKind = useMemo(() => {
		const m = {};
		files.filter(f => f.mine).forEach(f => { const k = kindOf(f.mime); m[k] = (m[k] || 0) + f.size; });
		return Object.entries(m).sort((a, b) => b[1] - a[1]);
	}, [files]);

	if (loading) {
		return <div className="mx-auto flex max-w-5xl flex-col gap-4" aria-busy="true">
			<div className="h-12 animate-pulse rounded-full bg-gray-200" />
			<div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
			<div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
		</div>
	}

	const empty = files.length === 0 && pending.length === 0;
	const currentAlbum = albums.find(a => a.id === albumId);
	const countIn = (id) => files.filter(f => f.albumId === id).length + shortcuts.filter(sc => sc.albumId === id).length;
	const removeShortcut = (shortcutId) => update(axios.delete(Routing.generate(URL_SHORTCUT_DELETE, { id: shortcutId })), "Raccourci retiré (le fichier est conservé)");
	const preview = open && <Preview file={open} {...actions(open)} />;
	const uploading = pending.length > 0;
	const isImage = !!open && kindOf(open.mime) === "image";
	const isPdf = !!open && kindOf(open.mime) === "pdf";
	// Visionneuse plein écran : tous les fichiers sur mobile (bande d'infos à tirer), images et PDF sur ordinateur
	// (les autres y ont le panneau latéral). Navigation dans l'ordre de la liste affichée, recherche et filtres compris.
	const viewable = (f) => ["image", "pdf"].includes(kindOf(f.mime));
	const inViewer = !!open && (viewable(open) || isMobile);
	const viewerList = isMobile ? visible : visible.filter(viewable);
	const viewerIndex = inViewer ? viewerList.findIndex(f => f.id === open.id) : -1;
	const importHint = !canUpload ? "Dossier partagé en lecture seule" : uploading ? "Importation en cours…" : `Ou glisse tes fichiers dans la page · ${formatSize(Math.max(0, quota - used))} disponibles`;

	// contain: inline-size — la largeur de la page vient de l'écran, jamais de son contenu : sans ça,
	// une rangée défilante ou un bouton qui s'élargit (« Confirmer ») poussait toute la page hors écran
	// sur mobile, car la colonne du layout s'adapte à son contenu le plus large.
	return <TooltipProvider delayDuration={400}>
	<div className="mx-auto max-w-5xl pb-24 [contain:inline-size] md:pb-8">
		{/* Recherche + filtres */}
		<div className="sticky top-0 z-20 -mx-1 bg-gradient-to-b from-gray-100 from-70% to-transparent px-1 pb-3 pt-1">
			<div className="flex items-center gap-3">
				<label className="flex h-12 flex-1 items-center gap-3 rounded-full bg-[#e9eef6] px-4 transition-[background-color,box-shadow] duration-200 ease-out focus-within:bg-white focus-within:shadow-[0_1px_3px_rgba(60,64,67,.3),0_4px_8px_3px_rgba(60,64,67,.15)]">
					<Search size={20} className="shrink-0 text-gray-600" />
					<input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans Drive" aria-label="Rechercher dans Drive"
						   className="min-w-0 flex-1 border-0 bg-transparent p-0 text-base text-gray-900 placeholder:text-gray-600 focus:outline-none focus:ring-0" />
					{query && <Hint label="Effacer la recherche">
						<button type="button" aria-label="Effacer la recherche" onClick={() => setQuery("")} className="drive-check -mr-2 flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"><X size={18} /></button>
					</Hint>}
				</label>
				{/* Bouton standard du site ; le <span> porte l'infobulle car Button n'accepte pas de ref.
				    Les noms de la police d'icônes sont inversés : « download » dessine la flèche montante. */}
				<Hint label={importHint} side="bottom" align="end">
					<span className="hidden md:inline-flex">
						<Button type={uploading || !canUpload ? "disabled" : "blue"} iconLeft="download" onClick={() => canUpload && input.current.click()}>Importer</Button>
					</span>
				</Hint>
			</div>

			<div className="drive-noscrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
				{FILTERS.map(k => {
					const on = filter === k;
					return <button key={k} type="button" aria-pressed={on} onClick={() => setFilter(on ? null : k)}
								   className={`drive-press flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium ${on ? "border-transparent bg-[#c2e7ff] text-[#001d35]" : "border-gray-400 bg-white text-gray-700 hover:bg-gray-50"}`}>
						{on ? <Check size={16} className="drive-check" /> : <KindIcon kind={k} size={16} />}
						{KINDS[k].label}
					</button>
				})}
			</div>
		</div>

		{!searching && currentAlbum && <>
			<AlbumBar key={currentAlbum.id} album={currentAlbum} ancestors={ancestorsOf(currentAlbum.id)} count={countIn(currentAlbum.id)}
					  onNavigate={go} onRename={renameAlbum} onDelete={deleteAlbum} dropInto={dropInto}
					  moveTargets={[{ id: null, name: "Mon Drive", depth: 0 }, ...tree(owned).map(a => ({ ...a, depth: a.depth + 1 }))]
						  .filter(a => a.id !== currentAlbum.id && a.id !== (currentAlbum.parentId ?? null) && !descendantsOf(currentAlbum.id).includes(a.id))}
					  onMoveTo={(parentId) => moveAlbum(currentAlbum.id, parentId)} onShare={() => setSharing(true)} onLeave={leaveAlbum} />
			<FolderGrid title="Sous-dossiers" items={childrenOf(currentAlbum.id)} canCreate={currentAlbum.role === "owner"} creating={creating} setCreating={setCreating} onCreate={createAlbum}
						countIn={countIn} subCount={(id) => childrenOf(id).length} onOpen={go} dropInto={dropInto} compact />
		</>}

		{!searching && !currentAlbum && <>
			{/* Stockage */}
			<section className="drive-rise mt-2 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
				<div className="flex items-baseline justify-between gap-3">
					<h2 className="text-base font-medium text-gray-900">Stockage</h2>
					<span className="text-sm text-gray-600"><b className="font-medium text-gray-900">{formatSize(used)}</b> sur {formatSize(quota)}</span>
				</div>
				<div className="mt-3 flex h-2 gap-0.5 overflow-hidden rounded-full bg-[#e8eaed]" role="img" aria-label={`${formatSize(used)} utilisés sur ${formatSize(quota)}`}>
					{byKind.map(([k, size]) => (
						<div key={k} className="h-full transition-[flex-grow] duration-300 ease-out" style={{ flexGrow: size, flexBasis: 0, background: KINDS[k].color }} />
					))}
					<div className="h-full" style={{ flexGrow: Math.max(0, quota - used), flexBasis: 0 }} />
				</div>
				{byKind.length > 0 && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
					{byKind.map(([k, size]) => (
						<span key={k} className="flex items-center gap-1.5 text-xs text-gray-600">
							<span className="h-2 w-2 rounded-full" style={{ background: KINDS[k].color }} />{KINDS[k].label} · {formatSize(size)}
						</span>
					))}
				</div>}
			</section>

			{empty ? (
				<section className="drive-rise mt-6 flex flex-col items-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-gray-200">
					<div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[#e8f0fe]"><Upload size={32} className="text-[#1a73e8]" /></div>
					<p className="text-lg text-gray-900">Ton Drive est vide</p>
					<p className="mt-1 max-w-xs text-sm text-gray-600">Glisse des fichiers ici ou importe-les depuis ton appareil.</p>
					<div className="mt-5">
						<Button type="blue" iconLeft="download" onClick={() => input.current.click()}>Importer des fichiers</Button>
					</div>
				</section>
			) : (
				<section className="mt-6">
					<h2 className="mb-3 text-base font-medium text-gray-900">Récents</h2>
					<div className="drive-noscrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 md:scroll-px-0 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6">
						{pending.map(u => (
							<div key={u.key} className="drive-rise w-36 shrink-0 snap-start overflow-hidden rounded-xl bg-white ring-1 ring-gray-200 md:w-auto">
								<div className="relative flex aspect-square items-center justify-center bg-[#f0f4f9]">
									<FileGlyph mime={u.mime} size={36} />
									<div className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-white">
										<div className="h-full origin-left bg-[#0b57d0] transition-transform duration-150 ease-out" style={{ transform: `scaleX(${progress / 100})` }} />
									</div>
								</div>
								<div className="px-3 py-2">
									<div className="truncate text-sm font-medium text-gray-900">{u.name}</div>
									<div className="text-xs text-gray-500">{progress < 100 ? `Importation… ${progress} %` : "Finalisation…"}</div>
								</div>
							</div>
						))}
						{files.slice(0, 6).map((f, i) => (
							<button key={f.id} type="button" onClick={() => setOpen(f)} style={{ "--i": i }} {...(f.mine ? dragFile(f) : {})}
									className={`drive-stagger drive-press w-36 shrink-0 snap-start overflow-hidden rounded-xl bg-white text-left ring-1 ring-gray-200 hover:shadow-md md:w-auto ${freshIds.includes(f.id) ? "drive-flash" : ""}`}>
								<Thumb file={f} className="aspect-square" iconSize={40} />
								<div className="px-3 py-2">
									<div className="truncate text-sm font-medium text-gray-900">{f.name}</div>
									<div className="text-xs text-gray-500">{formatDate(f.createdAt)}</div>
								</div>
							</button>
						))}
					</div>
				</section>
			)}

			<FolderGrid items={childrenOf(null).filter(owned)} creating={creating} setCreating={setCreating} onCreate={createAlbum}
						countIn={countIn} subCount={(id) => childrenOf(id).length} onOpen={go} dropInto={dropInto} fileDropLabel="Raccourci ici"
						hint="Range tes fichiers par thème : crée un dossier, puis glisse-y des fichiers." />
			<FolderGrid title="Partagés avec moi" items={albums.filter(a => a.sharedRoot)} canCreate={false}
						countIn={countIn} subCount={(id) => childrenOf(id).length} onOpen={go} dropInto={dropInto} />
		</>}

		{/* Tous les fichiers, groupés par période */}
		<section className="mt-6">
			{searching && <p className="mb-2 text-sm text-gray-600" aria-live="polite">{visible.length} résultat{visible.length > 1 ? "s" : ""}</p>}
			{searching && visible.length === 0 && <p className="drive-rise py-12 text-center text-sm text-gray-500">Aucun fichier ne correspond.</p>}
			{!searching && currentAlbum && visible.length === 0 && pending.length === 0 && <p className="drive-rise py-12 text-center text-sm text-gray-500">
				Ce dossier est vide. Importe des fichiers ici, ou déplace-les depuis leur panneau (« Dossier »).
			</p>}
			{groups.map(g => (
				<div key={g.label} className="mb-4">
					<h3 className="mb-1 px-1 text-sm font-medium text-gray-600">{g.label}</h3>
					<div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
						{g.files.map((f, i) => (
							<FileRow key={f.shortcutId ? `s${f.shortcutId}` : f.id} file={f} index={i} query={query} onOpen={() => setOpen(f)}
									 onDelete={() => remove(f)} onRemoveShortcut={() => removeShortcut(f.shortcutId)} />
						))}
					</div>
				</div>
			))}
		</section>

		{/* Bouton flottant mobile aux couleurs du Button « blue » du site ; remonte au-dessus de la snackbar */}
		<button type="button" onClick={() => input.current.click()} disabled={uploading || !canUpload}
				style={{ transform: `translateY(${snack ? -64 : 0}px)` }}
				className="fixed bottom-6 right-4 z-30 flex h-12 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-slate-50 shadow-lg ring-1 ring-inset ring-blue-600 transition-[transform,background-color] duration-200 ease-out hover:bg-blue-500 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-900 disabled:ring-gray-300 md:hidden">
			<span className="icon-download" aria-hidden="true"></span> {uploading ? "Importation…" : "Importer"}
		</button>

		<SidePanel open={sharing && currentAlbum?.role === "owner"} onClose={() => setSharing(false)} label="Partager le dossier" closeIcon={<X size={20} />}>
			{currentAlbum && <SharePanel album={currentAlbum} onSet={setMember} onRemove={removeMember} />}
		</SidePanel>
		{!isMobile && <SidePanel open={!!open && !inViewer} onClose={() => setOpen(null)} label="Aperçu du fichier" closeIcon={<X size={20} />}>{preview}</SidePanel>}
		<Lightbox open={inViewer} onClose={() => setOpen(null)} label={isImage ? "Image en grand" : "Aperçu du fichier"}
				  onPrev={viewerList[viewerIndex - 1] ? () => setOpen(viewerList[viewerIndex - 1]) : null}
				  onNext={viewerIndex >= 0 && viewerList[viewerIndex + 1] ? () => setOpen(viewerList[viewerIndex + 1]) : null}
				  counter={viewerIndex >= 0 && viewerList.length > 1 ? `${viewerIndex + 1} / ${viewerList.length}` : null}
				  icons={{ close: <X size={22} />, prev: <ChevronLeft size={24} />, next: <ChevronRight size={24} /> }}
				  summary={open && { name: open.name, meta: `${formatSize(open.size)} · ${formatDate(open.createdAt)}` }}
				  image={open && (isImage ? <FullImage key={open.id} file={open} /> : isPdf ? <PdfPage key={open.id} file={open} /> : <FilePoster key={open.id} file={open} />)}>
			{/* Sur mobile, la bande d'infos affiche déjà le nom. */}
			{open && <Preview file={open} {...actions(open)} thumb={false} dark hideTitle={isMobile} />}
		</Lightbox>

		<input ref={input} type="file" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
		<DropOverlay show={dragging} target={currentAlbum ? currentAlbum.name : "ton Drive"} />
		<Snackbar snack={snack} />
	</div>
	</TooltipProvider>
}

function KindIcon ({ kind, size }) {
	const k = KINDS[kind];
	return <k.Icon size={size} color={k.color} aria-hidden="true" />
}

function highlight (name, q) {
	if (!q) return name;
	const i = name.toLowerCase().indexOf(q.toLowerCase());
	if (i < 0) return name;
	return <>{name.slice(0, i)}<mark className="rounded-sm bg-[#c2e7ff] text-inherit">{name.slice(i, i + q.length)}</mark>{name.slice(i + q.length)}</>;
}

/** Fichier non-image dans la visionneuse : grande icône du type (le nom est dans la bande d'infos). */
function FilePoster ({ file }) {
	return <span data-viewer-item className="flex flex-col items-center gap-3">
		<Thumb file={file} className="h-40 w-40 rounded-3xl" iconSize={72} />
		<span className="text-sm text-white/60">{KINDS[kindOf(file.mime)].label}</span>
	</span>
}

/**
 * PDF dans la visionneuse : pages rendues par le serveur, navigation ‹ ›, ↑/↓ au clavier (←/→ restent pour changer
 * de fichier) et swipe horizontal au doigt ; pages voisines préchargées. « Ouvrir le PDF » donne le document complet
 * dans la visionneuse du navigateur.
 */
function PdfPage ({ file }) {
	const [pages, setPages] = useState(0);
	const [page, setPage] = useState(0);
	const [loaded, setLoaded] = useState(false);       // page courante affichée
	const [everLoaded, setEverLoaded] = useState(false); // évite le flash blanc : l'ancienne page reste visible pendant le chargement
	const [failed, setFailed] = useState(false);
	const pageRef = useRef();
	const swipe = useRef(null);
	const src = (n) => Routing.generate(URL_THUMB, { id: file.id, large: 1, ...(n ? { page: n } : {}) });

	useEffect(() => {
		axios.get(Routing.generate(URL_PDF_PAGES, { id: file.id })).then((r) => setPages(r.data.pages)).catch(() => {});
	}, [file.id]);
	useEffect(() => {
		const key = (e) => {
			if (e.target.closest?.("input, textarea, select")) return;
			if (["ArrowDown", "PageDown"].includes(e.key)) { e.preventDefault(); go(page + 1); }
			if (["ArrowUp", "PageUp"].includes(e.key)) { e.preventDefault(); go(page - 1); }
		};
		window.addEventListener("keydown", key);
		return () => window.removeEventListener("keydown", key);
	});
	const go = (n) => { if (n >= 0 && n < pages && n !== page) { setPage(n); setLoaded(false); } };
	const onLoad = () => { setLoaded(true); setEverLoaded(true); };
	// Précharge les voisines (le serveur les rend pendant la lecture) dès que la page est affichée ET le nombre de pages connu,
	// dans n'importe quel ordre d'arrivée : changer de page, au bouton comme au doigt, est alors instantané.
	useEffect(() => {
		if (!loaded) return;
		if (page + 1 < pages) new Image().src = src(page + 1);
		if (page > 0) new Image().src = src(page - 1);
	}, [loaded, pages, page]);

	// Swipe horizontal (tactile) : la page suit le doigt, freine aux extrémités ; au relâcher, un quart de largeur ou une
	// chiquenaude change de page (l'ancienne sort, la nouvelle entre par le côté opposé), sinon retour en place.
	// touch-action: pan-y laisse le défilement vertical et le zoom au navigateur.
	const onSwipeStart = (e) => {
		if (e.pointerType === "mouse" || swipe.current || pages < 2) return;
		swipe.current = { x: e.clientX, t: performance.now(), id: e.pointerId };
		pageRef.current.style.transition = "none";
		e.currentTarget.setPointerCapture(e.pointerId);
	};
	const onSwipeMove = (e) => {
		const sw = swipe.current;
		if (!sw || e.pointerId !== sw.id) return;
		let dx = e.clientX - sw.x;
		if ((dx > 0 && page === 0) || (dx < 0 && page >= pages - 1)) dx /= 3;
		pageRef.current.style.transform = `translateX(${dx}px)`;
	};
	const onSwipeEnd = (e) => {
		const sw = swipe.current;
		if (!sw || e.pointerId !== sw.id) return;
		swipe.current = null;
		const el = pageRef.current;
		const dx = e.clientX - sw.x;
		const velocity = Math.abs(dx) / Math.max(1, performance.now() - sw.t);
		const dir = dx < 0 ? 1 : -1;
		const target = page + dir;
		const commit = e.type !== "pointercancel" && target >= 0 && target < pages && (Math.abs(dx) > el.offsetWidth / 4 || (velocity > 0.11 && Math.abs(dx) > 10));
		el.style.transition = "";
		if (!commit) { el.style.transform = ""; return; }
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { el.style.transform = ""; go(target); return; }
		el.style.transform = `translateX(${-dir * 110}%)`;
		setTimeout(() => {
			el.style.transition = "none";
			el.style.transform = `translateX(${dir * 40}px)`;
			go(target);
			requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transition = ""; el.style.transform = ""; }));
		}, 180);
	};

	if (failed) return <FilePoster file={file} />;
	return <span data-viewer-item className="flex h-full w-full flex-col items-center justify-center gap-3">
		<span className="relative flex min-h-0 w-full flex-1 touch-pan-y items-center justify-center"
			  onPointerDown={onSwipeStart} onPointerMove={onSwipeMove} onPointerUp={onSwipeEnd} onPointerCancel={onSwipeEnd}>
			{/* Le premier rendu d'une page prend jusqu'à une seconde côté serveur. */}
			{!loaded && <span className="absolute z-10 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white motion-reduce:animate-none" aria-hidden="true" />}
			<img ref={pageRef} src={src(page)} alt={`Page ${page + 1} de ${file.name}`} draggable={false}
				 onLoad={onLoad} onError={() => (everLoaded ? setLoaded(true) : setFailed(true))}
				 className={`max-h-full max-w-full select-none rounded-sm bg-white object-contain shadow-2xl [transition:transform_220ms_var(--drive-ease-out),opacity_200ms_ease-out] ${everLoaded ? "" : "opacity-0"}`} />
		</span>
		<span className="flex shrink-0 items-center gap-2">
			{pages > 1 && <span className="flex items-center rounded-full bg-white/10 ring-1 ring-inset ring-white/20">
				<Hint label="Page précédente (↑)">
					<button type="button" aria-label="Page précédente" aria-disabled={page === 0} onClick={() => go(page - 1)}
							className="drive-press flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 aria-disabled:cursor-default aria-disabled:opacity-30"><ChevronLeft size={18} /></button>
				</Hint>
				<span className="min-w-[5.5rem] text-center text-sm tabular-nums text-white" aria-live="polite">Page {page + 1} / {pages}</span>
				<Hint label="Page suivante (↓)">
					<button type="button" aria-label="Page suivante" aria-disabled={page >= pages - 1} onClick={() => go(page + 1)}
							className="drive-press flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/10 aria-disabled:cursor-default aria-disabled:opacity-30"><ChevronRight size={18} /></button>
				</Hint>
			</span>}
			<a href={Routing.generate(URL_DOWNLOAD, { id: file.id, inline: 1 })} target="_blank" rel="noopener"
			   className="drive-press flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-white/20">
				<ExternalLink size={16} /> Ouvrir le PDF
			</a>
		</span>
	</span>
}

/** Aperçu : miniature réelle pour les images et les PDF (1re page), icône du type sinon. */
function Thumb ({ file, className = "", iconSize = 48, strokeWidth = 1.25 }) {
	const kind = kindOf(file.mime);
	const k = KINDS[kind];
	const [failed, setFailed] = useState(false);
	const showImg = (kind === "image" || kind === "pdf") && !failed;
	return <span className={`flex items-center justify-center overflow-hidden ${className}`} style={{ background: k.bg }}>
		{showImg
			? <img src={Routing.generate(URL_THUMB, { id: file.id })} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)}
				   className={`h-full w-full object-cover ${kind === "pdf" ? "bg-white object-top" : ""}`} />
			: <k.Icon size={iconSize} color={k.color} strokeWidth={strokeWidth} aria-hidden="true" />}
	</span>
}

/** Ligne de fichier : ouvrir l'aperçu, ou actions rapides télécharger / supprimer. */
function FileRow ({ file, index, query, onOpen, onDelete, onRemoveShortcut }) {
	const [armed, setArmed] = useConfirmTap(file.id);

	// Un raccourci ne se glisse pas : on déplacerait le fichier d'origine, ce qui surprendrait.
	return <div style={{ "--i": index }} {...(file.shortcutId || !file.mine ? {} : dragFile(file))} className="drive-stagger group flex items-center border-b border-gray-100 transition-colors duration-150 last:border-0 hover:bg-gray-50">
		<button type="button" onClick={onOpen}
				className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2 text-left focus-visible:bg-gray-100 focus-visible:outline-none active:bg-gray-100">
			<span className="relative shrink-0">
				<Thumb file={file} className="h-10 w-10 rounded-lg" iconSize={20} strokeWidth={2} />
				{file.shortcutId && <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow ring-1 ring-gray-200" aria-label="Raccourci">
					<CornerUpRight size={11} className="text-gray-700" />
				</span>}
			</span>
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[15px] text-gray-900 md:text-sm">{highlight(file.name, query)}</span>
				<span className="flex items-center gap-1 text-xs text-gray-500">
					{file.shareActive && <Link2 size={12} className="text-blue-600" aria-label="Partagé" />}{file.shortcutId && "Raccourci · "}{formatSize(file.size)} · {formatDate(file.createdAt)}{!file.mine && ` · par ${file.ownerName}`}
				</span>
			</span>
		</button>
		<div className="drive-row-actions flex shrink-0 items-center gap-1 pr-2" data-armed={armed ? "" : undefined}>
			<Hint label="Télécharger">
				<a href={Routing.generate(URL_DOWNLOAD, { id: file.id })} aria-label={`Télécharger ${file.name}`}
				   className="drive-press flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-black/5">
					<Download size={18} />
				</a>
			</Hint>
			{file.shortcutId ? <Hint label="Retirer le raccourci (le fichier est conservé)">
				<button type="button" onClick={onRemoveShortcut} aria-label={`Retirer le raccourci vers ${file.name}`}
						className="drive-press flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-black/5"><X size={18} /></button>
			</Hint> : file.canDelete && <Hint label={armed ? "Clique à nouveau pour supprimer définitivement" : "Supprimer"}>
				<button type="button" onClick={() => armed ? onDelete() : setArmed(true)}
						aria-label={armed ? `Confirmer la suppression de ${file.name}` : `Supprimer ${file.name}`}
						className={`drive-press flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium ${armed ? "bg-[#b3261e] px-3 text-white" : "w-10 text-[#b3261e] hover:bg-[#fce8e6]"}`}>
					<Trash2 size={18} />{armed && <span className="drive-check">Confirmer</span>}
				</button>
			</Hint>}
		</div>
	</div>
}

/** Original en grand ; la miniature (déjà en cache) s'affiche floutée le temps du chargement, et reste
 *  affichée nette si le navigateur ne sait pas lire l'original (HEIC…). */
function FullImage ({ file }) {
	const [loaded, setLoaded] = useState(false);
	const [failed, setFailed] = useState(false);
	return <div className="relative flex h-full w-full items-center justify-center">
		{!loaded && <img src={Routing.generate(URL_THUMB, { id: file.id })} alt={failed ? file.name : ""} draggable={false}
						 className={`max-h-full max-w-full object-contain ${failed ? "" : "blur-sm"}`} />}
		{!failed && <img src={Routing.generate(URL_DOWNLOAD, { id: file.id })} alt={file.name} draggable={false}
						 onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
						 className={`max-h-full max-w-full object-contain transition-opacity duration-200 ease-out ${loaded ? "opacity-100" : "absolute opacity-0"}`} />}
	</div>
}

function Preview ({ file, albums, shortcuts, albumName, onDelete, onRename, onMove, onAddShortcut, onRemoveShortcut, onShare, onUnshare, notify, thumb = true, dark = false, hideTitle = false }) {
	const [armed, setArmed] = useConfirmTap(file.id);
	const [editing, setEditing] = useState(false);
	useEffect(() => { setEditing(false); }, [file.id]);
	const t = dark
		? { title: "text-white", label: "text-white/50", value: "text-white/85", muted: "text-white/60", border: "border-white/10", icon: "text-white/60 hover:bg-white/10",
			input: "bg-white/10 text-white ring-white/20 focus:ring-blue-400", link: "text-blue-300 hover:bg-white/10", danger: "text-red-300 hover:bg-white/10",
			chip: "text-white/85 ring-white/20 hover:bg-white/10", expired: "text-red-300" }
		: { title: "text-gray-900", label: "text-gray-500", value: "text-gray-800", muted: "text-gray-500", border: "border-gray-200", icon: "text-gray-500 hover:bg-gray-100",
			input: "bg-white text-gray-900 ring-gray-300 focus:ring-blue-600", link: "text-blue-600 hover:bg-blue-50", danger: "text-red-600 hover:bg-red-50",
			chip: "text-gray-700 ring-gray-300 hover:bg-gray-50", expired: "text-red-600" };

	const copy = () => {
		if (!navigator.clipboard) return notify("Copie impossible : sélectionne le lien et copie-le");
		navigator.clipboard.writeText(file.shareUrl).then(() => notify("Lien copié"), () => notify("Copie impossible : sélectionne le lien et copie-le"));
	};
	const onDeleteClick = () => armed ? onDelete() : setArmed(true);

	return <div className="px-5 pb-2">
		{thumb && <Thumb file={file} className="aspect-video rounded-2xl md:aspect-[4/3]" iconSize={72} />}
		<div className={`${hideTitle ? "" : "mt-4"} flex items-start gap-1`}>
			{editing
				? <InlineName initial={file.name} selectBase label="Nouveau nom du fichier" onSubmit={onRename} onDone={() => setEditing(false)}
							  className={`min-w-0 flex-1 rounded-md border-0 px-2 py-1 text-lg font-medium ring-1 ring-inset focus:ring-2 ${t.input}`} />
				: hideTitle
					? file.mine && <button type="button" onClick={() => setEditing(true)} className={`drive-press -ml-3 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold ${t.link}`}><Pencil size={16} /> Renommer</button>
					: <h3 className={`min-w-0 flex-1 break-words text-lg font-medium ${t.title}`}>{file.name}</h3>}
			{!editing && !hideTitle && file.mine && <Hint label="Renommer">
				<button type="button" aria-label="Renommer" onClick={() => setEditing(true)} className={`drive-press -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.icon}`}><Pencil size={16} /></button>
			</Hint>}
		</div>
		<dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
			<dt className={t.label}>Type</dt><dd className={t.value}>{KINDS[kindOf(file.mime)].label}</dd>
			<dt className={t.label}>Taille</dt><dd className={t.value}>{formatSize(file.size)}</dd>
			<dt className={t.label}>Ajouté</dt><dd className={t.value}>{formatDateTime(file.createdAt)}</dd>
			{!file.mine && <><dt className={t.label}>Déposé par</dt><dd className={t.value}>{file.ownerName}</dd></>}
			{/* Ranger, raccourcis et lien public : réservés à qui a déposé le fichier. */}
			{file.mine && <><dt className={`${t.label} self-center`}><label htmlFor={`drive-move-${file.id}`}>Dossier</label></dt>
			<dd>
				<select id={`drive-move-${file.id}`} value={file.albumId ?? ""} onChange={(e) => onMove(e.target.value ? Number(e.target.value) : null)}
						className={`w-full max-w-[16rem] rounded-md border-0 py-1 pl-2 pr-8 text-sm ring-1 ring-inset [&>option]:text-gray-900 ${t.input}`}>
					<option value="">Mon Drive</option>
					{albums.map(a => <option key={a.id} value={a.id}>{"\u00A0\u00A0\u00A0".repeat(a.depth) + a.name + (a.role === "owner" ? "" : " · partagé")}</option>)}
				</select>
			</dd>
			<dt className={`${t.label} pt-1`}>Raccourcis</dt>
			<dd className="flex flex-wrap items-center gap-1.5">
				{shortcuts.map(sc => (
					<span key={sc.id} className={`flex items-center gap-1 rounded-md py-0.5 pl-2 pr-0.5 text-xs ring-1 ring-inset ${t.chip}`}>
						<CornerUpRight size={12} />{albumName(sc.albumId)}
						<Hint label="Retirer le raccourci">
							<button type="button" aria-label={`Retirer le raccourci dans ${albumName(sc.albumId)}`} onClick={() => onRemoveShortcut(sc.id)} className="rounded p-0.5 hover:bg-black/10"><X size={12} /></button>
						</Hint>
					</span>
				))}
				{/* Ni le dossier du fichier, ni un dossier qui a déjà son raccourci. */}
				<select value="" aria-label="Ajouter un raccourci dans un dossier"
						onChange={(e) => e.target.value && onAddShortcut(e.target.value === "root" ? null : Number(e.target.value))}
						className={`rounded-md border-0 py-0.5 pl-2 pr-7 text-xs ring-1 ring-inset [&>option]:text-gray-900 ${t.input}`}>
					<option value="">+ Ajouter dans…</option>
					{file.albumId && !shortcuts.some(sc => !sc.albumId) && <option value="root">Mon Drive</option>}
					{albums.filter(a => a.role === "owner" && a.id !== file.albumId && !shortcuts.some(sc => sc.albumId === a.id))
						.map(a => <option key={a.id} value={a.id}>{"\u00A0\u00A0\u00A0".repeat(a.depth) + a.name}</option>)}
				</select>
			</dd></>}
		</dl>
		<div className="mt-5 flex gap-2">
			{/* Boutons standards du site ; les <span> portent les infobulles (pas de ref sur ces composants). */}
			<Hint label="Télécharger le fichier d'origine">
				<span className="flex flex-1"><ButtonA type="blue" width="w-full" iconLeft="upload" onClick={Routing.generate(URL_DOWNLOAD, { id: file.id })}>Télécharger</ButtonA></span>
			</Hint>
			{file.canDelete && <Hint label={armed ? "Clique à nouveau pour supprimer définitivement" : shortcuts.length ? `Supprimer définitivement (et ses ${shortcuts.length} raccourci${shortcuts.length > 1 ? "s" : ""})` : "Supprimer définitivement"}>
				{dark && !armed
					// Sur fond sombre, le Button « default » serait un bloc blanc : même forme et typo, fond translucide.
					? <button type="button" onClick={onDeleteClick} className="flex items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15">
						<span className="icon-trash" aria-hidden="true"></span><span>Supprimer</span>
					</button>
					: <span className="flex">
						<Button type={armed ? "red" : "default"} iconLeft="trash" onClick={onDeleteClick}>{armed ? "Confirmer" : "Supprimer"}</Button>
					</span>}
			</Hint>}
		</div>

		{file.mine && <div className={`mt-5 border-t pt-4 ${t.border}`}>
			<h4 className={`text-sm font-medium ${t.title}`}>Partage</h4>
			{file.shareUrl ? <>
				<p className={`mt-1 text-xs ${file.shareActive ? t.muted : t.expired}`}>
					{!file.shareExpiresAt ? "Lien sans date d'expiration." : `${file.shareActive ? "Expire" : "Expiré"} le ${formatDateTime(file.shareExpiresAt)}.`}
					{file.shareActive && " Toute personne ayant ce lien peut voir et télécharger le fichier."}
				</p>
				<div className="mt-2 flex gap-2">
					<input readOnly value={file.shareUrl} onFocus={(e) => e.target.select()} aria-label="Lien de partage"
						   className={`min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm ring-1 ring-inset ${t.input}`} />
					<Hint label="Copier le lien">
						<button type="button" onClick={copy} className={`drive-press flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold ${t.link}`}><Copy size={16} /> Copier</button>
					</Hint>
				</div>
				<DurationPicker label={file.shareActive ? "Changer la durée (à partir d'aujourd'hui) :" : "Réactiver le même lien pour :"} t={t} onPick={onShare} />
				<Hint label="Le lien actuel cessera de fonctionner">
					<button type="button" onClick={onUnshare} className={`drive-press -ml-3 mt-1 rounded-md px-3 py-2 text-sm font-semibold ${t.danger}`}>Arrêter le partage</button>
				</Hint>
			</> : <>
				<p className={`mt-1 text-xs ${t.muted}`}>Crée un lien pour envoyer ce fichier à quelqu'un, même sans compte.</p>
				<DurationPicker label="Partager pendant :" t={t} onPick={onShare} />
			</>}
		</div>}
	</div>
}

const formatDateTime = (iso) => new Date(iso).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" });

/** Un appui = partager (ou redémarrer la durée) pour ce nombre de jours. */
function DurationPicker ({ label, t, onPick }) {
	return <div className="mt-2">
		<div className={`text-xs ${t.muted}`}>{label}</div>
		<div className="mt-1.5 flex flex-wrap gap-2">
			{SHARE_DURATIONS.map(d => (
				<button key={d.value} type="button" onClick={() => onPick(d.value)}
						className={`drive-press flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ring-1 ring-inset ${t.chip}`}>
					<Link2 size={14} /> {d.label}
				</button>
			))}
		</div>
	</div>
}

/** Saisie d'un nom : Entrée ou clic ailleurs valide (via blur), Échap annule. onSubmit renvoie une promesse de succès. */
function InlineName ({ initial = "", label, selectBase = false, onSubmit, onDone, className }) {
	const cancelled = useRef(false);
	const end = (value) => {
		const name = value.trim();
		if (cancelled.current || !name || name === initial) { cancelled.current = false; onDone(); return; }
		onSubmit(name).then((ok) => ok && onDone());
	};
	return <input autoFocus defaultValue={initial} maxLength={255} aria-label={label} placeholder={label}
				  onFocus={(e) => { const dot = selectBase ? initial.lastIndexOf(".") : -1; e.target.setSelectionRange(0, dot > 0 ? dot : initial.length); }}
				  onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { cancelled.current = true; e.currentTarget.blur(); } }}
				  onBlur={(e) => end(e.target.value)} className={className} />
}

/**
 * Barre du dossier ouvert : fil d'Ariane (chaque niveau accepte un dépôt). Propriétaire : renommer, partager, déplacer,
 * supprimer (deux appuis, contenu conservé). Membre : propriétaire et rôle, et « Quitter » en haut du partage.
 */
function AlbumBar ({ album, ancestors, count, onNavigate, onRename, onDelete, dropInto, moveTargets, onMoveTo, onShare, onLeave }) {
	const isOwner = album.role === "owner";
	const [editing, setEditing] = useState(false);
	const [armed, setArmed] = useConfirmTap(album.id);
	const parent = ancestors[ancestors.length - 1] ?? null;
	const [over, dropProps] = useDriveDrop(dropInto(parent ? parent.id : null));
	const parentName = parent ? parent.name : "Mon Drive";
	const icon = "drive-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100";
	return <div className="drive-rise mt-2 flex items-center gap-1 rounded-2xl bg-white p-2 pr-3 shadow-sm ring-1 ring-gray-200">
		<span {...dropProps} className={`shrink-0 rounded-full transition-colors duration-150 ${over ? "bg-blue-50 ring-2 ring-blue-600" : ""}`}>
			<Hint label={over ? `Déposer dans « ${parentName} »` : `Retour à « ${parentName} »`}>
				<button type="button" aria-label={`Retour à ${parentName}`} onClick={() => onNavigate(parent ? parent.id : null)}
						className="drive-press flex h-10 w-10 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"><ChevronLeft size={20} /></button>
			</Hint>
		</span>
		<nav aria-label="Fil d'Ariane" className="hidden min-w-0 shrink items-center gap-1 sm:flex">
			{[{ id: null, name: "Mon Drive" }, ...ancestors].map(a => <React.Fragment key={a.id ?? "root"}>
				<Crumb label={a.name} onClick={() => onNavigate(a.id)} onDrop={dropInto(a.id)} />
				<ChevronRight size={14} className="shrink-0 text-gray-400" />
			</React.Fragment>)}
		</nav>
		{isOwner && album.members.length ? <Users size={18} className="ml-1 shrink-0 text-blue-600" aria-label="Dossier partagé" /> : <Folder size={18} className="ml-1 shrink-0 text-gray-500" />}
		{editing
			? <InlineName initial={album.name} label="Nom du dossier" onSubmit={onRename} onDone={() => setEditing(false)}
						  className="min-w-0 flex-1 rounded-md border-0 px-2 py-1 font-medium text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600" />
			: <h2 className="min-w-0 flex-1 truncate px-1 font-medium text-gray-900">
				{album.name} <span className="font-normal text-gray-500">· {count} fichier{count > 1 ? "s" : ""}{!isOwner && ` · par ${album.ownerName} (${ROLE_LABELS[album.role]})`}</span>
			</h2>}
		{isOwner ? <>
			{!editing && <Hint label="Renommer le dossier">
				<button type="button" aria-label="Renommer le dossier" onClick={() => setEditing(true)} className={icon}><Pencil size={16} /></button>
			</Hint>}
			<Hint label={album.members.length ? `Partagé avec ${album.members.length} personne${album.members.length > 1 ? "s" : ""}` : "Partager le dossier"}>
				<button type="button" aria-label="Partager le dossier" onClick={onShare} className={icon}><Users size={16} /></button>
			</Hint>
			{/* Déplacer sans souris (mobile) : un <select> natif invisible posé sur l'icône. */}
			{moveTargets.length > 0 && <Hint label="Déplacer le dossier">
				<span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100">
					<FolderInput size={16} />
					<select value="" aria-label="Déplacer le dossier vers" onChange={(e) => e.target.value !== "" && onMoveTo(e.target.value === "root" ? null : Number(e.target.value))}
							className="absolute inset-0 cursor-pointer opacity-0">
						<option value="">Déplacer vers…</option>
						{moveTargets.map(a => <option key={a.id ?? "root"} value={a.id ?? "root"}>{"   ".repeat(a.depth) + a.name}</option>)}
					</select>
				</span>
			</Hint>}
			<Hint label={armed ? `Clique à nouveau : son contenu ira dans « ${parentName} »` : "Supprimer le dossier (son contenu est conservé)"}>
				<button type="button" onClick={() => armed ? onDelete() : setArmed(true)} aria-label={armed ? "Confirmer la suppression du dossier" : "Supprimer le dossier"}
						className={`drive-press flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium ${armed ? "bg-[#b3261e] px-3 text-white" : "w-9 text-[#b3261e] hover:bg-[#fce8e6]"}`}>
					<Trash2 size={16} />{armed && <span className="drive-check">Confirmer</span>}
				</button>
			</Hint>
		</> : album.sharedRoot && <Hint label={armed ? "Clique à nouveau : tu n'y auras plus accès (tes fichiers restent à toi)" : "Quitter le dossier partagé"}>
			<button type="button" onClick={() => armed ? onLeave() : setArmed(true)} aria-label={armed ? "Confirmer : quitter le dossier" : "Quitter le dossier partagé"}
					className={`drive-press flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium ${armed ? "bg-[#b3261e] px-3 text-white" : "w-9 text-gray-500 hover:bg-gray-100"}`}>
				<LogOut size={16} />{armed && <span className="drive-check">Quitter</span>}
			</button>
		</Hint>}
	</div>
}

/** Panneau « Partager » (propriétaire) : inviter un compte du site comme Lecteur ou Éditeur, changer un rôle, retirer l'accès. */
function SharePanel ({ album, onSet, onRemove }) {
	const [q, setQ] = useState("");
	const [role, setRole] = useState("viewer");
	const [results, setResults] = useState(null); // null = pas encore cherché
	useEffect(() => {
		const term = q.trim();
		if (term.length < 2) { setResults(null); return; }
		const t = setTimeout(() => axios.get(Routing.generate(URL_USERS, { q: term })).then((r) => setResults(r.data.users)).catch(() => setResults([])), 250);
		return () => clearTimeout(t);
	}, [q]);
	const memberIds = album.members.map(m => m.userId);
	const field = "rounded-md border-0 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600";

	return <div className="px-5 pb-4">
		<h3 className="text-lg font-medium text-gray-900">Partager « {album.name} »</h3>
		<p className="mt-1 text-sm text-gray-500">Les membres accèdent à ce dossier et à ses sous-dossiers.</p>
		<div className="mt-4 flex gap-2">
			<input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un utilisateur" aria-label="Rechercher un utilisateur à inviter"
				   className={`min-w-0 flex-1 px-3 py-2 ${field}`} />
			<select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Rôle de la personne invitée" className={`py-2 pl-2 pr-8 ${field}`}>
				<option value="viewer">Lecteur</option><option value="editor">Éditeur</option>
			</select>
		</div>
		{results && (results.length === 0
			? <p className="mt-2 text-sm text-gray-500">Aucun utilisateur trouvé.</p>
			: <ul className="mt-2 ml-0 list-none divide-y divide-gray-100 overflow-hidden rounded-md pl-0 ring-1 ring-gray-200">
				{results.map(u => {
					const already = memberIds.includes(u.id);
					return <li key={u.id}>
						<button type="button" disabled={already} onClick={() => onSet(u.id, role).then((ok) => ok && setQ(""))}
								className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 disabled:cursor-default disabled:opacity-50">
							<span className="min-w-0 truncate"><span className="font-medium text-gray-900">{u.name}</span> <span className="text-gray-500">@{u.username}</span></span>
							<span className="shrink-0 font-semibold text-blue-600">{already ? "Déjà membre" : `Inviter (${ROLE_LABELS[role]})`}</span>
						</button>
					</li>
				})}
			</ul>)}

		<h4 className="mt-6 text-sm font-medium text-gray-900">Membres</h4>
		{album.members.length === 0
			? <p className="mt-1 text-sm text-gray-500">Personne pour l'instant.</p>
			: <ul className="mt-1 ml-0 list-none divide-y divide-gray-100 pl-0">
				{album.members.map(m => <li key={m.userId} className="flex items-center gap-2 py-2">
					<span className="min-w-0 flex-1 truncate text-sm text-gray-900">{m.name}</span>
					<select value={m.role} onChange={(e) => onSet(m.userId, e.target.value)} aria-label={`Rôle de ${m.name}`} className={`py-1 pl-2 pr-8 ${field}`}>
						<option value="viewer">Lecteur</option><option value="editor">Éditeur</option>
					</select>
					<Hint label="Retirer l'accès">
						<button type="button" aria-label={`Retirer l'accès de ${m.name}`} onClick={() => onRemove(m.userId)}
								className="drive-press flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"><X size={16} /></button>
					</Hint>
				</li>)}
			</ul>}
		<p className="mt-4 text-xs text-gray-500">Lecteur : voir et télécharger. Éditeur : en plus, ajouter des fichiers et gérer les siens. Chaque fichier compte dans le quota de celui qui l'a déposé.</p>
	</div>
}

function Crumb ({ label, onClick, onDrop }) {
	const [over, dropProps] = useDriveDrop(onDrop);
	return <button type="button" onClick={onClick} {...dropProps}
				   className={`max-w-[10rem] truncate rounded-md px-1.5 py-1 text-sm transition-colors duration-150 ${over ? "bg-blue-50 text-blue-700 ring-2 ring-blue-600" : "text-gray-500 hover:underline"}`}>
		{label}
	</button>
}

/** Grille des dossiers d'un niveau, avec création en ligne (si canCreate). */
function FolderGrid ({ title = "Dossiers", items, canCreate = true, creating, setCreating, onCreate, countIn, subCount, onOpen, dropInto, hint, fileDropLabel = "Déposer ici", compact = false }) {
	if (!canCreate && items.length === 0) return null;
	return <section className={compact ? "mt-4" : "mt-6"}>
		<div className="mb-3 flex items-center justify-between gap-3">
			<h2 className={compact ? "text-sm font-medium text-gray-600" : "text-base font-medium text-gray-900"}>{title}</h2>
			{canCreate && <button type="button" onClick={() => setCreating(true)} className="drive-press -mr-3 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50">
				<FolderPlus size={16} /> Nouveau dossier
			</button>}
		</div>
		{hint && items.length === 0 && !creating && <p className="text-sm text-gray-500">{hint}</p>}
		{(items.length > 0 || (canCreate && creating)) && <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
			{canCreate && creating && <div className="drive-rise flex items-center gap-3 rounded-xl bg-white px-4 py-3 ring-2 ring-blue-600">
				<Folder size={22} className="shrink-0 text-gray-500" />
				<InlineName label="Nom du dossier" onSubmit={onCreate} onDone={() => setCreating(false)}
							className="min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium text-gray-900 focus:outline-none focus:ring-0" />
			</div>}
			{items.map((a, i) => (
				<AlbumCard key={a.id} album={a} index={i} count={countIn(a.id)} subCount={subCount(a.id)} onOpen={() => onOpen(a.id)}
						   onDrop={dropInto(a.id)} fileDropLabel={fileDropLabel} />
			))}
		</div>}
	</section>
}

// Glisser-déposer interne (fichier ou dossier → dossier) : types dédiés, ignorés par l'import depuis l'ordinateur.
const DRAG_TYPES = { file: "application/x-nompaw-drive-file", folder: "application/x-nompaw-drive-folder" };
const dragItem = (kind, id) => ({
	draggable: true,
	onDragStart: (e) => { e.stopPropagation(); e.dataTransfer.setData(DRAG_TYPES[kind], String(id)); e.dataTransfer.effectAllowed = "move"; },
});
const dragFile = (file) => dragItem("file", file.id);

/** Cible de dépôt. Renvoie [type survolé ("file" | "folder" | null), props à poser sur la cible] ; onDrop(type, id). */
function useDriveDrop (onDrop) {
	const [over, setOver] = useState(null);
	const draggedKind = (e) => Object.keys(DRAG_TYPES).find(k => e.dataTransfer.types.includes(DRAG_TYPES[k])) ?? null;
	return [over, {
		onDragOver: (e) => { const k = draggedKind(e); if (!k) return; e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(k); },
		onDragLeave: (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOver(null); },
		onDrop: (e) => { const k = draggedKind(e); if (!k) return; e.preventDefault(); setOver(null); onDrop(k, Number(e.dataTransfer.getData(DRAG_TYPES[k]))); },
	}];
}

function AlbumCard ({ album, index, count, subCount, onOpen, onDrop, fileDropLabel }) {
	const [over, dropProps] = useDriveDrop(onDrop);
	const shared = album.role !== "owner" || album.members.length > 0;
	const FolderIcon = shared ? Users : Folder;
	return <button type="button" onClick={onOpen} style={{ "--i": index }} {...(album.role === "owner" ? dragItem("folder", album.id) : {})} {...dropProps}
				   className={`drive-stagger drive-press flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors duration-150 hover:shadow-md ${over ? "bg-blue-50 ring-2 ring-blue-600" : "bg-white ring-1 ring-gray-200"}`}>
		<FolderIcon size={22} className={`shrink-0 ${over || shared ? "text-blue-600" : "text-gray-500"}`} aria-label={shared ? "Dossier partagé" : undefined} />
		<span className="min-w-0">
			<span className="block truncate text-sm font-medium text-gray-900">{album.name}</span>
			<span className="block text-xs text-gray-500">
				{over === "folder" ? "Déplacer ici" : over ? fileDropLabel
					: album.role !== "owner" && album.sharedRoot ? `par ${album.ownerName} · ${ROLE_LABELS[album.role]}`
					: `${count} fichier${count > 1 ? "s" : ""}${subCount ? ` · ${subCount} dossier${subCount > 1 ? "s" : ""}` : ""}`}
			</span>
		</span>
	</button>
}
