import React, { useEffect, useMemo, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Badge } from "@shadcnComponents/ui/badge";
import { parseGpx } from "@userPages/Aventures/Suggestions/SuggestionTraces";

const COLORS = { 0: '#2563eb', 1: '#ea580c' }; // randonnée / bivouac
const TYPE_LABEL = { 0: 'Randonnée', 1: 'Bivouac' };
const DIFFICULTY_LABEL = { 0: 'Facile', 1: 'Modéré', 2: 'Difficile', 3: 'Expert' };
const TRACK_POINTS = 200; // overview map: coarse lines are enough and keep many traces light

const colorOf = (s) => COLORS[s.type] || '#2563eb';

// Popup built from DOM nodes (textContent / img.src) so names coming from the AI connector can't inject HTML.
function popupFor (s, trace) {
	const box = document.createElement('div');
	box.style.maxWidth = '220px';
	const photo = (s.photoUrls || [])[0];
	if (photo) {
		const img = document.createElement('img');
		img.src = photo;
		img.alt = '';
		img.style.cssText = 'width:100%;height:110px;object-fit:cover;border-radius:6px;margin-bottom:6px;display:block';
		box.append(img);
	}
	const title = document.createElement('strong');
	title.textContent = s.name;
	const meta = document.createElement('div');
	const bits = [TYPE_LABEL[s.type], DIFFICULTY_LABEL[s.difficulty]];
	if (trace) {
		bits.push(`${trace.distanceKm} km`);
		if (trace.elevationGainM !== null) bits.push(`${trace.elevationGainM} m D+`);
	} else if (s.distanceKm) {
		bits.push(`${s.distanceKm} km`);
	}
	meta.textContent = bits.filter(Boolean).join(' · ');
	box.append(title, meta);
	if (s.location) {
		const loc = document.createElement('div');
		loc.textContent = s.location;
		box.append(loc);
	}
	return box;
}

function layerBounds (layer) {
	return layer.getBounds ? layer.getBounds() : L.latLngBounds([layer.getLatLng()]);
}

function SideItem ({ s, hovered, onHover, onSelect }) {
	const photo = (s.photoUrls || [])[0];
	return <li>
		<button type="button" onMouseEnter={() => onHover(s.id)} onMouseLeave={() => onHover(null)}
			onFocus={() => onHover(s.id)} onBlur={() => onHover(null)} onClick={() => onSelect(s.id)}
			className={`flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors ${hovered ? 'bg-muted border-foreground/30' : 'bg-background hover:bg-muted'}`}>
			{photo
				? <img src={photo} alt="" loading="lazy" className="h-16 w-20 flex-shrink-0 rounded-md object-cover" />
				: <div className="h-16 w-20 flex-shrink-0 rounded-md bg-gradient-to-br from-slate-400 via-slate-500 to-emerald-700" />}
			<div className="min-w-0">
				<div className="truncate text-sm font-semibold text-foreground">{s.name}</div>
				<div className="mt-1 flex flex-wrap items-center gap-1.5">
					<span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: colorOf(s) }} />
					<span className="text-xs text-foreground/80">{TYPE_LABEL[s.type]} · {DIFFICULTY_LABEL[s.difficulty]}</span>
				</div>
				<div className="mt-0.5 text-xs text-foreground/70">
					{[s.distanceKm && `${s.distanceKm} km`, s.elevationGainM && `${s.elevationGainM} m D+`, (s.traces || []).length > 0 && `${s.traces.length} trace${s.traces.length > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}
				</div>
			</div>
		</button>
	</li>;
}

export function SuggestionsMap ({ items }) {
	const el = useRef(null);
	const map = useRef(null);
	const registry = useRef(new Map()); // suggestion id → Leaflet layers (marker + polylines)
	const [visibleIds, setVisibleIds] = useState(null); // null until the map has been laid out
	const [hoveredId, setHoveredId] = useState(null);
	const [noPosition, setNoPosition] = useState(0);

	useEffect(() => {
		map.current = L.map(el.current);
		const m = map.current;
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '&copy; OpenStreetMap' }).addTo(m);
		const group = L.featureGroup().addTo(m);
		registry.current = new Map();
		let cancelled = false;

		const updateVisible = () => {
			const view = m.getBounds();
			const ids = new Set();
			registry.current.forEach((layers, id) => { if (layers.some(l => view.intersects(layerBounds(l)))) ids.add(id); });
			setVisibleIds(ids);
		};
		const fit = () => { if (group.getLayers().length) m.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 13 }); };
		const register = (id, layer) => { layer.addTo(group); registry.current.set(id, [...(registry.current.get(id) || []), layer]); return layer; };
		const marker = (latlng, s, trace) => register(s.id, L.circleMarker(latlng, {
			radius: 8, color: '#fff', weight: 2, fillColor: colorOf(s), fillOpacity: 1,
		}).bindPopup(popupFor(s, trace)));

		let missing = 0;
		items.forEach(s => {
			const traces = s.traces || [];
			const hasGps = s.latitude != null && s.longitude != null;
			if (hasGps) marker([s.latitude, s.longitude], s, traces[0] || null);
			else if (traces.length === 0) missing++;

			traces.forEach((t, k) => {
				fetch(t.url).then(r => r.ok ? r.text() : Promise.reject()).then(text => {
					if (cancelled) return;
					const pts = parseGpx(text, TRACK_POINTS).map(p => [p.lat, p.lon]);
					if (pts.length < 2) return;
					const line = register(s.id, L.polyline(pts, { color: colorOf(s), weight: 4, opacity: k === 0 ? 0.9 : 0.55, dashArray: k === 0 ? null : '6 6' }).bindPopup(popupFor(s, t)));
					line.options.baseWeight = 4;
					if (!hasGps && k === 0) marker(pts[0], s, t);
					fit();
					updateVisible();
				}).catch(() => {});
			});
		});

		setNoPosition(missing);
		m.on('moveend', updateVisible);
		if (group.getLayers().length) fit(); else m.setView([46.6, 2.4], 5);
		updateVisible();
		return () => { cancelled = true; m.remove(); };
	}, [items]);

	// Hover from the list = hover on the map: bigger marker, thicker line, drawn on top.
	useEffect(() => {
		registry.current.forEach((layers, id) => {
			const on = id === hoveredId;
			layers.forEach(l => {
				if (l.setRadius) l.setRadius(on ? 12 : 8);
				else l.setStyle({ weight: on ? 8 : 4, opacity: on ? 1 : (l.options.dashArray ? 0.55 : 0.9) });
				if (on) l.bringToFront();
			});
		});
	}, [hoveredId, visibleIds]);

	const select = (id) => {
		const layers = registry.current.get(id);
		if (!layers?.length) return;
		const bounds = layers.map(layerBounds).reduce((a, b) => a.extend(b));
		map.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
		layers[0].openPopup();
	};

	const visible = useMemo(() => items.filter(s => visibleIds?.has(s.id)), [items, visibleIds]);

	return <div className="flex flex-col gap-2">
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
			<div ref={el} className="h-[55vh] min-h-[380px] w-full rounded-lg border lg:h-[70vh]" />
			<div className="flex min-h-0 flex-col gap-2 lg:h-[70vh]">
				<div className="flex items-center justify-between text-sm text-foreground">
					<span className="font-semibold">Dans la zone visible</span>
					<Badge variant="secondary" className="text-sm">{visible.length}</Badge>
				</div>
				<ul className="ml-0 flex list-none max-h-[50vh] flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
					{visible.map(s => <SideItem key={s.id} s={s} hovered={hoveredId === s.id} onHover={setHoveredId} onSelect={select} />)}
					{visibleIds && visible.length === 0 && <li className="rounded-lg border bg-muted/40 p-4 text-sm text-foreground/80">Aucune suggestion dans cette zone — dézoome ou déplace la carte.</li>}
				</ul>
			</div>
		</div>
		<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground">
			<span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[0] }} /> Randonnée</span>
			<span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: COLORS[1] }} /> Bivouac</span>
			<span className="text-foreground/70">Tracé continu : trace principale · pointillé : variantes · point seul : position GPS sans trace</span>
			{noPosition > 0 && <span className="text-foreground/70">{noPosition} suggestion{noPosition > 1 ? 's' : ''} sans position (non affichée{noPosition > 1 ? 's' : ''})</span>}
		</div>
	</div>;
}
