import React, { useEffect, useMemo, useRef, useState } from 'react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@shadcnComponents/ui/dialog";
import { Badge } from "@shadcnComponents/ui/badge";

const MAX_POINTS = 600; // enough for a smooth profile, keeps recharts fast on long GPX

function haversine ([lat1, lon1], [lat2, lon2]) {
	const rad = (d) => d * Math.PI / 180;
	const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(a)));
}

// → [{ lat, lon, ele, km }] downsampled, km = cumulative distance
function parseGpx (text) {
	const doc = new DOMParser().parseFromString(text, 'application/xml');
	const pts = [...doc.querySelectorAll('trkpt, rtept')].map(p => ({
		lat: parseFloat(p.getAttribute('lat')),
		lon: parseFloat(p.getAttribute('lon')),
		ele: p.querySelector('ele') ? parseFloat(p.querySelector('ele').textContent) : null,
	})).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lon));

	let km = 0;
	const withKm = pts.map((p, i) => {
		if (i > 0) km += haversine([pts[i - 1].lat, pts[i - 1].lon], [p.lat, p.lon]);
		return { ...p, km };
	});
	const step = Math.max(1, Math.ceil(withKm.length / MAX_POINTS));
	return withKm.filter((_, i) => i % step === 0 || i === withKm.length - 1);
}

function TraceMap ({ points, hoverIndex }) {
	const el = useRef(null);
	const map = useRef(null);
	const marker = useRef(null);

	useEffect(() => {
		map.current = L.map(el.current, { scrollWheelZoom: false });
		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			maxZoom: 18, attribution: '&copy; OpenStreetMap',
		}).addTo(map.current);
		marker.current = L.circleMarker([0, 0], { radius: 7, color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 });
		return () => { map.current.remove(); };
	}, []);

	useEffect(() => {
		if (!points.length) return;
		const latlngs = points.map(p => [p.lat, p.lon]);
		const line = L.polyline(latlngs, { color: '#2563eb', weight: 4 }).addTo(map.current);
		const start = L.circleMarker(latlngs[0], { radius: 6, color: '#fff', weight: 2, fillColor: '#16a34a', fillOpacity: 1 }).addTo(map.current);
		const end = L.circleMarker(latlngs[latlngs.length - 1], { radius: 6, color: '#fff', weight: 2, fillColor: '#dc2626', fillOpacity: 1 }).addTo(map.current);
		map.current.fitBounds(line.getBounds(), { padding: [20, 20] });
		return () => { line.remove(); start.remove(); end.remove(); marker.current.remove(); };
	}, [points]);

	useEffect(() => {
		const p = hoverIndex !== null ? points[hoverIndex] : null;
		if (p) marker.current.setLatLng([p.lat, p.lon]).addTo(map.current);
		else marker.current.remove();
	}, [hoverIndex, points]);

	return <div ref={el} className="h-72 w-full rounded-lg border sm:h-96" />;
}

function ElevationProfile ({ points, onHover }) {
	const data = useMemo(() => points.filter(p => p.ele !== null).map((p, i) => ({ km: +p.km.toFixed(2), ele: Math.round(p.ele), i })), [points]);
	if (data.length < 2) return <p className="text-sm text-foreground/70">Cette trace ne contient pas d'altitude.</p>;
	// the chart's x index must map back to the original points array when some have no elevation
	const indexOf = points.filter(p => p.ele !== null).map(p => points.indexOf(p));

	return <div className="h-44 w-full">
		<ResponsiveContainer>
			<AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
				onMouseMove={(s) => onHover(s?.activeTooltipIndex != null ? indexOf[s.activeTooltipIndex] : null)}
				onMouseLeave={() => onHover(null)}>
				<CartesianGrid strokeDasharray="3 3" vertical={false} />
				<XAxis dataKey="km" type="number" domain={[0, 'dataMax']} tickFormatter={(v) => `${Math.round(v)} km`} fontSize={12} />
				<YAxis domain={['dataMin - 20', 'dataMax + 20']} tickFormatter={(v) => `${Math.round(v)}`} width={44} fontSize={12} unit=" m" />
				<Tooltip formatter={(v) => [`${v} m`, 'Altitude']} labelFormatter={(v) => `${v} km`} />
				<Area type="monotone" dataKey="ele" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2} strokeWidth={2} isAnimationActive={false} />
			</AreaChart>
		</ResponsiveContainer>
	</div>;
}

export function SuggestionTraces ({ suggestion, open, onOpenChange }) {
	const traces = suggestion.traces || [];
	const [selected, setSelected] = useState(0);
	const [points, setPoints] = useState([]);
	const [state, setState] = useState('loading'); // loading | ready | error
	const [hoverIndex, setHoverIndex] = useState(null);

	useEffect(() => { if (open) setSelected(0); }, [open]);

	const trace = traces[selected];
	useEffect(() => {
		if (!open || !trace) return;
		let cancelled = false;
		setState('loading'); setPoints([]); setHoverIndex(null);
		fetch(trace.url)
			.then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
			.then(text => {
				const pts = parseGpx(text);
				if (pts.length < 2) throw new Error('empty');
				if (!cancelled) { setPoints(pts); setState('ready'); }
			})
			.catch(() => { if (!cancelled) setState('error'); });
		return () => { cancelled = true; };
	}, [open, trace?.id]);

	return <Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
			<DialogHeader>
				<DialogTitle>{suggestion.name}</DialogTitle>
				<DialogDescription>{traces.length} trace{traces.length > 1 ? 's' : ''} proposée{traces.length > 1 ? 's' : ''}</DialogDescription>
			</DialogHeader>

			{traces.length > 1 && <div className="flex flex-wrap gap-2" role="tablist">
				{traces.map((t, i) => <button key={t.id} role="tab" aria-selected={i === selected} onClick={() => setSelected(i)}
					className={`rounded-full border px-3 py-1.5 text-sm ${i === selected ? 'bg-foreground text-background' : 'text-foreground hover:bg-muted'}`}>
					{t.name}
				</button>)}
			</div>}

			{trace && <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-medium text-foreground">
				<span>{trace.distanceKm} km</span>
				{trace.elevationGainM !== null && <span>{trace.elevationGainM} m D+</span>}
				{trace.altitudeMaxM !== null && <span>sommet {trace.altitudeMaxM} m</span>}
				<Badge variant="outline" className="text-xs font-normal">{trace.source === 'ai' ? 'Proposée par Claude' : 'Importée'}</Badge>
				<a href={trace.url} download className="text-blue-700 underline">Télécharger le GPX</a>
			</div>}

			{state === 'error' && <p className="text-sm text-[var(--status-critical)]">Impossible de lire cette trace.</p>}
			{state === 'loading' && <p className="text-sm text-foreground/70">Chargement de la trace…</p>}
			<TraceMap points={points} hoverIndex={hoverIndex} />
			{state === 'ready' && <ElevationProfile points={points} onHover={setHoverIndex} />}
		</DialogContent>
	</Dialog>;
}
