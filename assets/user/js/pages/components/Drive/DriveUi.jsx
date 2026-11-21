import React, { useCallback, useEffect, useRef, useState } from "react";
import { File, FileArchive, FileImage, FileSpreadsheet, FileText, FileType2, FileVideo } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@shadcnComponents/ui/tooltip";

/**
 * Infobulle : composant Radix du site, au style des infobulles existantes (fond noir, texte xs).
 * L'enfant doit accepter une ref (élément natif) ; sinon l'envelopper dans un <span>.
 * Le délai initial et l'ouverture instantanée entre boutons voisins viennent du TooltipProvider.
 */
export function Hint ({ label, side = "top", align = "center", children }) {
	return <Tooltip>
		<TooltipTrigger asChild>{children}</TooltipTrigger>
		<TooltipContent side={side} align={align}
						className="origin-[--radix-tooltip-content-transform-origin] rounded border-0 bg-black/90 px-2 py-1 text-xs text-white shadow-md motion-reduce:animate-none">
			{label}
		</TooltipContent>
	</Tooltip>
}

export const KINDS = {
	pdf: { label: "PDF", Icon: FileText, color: "#d93025", bg: "#fce8e6" },
	image: { label: "Images", Icon: FileImage, color: "#e37400", bg: "#fef0e1" },
	video: { label: "Vidéos", Icon: FileVideo, color: "#8430ce", bg: "#f3e8fd" },
	doc: { label: "Documents", Icon: FileType2, color: "#1a73e8", bg: "#e8f0fe" },
	sheet: { label: "Tableurs", Icon: FileSpreadsheet, color: "#188038", bg: "#e6f4ea" },
	archive: { label: "Archives", Icon: FileArchive, color: "#5f6368", bg: "#f1f3f4" },
	other: { label: "Autres", Icon: File, color: "#5f6368", bg: "#f1f3f4" },
};

export const FILTERS = ["pdf", "image", "video", "doc", "sheet"];

export function kindOf (mime = "") {
	mime = mime || "";
	if (mime === "application/pdf") return "pdf";
	if (mime.startsWith("image/")) return "image";
	if (mime.startsWith("video/")) return "video";
	if (mime.includes("sheet") || mime.includes("excel") || mime.includes("csv")) return "sheet";
	if (mime.includes("word") || mime.includes("opendocument.text") || mime.startsWith("text/")) return "doc";
	if (mime.includes("zip") || mime.includes("compressed") || mime.includes("x-tar") || mime.includes("x-7z")) return "archive";
	return "other";
}

export function formatSize (bytes) {
	if (bytes >= 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(2).replace(".", ",") + " Go";
	if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1).replace(".", ",") + " Mo";
	if (bytes >= 1024) return Math.round(bytes / 1024) + " Ko";
	return bytes + " o";
}

const DAY = 86400000;

export function formatDate (iso) {
	const d = new Date(iso);
	const today = new Date();
	if (d.toDateString() === today.toDateString()) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
	return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
}

export function period (iso) {
	const d = new Date(iso);
	const age = Date.now() - d.getTime();
	if (d.toDateString() === new Date().toDateString()) return "Aujourd'hui";
	if (age < 7 * DAY) return "Cette semaine";
	if (age < 31 * DAY) return "Ce mois-ci";
	return "Plus ancien";
}

export function FileGlyph ({ mime, size = 20 }) {
	const k = KINDS[kindOf(mime)];
	return <k.Icon size={size} color={k.color} className="shrink-0" aria-hidden="true" />
}

export function useMediaQuery (query) {
	const [match, setMatch] = useState(() => window.matchMedia(query).matches);
	useEffect(() => {
		const mq = window.matchMedia(query);
		const on = () => setMatch(mq.matches);
		mq.addEventListener("change", on);
		return () => mq.removeEventListener("change", on);
	}, [query]);
	return match;
}

/** Garde un élément monté le temps de son animation de sortie. */
export function usePresence (open, exitMs = 200) {
	const [mounted, setMounted] = useState(open);
	const [closing, setClosing] = useState(false);
	useEffect(() => {
		if (open) { setMounted(true); setClosing(false); return; }
		if (!mounted) return;
		setClosing(true);
		const t = setTimeout(() => { setMounted(false); setClosing(false); }, exitMs);
		return () => clearTimeout(t);
	}, [open]);
	return { mounted, closing };
}

/**
 * Glisser-déposer de fichiers sur toute la fenêtre. Seuls les fichiers venant de l'extérieur de la
 * page sont acceptés : un glisser démarré dans la page (image, lien…) déclenche `dragstart`, et Chrome
 * le présente lui aussi comme un « fichier » — sans ce filtre, relâcher le clic l'importait.
 */
export function useWindowDrop (onFiles) {
	const [over, setOver] = useState(false);
	const depth = useRef(0);
	const internal = useRef(false);
	useEffect(() => {
		const isExternalFiles = (e) => !internal.current && [...(e.dataTransfer?.types || [])].includes("Files");
		const start = () => { internal.current = true; };
		const end = () => { internal.current = false; };
		const enter = (e) => { if (!isExternalFiles(e)) return; e.preventDefault(); depth.current++; setOver(true); };
		const leave = (e) => { if (!isExternalFiles(e)) return; depth.current--; if (depth.current <= 0) { depth.current = 0; setOver(false); } };
		const overFn = (e) => { if (isExternalFiles(e)) e.preventDefault(); };
		const drop = (e) => {
			const external = isExternalFiles(e);
			internal.current = false;
			if (!external) return;
			e.preventDefault(); depth.current = 0; setOver(false); onFiles(e.dataTransfer.files);
		};
		window.addEventListener("dragstart", start);
		window.addEventListener("dragend", end);
		window.addEventListener("dragenter", enter);
		window.addEventListener("dragleave", leave);
		window.addEventListener("dragover", overFn);
		window.addEventListener("drop", drop);
		return () => {
			window.removeEventListener("dragstart", start);
			window.removeEventListener("dragend", end);
			window.removeEventListener("dragenter", enter);
			window.removeEventListener("dragleave", leave);
			window.removeEventListener("dragover", overFn);
			window.removeEventListener("drop", drop);
		};
	}, [onFiles]);
	return over;
}

/** Suppression en deux appuis : le premier « arme » le bouton, qui se désarme seul au bout de 3 s. */
export function useConfirmTap (resetKey) {
	const [armed, setArmed] = useState(false);
	useEffect(() => { setArmed(false); }, [resetKey]);
	useEffect(() => {
		if (!armed) return;
		const t = setTimeout(() => setArmed(false), 3000);
		return () => clearTimeout(t);
	}, [armed]);
	return [armed, setArmed];
}

function useEscape (active, onClose) {
	useEffect(() => {
		if (!active) return;
		// Échap dans un champ annule la saisie (géré par le champ), pas le panneau.
		const key = (e) => e.key === "Escape" && !e.target.closest?.("input, textarea") && onClose();
		window.addEventListener("keydown", key);
		return () => window.removeEventListener("keydown", key);
	}, [active, onClose]);
}

let snackId = 0;

/** Snackbar : un message à la fois. */
export function useSnackbar () {
	const [snack, setSnack] = useState(null);
	const timer = useRef();
	const show = useCallback((message, opts = {}) => {
		clearTimeout(timer.current);
		const id = ++snackId;
		setSnack({ id, message, ...opts });
		timer.current = setTimeout(() => setSnack(s => (s && s.id === id ? null : s)), opts.duration || 4000);
	}, []);
	const hide = useCallback(() => { clearTimeout(timer.current); setSnack(null); }, []);
	useEffect(() => () => clearTimeout(timer.current), []);
	return { snack, show, hide };
}

export function Snackbar ({ snack }) {
	const [last, setLast] = useState(snack);
	useEffect(() => { if (snack) setLast(snack); }, [snack]);
	const { mounted, closing } = usePresence(!!snack, 160);
	if (!mounted || !last) return null;
	return <div role="status" aria-live="polite"
				className={`drive-snack fixed left-1/2 z-50 max-w-[calc(100vw-32px)] rounded-lg bg-[#323232] px-4 py-3 text-sm text-white shadow-lg ${closing ? "drive-snack-out" : ""}`}>
		{last.message}
	</div>
}

export function DropOverlay ({ show, target = "ton Drive" }) {
	const { mounted, closing } = usePresence(show, 150);
	if (!mounted) return null;
	return <div className={`drive-fade pointer-events-none fixed inset-0 z-40 flex items-end justify-center bg-[#1a73e8]/10 p-6 ring-4 ring-inset ring-[#1a73e8] ${closing ? "drive-fade-out" : ""}`}>
		<div className="drive-rise mb-10 rounded-full bg-[#1a73e8] px-5 py-3 text-sm font-medium text-white shadow-lg">
			Dépose tes fichiers pour les importer dans {target === "ton Drive" ? target : `« ${target} »`}
		</div>
	</div>
}

/** Panneau du bas (mobile), qu'on peut fermer en le tirant vers le bas. */
export function BottomSheet ({ open, onClose, children, label }) {
	const { mounted, closing } = usePresence(open, 240);
	const sheet = useRef();
	const drag = useRef(null);
	const last = useRef(children);
	if (open) last.current = children;
	useEscape(open, onClose);

	if (!mounted) return null;

	const down = (e) => { drag.current = { y: e.clientY, dy: 0, t: Date.now() }; sheet.current.style.transition = "none"; e.currentTarget.setPointerCapture(e.pointerId); };
	const move = (e) => {
		if (!drag.current) return;
		const dy = Math.max(0, e.clientY - drag.current.y);
		drag.current.dy = dy;
		sheet.current.style.transform = `translateY(${dy}px)`;
	};
	const up = () => {
		if (!drag.current) return;
		const { dy, t } = drag.current;
		const velocity = dy / Math.max(1, Date.now() - t);
		drag.current = null;
		sheet.current.style.transition = "";
		sheet.current.style.transform = "";
		if (dy > 80 || velocity > 0.5) onClose();
	};

	return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
		<div className={`drive-fade absolute inset-0 bg-black/40 ${closing ? "drive-fade-out" : ""}`} onClick={onClose} />
		<div ref={sheet} className={`drive-sheet absolute inset-x-0 bottom-0 max-h-[90svh] overflow-y-auto rounded-t-2xl bg-white pb-[max(12px,env(safe-area-inset-bottom))] shadow-2xl ${closing ? "drive-sheet-out" : ""}`}>
			<div className="flex touch-none justify-center pb-1 pt-3" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
				<span className="h-1 w-8 rounded-full bg-gray-300" />
			</div>
			{last.current}
		</div>
	</div>
}

/** Panneau latéral (ordinateur). */
export function SidePanel ({ open, onClose, children, label, closeIcon }) {
	const { mounted, closing } = usePresence(open, 220);
	const last = useRef(children);
	if (open) last.current = children;
	useEscape(open, onClose);
	if (!mounted) return null;
	return <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={label}>
		<div className={`drive-fade absolute inset-0 bg-black/20 ${closing ? "drive-fade-out" : ""}`} onClick={onClose} />
		<aside className={`drive-panel absolute bottom-2 right-2 top-2 w-[380px] overflow-y-auto rounded-2xl bg-white pt-3 shadow-2xl ${closing ? "drive-panel-out" : ""}`}>
			<div className="flex justify-end px-3 pb-2">
				<Hint label="Fermer (Échap)" side="left">
					<button type="button" aria-label="Fermer" onClick={onClose} className="drive-press flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100">{closeIcon}</button>
				</Hint>
			</div>
			{last.current}
		</aside>
	</div>
}

/** Image en grand sur fond sombre, avec un panneau d'infos (à droite sur ordinateur, dessous sur mobile). */
export function Lightbox ({ open, onClose, onPrev, onNext, counter, image, children, icons }) {
	const { mounted, closing } = usePresence(open, 150);
	const last = useRef({ image, children, counter });
	if (open) last.current = { image, children, counter };
	useEscape(open, onClose);
	useEffect(() => {
		if (!open) return;
		const key = (e) => {
			if (e.target.closest?.("input, textarea")) return; // ←/→ déplacent le curseur pendant la saisie du nom
			if (e.key === "ArrowLeft" && onPrev) onPrev();
			if (e.key === "ArrowRight" && onNext) onNext();
		};
		window.addEventListener("keydown", key);
		return () => window.removeEventListener("keydown", key);
	}, [open, onPrev, onNext]);
	if (!mounted) return null;

	const round = "drive-press flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20";
	return <div className={`drive-fade fixed inset-0 z-50 flex flex-col bg-black/90 md:flex-row ${closing ? "drive-fade-out" : ""}`} role="dialog" aria-modal="true" aria-label="Image en grand">
		{/* Un clic hors de l'image et des boutons ferme ; l'image remplit la zone, d'où closest() plutôt que target === currentTarget. */}
		<div className="relative flex min-h-0 flex-1 items-center justify-center p-4 md:px-20 md:py-8" onClick={(e) => !e.target.closest("img, button") && onClose()}>
			{/* drive-zoom sur un conteneur stable : l'animation joue à l'ouverture, pas à chaque image suivante */}
			<div className="drive-zoom flex h-full w-full items-center justify-center">{last.current.image}</div>
			<Hint label="Fermer (Échap)" side="right">
				<button type="button" aria-label="Fermer" onClick={onClose} className={`${round} absolute left-3 top-3`}>{icons.close}</button>
			</Hint>
			{last.current.counter && <span className="absolute right-4 top-5 text-sm tabular-nums text-white/70" aria-live="polite">{last.current.counter}</span>}
			{/* Centrées par -mt (pas translate : .drive-press:active remplace transform et le bouton sautait sous le curseur).
			    Aux extrémités, la flèche reste en place (atténuée) : si elle disparaissait, un clic répété tomberait sur le fond et fermerait la vue. */}
			{last.current.counter && <>
				<Hint label="Image précédente (←)" side="right">
					<button type="button" aria-label="Image précédente" aria-disabled={!onPrev} onClick={() => onPrev?.()} className={`${round} absolute left-3 top-1/2 -mt-[22px] aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-white/10`}>{icons.prev}</button>
				</Hint>
				<Hint label="Image suivante (→)" side="left">
					<button type="button" aria-label="Image suivante" aria-disabled={!onNext} onClick={() => onNext?.()} className={`${round} absolute right-3 top-1/2 -mt-[22px] aria-disabled:cursor-default aria-disabled:opacity-30 aria-disabled:hover:bg-white/10`}>{icons.next}</button>
				</Hint>
			</>}
		</div>
		<aside className="max-h-[45svh] shrink-0 overflow-y-auto border-white/10 bg-neutral-900 pt-4 max-md:border-t md:max-h-none md:w-[360px] md:border-l">{last.current.children}</aside>
	</div>
}
