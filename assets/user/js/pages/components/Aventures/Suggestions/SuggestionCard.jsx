import React, { useState } from 'react';

import { MoreVertical, Pencil, Trash2, ChevronDown, Ruler, TrendingUp, Clock, Car, ExternalLink, X } from 'lucide-react';

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Badge } from "@shadcnComponents/ui/badge";
import { Button } from "@shadcnComponents/ui/button";
import {
	DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@shadcnComponents/ui/dropdown-menu";

const TYPE_LABEL = { 0: 'Randonnée', 1: 'Bivouac' };
const DIFFICULTY_LABEL = { 0: 'Facile', 1: 'Modéré', 2: 'Difficile', 3: 'Expert' };
const DIFFICULTY_CLASS = {
	0: 'bg-green-100 text-green-900',
	1: 'bg-amber-100 text-amber-900',
	2: 'bg-orange-100 text-orange-900',
	3: 'bg-red-100 text-red-900',
};

const hm = (min) => min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}` : `${min} min`;

function Chip ({ icon: Icon, children }) {
	if (!children) return null;
	return <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
		<Icon className="h-4 w-4 text-foreground/60" />{children}
	</span>;
}

export function SuggestionCard ({ elem, onEdit, onDelete }) {
	const [lightboxUrl, setLightboxUrl] = useState(null);
	const [open, setOpen] = useState(false);

	const photos = elem.photoUrls || [];
	const pois = elem.pointsOfInterest || [];
	const hasBudget = elem.travelBudget || elem.randoBudget;

	return <Card className="overflow-hidden">
		<div className="relative">
			{photos.length > 0
				? <img src={photos[0]} alt="" loading="lazy" className="h-40 w-full cursor-pointer object-cover" onClick={() => setLightboxUrl(photos[0])} />
				: <div className="h-40 w-full bg-gradient-to-br from-slate-400 via-slate-500 to-emerald-700" />}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
			<div className="pointer-events-none absolute bottom-3 left-4 right-4">
				<h3 className="text-lg font-semibold leading-snug text-white">{elem.name}</h3>
				<div className="mt-1.5 flex gap-2">
					<Badge className="bg-white text-sm text-foreground hover:bg-white">{elem.typeString || TYPE_LABEL[elem.type]}</Badge>
					<Badge className={`text-sm ${DIFFICULTY_CLASS[elem.difficulty] || ''}`}>{elem.difficultyString || DIFFICULTY_LABEL[elem.difficulty]}</Badge>
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="absolute right-2 top-2 h-8 w-8 text-white hover:bg-black/30 hover:text-white">
						<MoreVertical className="h-5 w-5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => onEdit(elem)}>
						<Pencil /> Modifier
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => onDelete(elem)} className="text-[var(--status-critical)] focus:text-[var(--status-critical)]">
						<Trash2 /> Supprimer
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>

		<CardContent className="flex flex-col gap-3 p-4">
			<div className="flex flex-wrap gap-x-4 gap-y-1.5">
				<Chip icon={Ruler}>{elem.distanceKm && `${elem.distanceKm} km`}</Chip>
				<Chip icon={TrendingUp}>{elem.elevationGainM && `${elem.elevationGainM} m D+`}</Chip>
				<Chip icon={Clock}>{elem.durationMinutes && hm(elem.durationMinutes)}</Chip>
				<Chip icon={Car}>{elem.travelTimeFromPeyrollesMinutes && hm(elem.travelTimeFromPeyrollesMinutes)}</Chip>
			</div>

			{elem.description && <p className="text-base leading-relaxed text-foreground">{elem.description}</p>}

			<button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
				className="flex items-center gap-1 self-start text-sm font-medium text-blue-700">
				Détails <ChevronDown className={`h-4 w-4 transition-transform duration-150 ease-out ${open ? 'rotate-180' : ''}`} />
			</button>

			{open && <div className="flex flex-col gap-3 border-t pt-3 text-sm text-foreground">
				<ul className="flex flex-col gap-1.5">
					{elem.location && <li>Lieu : <strong>{elem.location}</strong></li>}
					{elem.altitudeMaxM && <li>Altitude max : <strong>{elem.altitudeMaxM} m</strong></li>}
					{hasBudget && <li>Budget : <strong>{elem.travelBudget ?? 0} € trajet + {elem.randoBudget ?? 0} € rando</strong></li>}
					{pois.length > 0 && <li>À voir : <strong>{pois.join(', ')}</strong></li>}
					{elem.parkRules && <li>Règles du parc : {elem.parkRules}</li>}
				</ul>
				{photos.length > 1 && <div className="flex gap-1.5 overflow-x-auto">
					{photos.slice(1).map((url, i) => (
						<img key={i} src={url} alt="" loading="lazy" className="h-20 w-28 flex-shrink-0 cursor-pointer rounded-md object-cover"
							 onClick={() => setLightboxUrl(url)} />
					))}
				</div>}
				{elem.sourceUrl && <a href={elem.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 self-start text-blue-700 underline">
					<ExternalLink className="h-4 w-4" /> Source
				</a>}
			</div>}
		</CardContent>

		{lightboxUrl && (
			<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6" onClick={() => setLightboxUrl(null)}>
				<button className="absolute top-4 right-4 text-white" onClick={() => setLightboxUrl(null)}>
					<X className="h-6 w-6" />
				</button>
				<img src={lightboxUrl} alt="" className="max-h-full max-w-full rounded-md" onClick={(e) => e.stopPropagation()} />
			</div>
		)}
	</Card>;
}
