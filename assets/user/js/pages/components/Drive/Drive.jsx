import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Check, ChevronLeft, ChevronRight, Copy, Download, Link2, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import { Button, ButtonA } from "@tailwindComponents/Elements/Button";
import { TooltipProvider } from "@shadcnComponents/ui/tooltip";
import {
	BottomSheet, DropOverlay, FILTERS, FileGlyph, Hint, KINDS, Lightbox, SidePanel, Snackbar,
	formatDate, formatSize, kindOf, period, useConfirmTap, useMediaQuery, useSnackbar, useWindowDrop,
} from "./DriveUi";
import "./drive.css";

const URL_LIST = "intern_api_drive_list";
const URL_UPLOAD = "intern_api_drive_upload";
const URL_DOWNLOAD = "intern_api_drive_download";
const URL_THUMB = "intern_api_drive_thumb";
const URL_DELETE = "intern_api_drive_delete";
const URL_RENAME = "intern_api_drive_rename";
const URL_SHARE = "intern_api_drive_share";
const URL_UNSHARE = "intern_api_drive_unshare";

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

	const applyState = (data) => {
		setFiles(data.files);
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

		const total = list.reduce((s, f) => s + f.size, 0);
		if (used + total > quota) {
			show("Espace insuffisant : il te reste " + formatSize(Math.max(0, quota - used)) + ".");
			return;
		}

		const formData = new FormData();
		list.forEach(f => formData.append("files[]", f));
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
	}, [pending.length, used, quota, files, show]);

	const dragging = useWindowDrop(onFiles);

	const remove = (file) => {
		setOpen(null);
		axios.delete(Routing.generate(URL_DELETE, { id: file.id }))
			.then((response) => { applyState(response.data); show(`« ${file.name} » supprimé`); })
			.catch((error) => show(errorMessage(error)));
	};

	// Les actions du panneau renvoient la liste à jour : on y relit le fichier ouvert pour garder l'aperçu synchronisé.
	const update = (request, id, message) => request
		.then((response) => { applyState(response.data); setOpen(response.data.files.find(f => f.id === id) || null); show(message); return true; })
		.catch((error) => { show(errorMessage(error)); return false; });
	const actions = (file) => ({
		onDelete: () => remove(file),
		onRename: (name) => update(axios.put(Routing.generate(URL_RENAME, { id: file.id }), { name }), file.id, "Fichier renommé"),
		onShare: () => update(axios.post(Routing.generate(URL_SHARE, { id: file.id })), file.id, "Lien de partage créé"),
		onUnshare: () => update(axios.delete(Routing.generate(URL_UNSHARE, { id: file.id })), file.id, "Partage arrêté : l'ancien lien ne fonctionne plus"),
		notify: show,
	});

	const visible = useMemo(() => files.filter(f =>
		(!filter || kindOf(f.mime) === filter) && (!query || f.name.toLowerCase().includes(query.toLowerCase()))
	), [files, filter, query]);

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
		files.forEach(f => { const k = kindOf(f.mime); m[k] = (m[k] || 0) + f.size; });
		return Object.entries(m).sort((a, b) => b[1] - a[1]);
	}, [files]);

	if (loading) {
		return <div className="mx-auto flex max-w-5xl flex-col gap-4" aria-busy="true">
			<div className="h-12 animate-pulse rounded-full bg-gray-200" />
			<div className="h-28 animate-pulse rounded-2xl bg-gray-200" />
			<div className="h-48 animate-pulse rounded-2xl bg-gray-200" />
		</div>
	}

	const searching = query || filter;
	const empty = files.length === 0 && pending.length === 0;
	const preview = open && <Preview file={open} {...actions(open)} />;
	const uploading = pending.length > 0;
	const isImage = !!open && kindOf(open.mime) === "image";
	// Navigation dans l'ordre de la liste affichée (recherche et filtres compris).
	const images = visible.filter(f => kindOf(f.mime) === "image");
	const imgIndex = isImage ? images.findIndex(f => f.id === open.id) : -1;
	const importHint = uploading ? "Importation en cours…" : `Ou glisse tes fichiers dans la page · ${formatSize(Math.max(0, quota - used))} disponibles`;

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
						<Button type={uploading ? "disabled" : "blue"} iconLeft="download" onClick={() => input.current.click()}>Importer</Button>
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

		{!searching && <>
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
							<button key={f.id} type="button" onClick={() => setOpen(f)} style={{ "--i": i }}
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
		</>}

		{/* Tous les fichiers, groupés par période */}
		<section className="mt-6">
			{searching && <p className="mb-2 text-sm text-gray-600" aria-live="polite">{visible.length} résultat{visible.length > 1 ? "s" : ""}</p>}
			{searching && visible.length === 0 && <p className="drive-rise py-12 text-center text-sm text-gray-500">Aucun fichier ne correspond.</p>}
			{groups.map(g => (
				<div key={g.label} className="mb-4">
					<h3 className="mb-1 px-1 text-sm font-medium text-gray-600">{g.label}</h3>
					<div className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200">
						{g.files.map((f, i) => (
							<FileRow key={f.id} file={f} index={i} query={query} onOpen={() => setOpen(f)} onDelete={() => remove(f)} />
						))}
					</div>
				</div>
			))}
		</section>

		{/* Bouton flottant mobile aux couleurs du Button « blue » du site ; remonte au-dessus de la snackbar */}
		<button type="button" onClick={() => input.current.click()} disabled={uploading}
				style={{ transform: `translateY(${snack ? -64 : 0}px)` }}
				className="fixed bottom-6 right-4 z-30 flex h-12 items-center gap-2 rounded-md bg-blue-600 px-5 text-sm font-semibold text-slate-50 shadow-lg ring-1 ring-inset ring-blue-600 transition-[transform,background-color] duration-200 ease-out hover:bg-blue-500 active:scale-[0.97] disabled:bg-gray-200 disabled:text-gray-900 disabled:ring-gray-300 md:hidden">
			<span className="icon-download" aria-hidden="true"></span> {uploading ? "Importation…" : "Importer"}
		</button>

		{isMobile
			? <BottomSheet open={!!open && !isImage} onClose={() => setOpen(null)} label="Aperçu du fichier">{preview}</BottomSheet>
			: <SidePanel open={!!open && !isImage} onClose={() => setOpen(null)} label="Aperçu du fichier" closeIcon={<X size={20} />}>{preview}</SidePanel>}
		<Lightbox open={isImage} onClose={() => setOpen(null)}
				  onPrev={images[imgIndex - 1] ? () => setOpen(images[imgIndex - 1]) : null}
				  onNext={imgIndex >= 0 && images[imgIndex + 1] ? () => setOpen(images[imgIndex + 1]) : null}
				  counter={imgIndex >= 0 && images.length > 1 ? `${imgIndex + 1} / ${images.length}` : null}
				  icons={{ close: <X size={22} />, prev: <ChevronLeft size={24} />, next: <ChevronRight size={24} /> }}
				  image={open && <FullImage key={open.id} file={open} />}>
			{open && <Preview file={open} {...actions(open)} thumb={false} dark />}
		</Lightbox>

		<input ref={input} type="file" multiple className="hidden" onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
		<DropOverlay show={dragging} />
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

/** Aperçu : vraie miniature pour les images, icône du type sinon. */
function Thumb ({ file, className = "", iconSize = 48, strokeWidth = 1.25 }) {
	const kind = kindOf(file.mime);
	const k = KINDS[kind];
	const [failed, setFailed] = useState(false);
	const showImg = kind === "image" && !failed;
	return <span className={`flex items-center justify-center overflow-hidden ${className}`} style={{ background: k.bg }}>
		{showImg
			? <img src={Routing.generate(URL_THUMB, { id: file.id })} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)} className="h-full w-full object-cover" />
			: <k.Icon size={iconSize} color={k.color} strokeWidth={strokeWidth} aria-hidden="true" />}
	</span>
}

/** Ligne de fichier : ouvrir l'aperçu, ou actions rapides télécharger / supprimer. */
function FileRow ({ file, index, query, onOpen, onDelete }) {
	const [armed, setArmed] = useConfirmTap(file.id);

	return <div style={{ "--i": index }} className="drive-stagger group flex items-center border-b border-gray-100 transition-colors duration-150 last:border-0 hover:bg-gray-50">
		<button type="button" onClick={onOpen}
				className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2 text-left focus-visible:bg-gray-100 focus-visible:outline-none active:bg-gray-100">
			<Thumb file={file} className="h-10 w-10 shrink-0 rounded-lg" iconSize={20} strokeWidth={2} />
			<span className="min-w-0 flex-1">
				<span className="block truncate text-[15px] text-gray-900 md:text-sm">{highlight(file.name, query)}</span>
				<span className="flex items-center gap-1 text-xs text-gray-500">
					{file.shareUrl && <Link2 size={12} className="text-blue-600" aria-label="Partagé" />}{formatSize(file.size)} · {formatDate(file.createdAt)}
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
			<Hint label={armed ? "Clique à nouveau pour supprimer définitivement" : "Supprimer"}>
				<button type="button" onClick={() => armed ? onDelete() : setArmed(true)}
						aria-label={armed ? `Confirmer la suppression de ${file.name}` : `Supprimer ${file.name}`}
						className={`drive-press flex h-10 items-center justify-center gap-1.5 rounded-full text-sm font-medium ${armed ? "bg-[#b3261e] px-3 text-white" : "w-10 text-[#b3261e] hover:bg-[#fce8e6]"}`}>
					<Trash2 size={18} />{armed && <span className="drive-check">Confirmer</span>}
				</button>
			</Hint>
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

function Preview ({ file, onDelete, onRename, onShare, onUnshare, notify, thumb = true, dark = false }) {
	const [armed, setArmed] = useConfirmTap(file.id);
	const [editing, setEditing] = useState(false);
	const cancelled = useRef(false);
	useEffect(() => { setEditing(false); }, [file.id]);
	const t = dark
		? { title: "text-white", label: "text-white/50", value: "text-white/85", muted: "text-white/60", border: "border-white/10", icon: "text-white/60 hover:bg-white/10",
			input: "bg-white/10 text-white ring-white/20 focus:ring-blue-400", link: "text-blue-300 hover:bg-white/10", danger: "text-red-300 hover:bg-white/10" }
		: { title: "text-gray-900", label: "text-gray-500", value: "text-gray-800", muted: "text-gray-500", border: "border-gray-200", icon: "text-gray-500 hover:bg-gray-100",
			input: "bg-white text-gray-900 ring-gray-300 focus:ring-blue-600", link: "text-blue-600 hover:bg-blue-50", danger: "text-red-600 hover:bg-red-50" };

	// Entrée et clic ailleurs enregistrent (via blur), Échap annule.
	const endEdit = (value) => {
		const name = value.trim();
		if (cancelled.current || !name || name === file.name) { cancelled.current = false; setEditing(false); return; }
		onRename(name).then((ok) => ok && setEditing(false));
	};
	const copy = () => {
		if (!navigator.clipboard) return notify("Copie impossible : sélectionne le lien et copie-le");
		navigator.clipboard.writeText(file.shareUrl).then(() => notify("Lien copié"), () => notify("Copie impossible : sélectionne le lien et copie-le"));
	};
	const onDeleteClick = () => armed ? onDelete() : setArmed(true);

	return <div className="px-5 pb-2">
		{thumb && <Thumb file={file} className="aspect-video rounded-2xl md:aspect-[4/3]" iconSize={72} />}
		<div className="mt-4 flex items-start gap-1">
			{editing
				? <input autoFocus defaultValue={file.name} maxLength={255} aria-label="Nouveau nom du fichier"
						 onFocus={(e) => { const dot = file.name.lastIndexOf("."); e.target.setSelectionRange(0, dot > 0 ? dot : file.name.length); }}
						 onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { cancelled.current = true; e.currentTarget.blur(); } }}
						 onBlur={(e) => endEdit(e.target.value)}
						 className={`min-w-0 flex-1 rounded-md border-0 px-2 py-1 text-lg font-medium ring-1 ring-inset focus:ring-2 ${t.input}`} />
				: <h3 className={`min-w-0 flex-1 break-words text-lg font-medium ${t.title}`}>{file.name}</h3>}
			{!editing && <Hint label="Renommer">
				<button type="button" aria-label="Renommer" onClick={() => setEditing(true)} className={`drive-press -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${t.icon}`}><Pencil size={16} /></button>
			</Hint>}
		</div>
		<dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
			<dt className={t.label}>Type</dt><dd className={t.value}>{KINDS[kindOf(file.mime)].label}</dd>
			<dt className={t.label}>Taille</dt><dd className={t.value}>{formatSize(file.size)}</dd>
			<dt className={t.label}>Ajouté</dt><dd className={t.value}>{new Date(file.createdAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}</dd>
		</dl>
		<div className="mt-5 flex gap-2">
			{/* Boutons standards du site ; les <span> portent les infobulles (pas de ref sur ces composants). */}
			<Hint label="Télécharger le fichier d'origine">
				<span className="flex flex-1"><ButtonA type="blue" width="w-full" iconLeft="upload" onClick={Routing.generate(URL_DOWNLOAD, { id: file.id })}>Télécharger</ButtonA></span>
			</Hint>
			<Hint label={armed ? "Clique à nouveau pour supprimer définitivement" : "Supprimer définitivement"}>
				{dark && !armed
					// Sur fond sombre, le Button « default » serait un bloc blanc : même forme et typo, fond translucide.
					? <button type="button" onClick={onDeleteClick} className="flex items-center justify-center gap-2 rounded-md bg-white/10 px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/15">
						<span className="icon-trash" aria-hidden="true"></span><span>Supprimer</span>
					</button>
					: <span className="flex">
						<Button type={armed ? "red" : "default"} iconLeft="trash" onClick={onDeleteClick}>{armed ? "Confirmer" : "Supprimer"}</Button>
					</span>}
			</Hint>
		</div>

		<div className={`mt-5 border-t pt-4 ${t.border}`}>
			<h4 className={`text-sm font-medium ${t.title}`}>Partage</h4>
			{file.shareUrl ? <>
				<p className={`mt-1 text-xs ${t.muted}`}>Toute personne ayant ce lien peut voir et télécharger le fichier.</p>
				<div className="mt-2 flex gap-2">
					<input readOnly value={file.shareUrl} onFocus={(e) => e.target.select()} aria-label="Lien de partage"
						   className={`min-w-0 flex-1 rounded-md border-0 px-3 py-2 text-sm ring-1 ring-inset ${t.input}`} />
					<Hint label="Copier le lien">
						<button type="button" onClick={copy} className={`drive-press flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold ${t.link}`}><Copy size={16} /> Copier</button>
					</Hint>
				</div>
				<Hint label="Le lien actuel cessera de fonctionner">
					<button type="button" onClick={onUnshare} className={`drive-press -ml-3 mt-1 rounded-md px-3 py-2 text-sm font-semibold ${t.danger}`}>Arrêter le partage</button>
				</Hint>
			</> : <>
				<p className={`mt-1 text-xs ${t.muted}`}>Crée un lien pour envoyer ce fichier à quelqu'un, même sans compte.</p>
				<button type="button" onClick={onShare} className={`drive-press -ml-3 mt-1 flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold ${t.link}`}><Link2 size={16} /> Créer un lien de partage</button>
			</>}
		</div>
	</div>
}
