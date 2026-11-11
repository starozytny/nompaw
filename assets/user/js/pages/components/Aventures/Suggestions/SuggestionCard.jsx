import React, { useState } from 'react';

import { MoreVertical, Pencil, Trash2, MapPin, Clock, TrendingUp, Mountain, Car, Wallet, ExternalLink, X } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from "@shadcnComponents/ui/card";
import { Badge } from "@shadcnComponents/ui/badge";
import { Button } from "@shadcnComponents/ui/button";
import {
	DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from "@shadcnComponents/ui/dropdown-menu";

const TYPE_LABEL = { 0: 'Randonnée', 1: 'Bivouac' };
const DIFFICULTY_LABEL = { 0: 'Facile', 1: 'Modéré', 2: 'Difficile', 3: 'Expert' };
const DIFFICULTY_CLASS = {
	0: 'bg-green-100 text-green-800',
	1: 'bg-amber-100 text-amber-800',
	2: 'bg-orange-100 text-orange-800',
	3: 'bg-red-100 text-red-800',
};

function Stat ({ icon: Icon, label, value }) {
	if (value === null || value === undefined || value === "") return null;
	return <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
		<Icon className="h-3.5 w-3.5 flex-shrink-0" />
		<span>{label}: <span className="font-medium text-foreground">{value}</span></span>
	</div>;
}

export function SuggestionCard ({ elem, onEdit, onDelete }) {
	const [lightboxUrl, setLightboxUrl] = useState(null);

	return <Card>
		<CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
			<div className="flex-1 min-w-0">
				<CardTitle className="text-base">{elem.name}</CardTitle>
				<div className="mt-1.5 flex flex-wrap gap-1.5">
					<Badge variant="secondary">{elem.typeString || TYPE_LABEL[elem.type]}</Badge>
					<Badge className={DIFFICULTY_CLASS[elem.difficulty] || ''}>{elem.difficultyString || DIFFICULTY_LABEL[elem.difficulty]}</Badge>
				</div>
			</div>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground flex-shrink-0">
						<MoreVertical className="h-4 w-4" />
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
		</CardHeader>

		<CardContent className="flex flex-col gap-3">
			{elem.photoUrls && elem.photoUrls.length > 0 && (
				<div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
					{elem.photoUrls.map((url, i) => (
						<img key={i} src={url} alt="" loading="lazy"
							 className="h-20 w-28 flex-shrink-0 rounded-md object-cover cursor-pointer"
							 onClick={() => setLightboxUrl(url)} />
					))}
				</div>
			)}

			{elem.description && <p className="text-sm text-muted-foreground">{elem.description}</p>}

			<div className="grid grid-cols-2 gap-1.5">
				<Stat icon={MapPin} label="Lieu" value={elem.location} />
				<Stat icon={TrendingUp} label="Distance" value={elem.distanceKm ? `${elem.distanceKm} km` : null} />
				<Stat icon={Mountain} label="D+ / Alt. max" value={elem.elevationGainM || elem.altitudeMaxM ? `${elem.elevationGainM ?? '?'} m / ${elem.altitudeMaxM ?? '?'} m` : null} />
				<Stat icon={Clock} label="Durée" value={elem.durationMinutes ? `${elem.durationMinutes} min` : null} />
				<Stat icon={Car} label="Trajet depuis Peyrolles" value={elem.travelTimeFromPeyrollesMinutes ? `${elem.travelTimeFromPeyrollesMinutes} min` : null} />
				<Stat icon={Wallet} label="Budget trajet / rando" value={elem.travelBudget || elem.randoBudget ? `${elem.travelBudget ?? 0}€ / ${elem.randoBudget ?? 0}€` : null} />
			</div>

			{elem.pointsOfInterest && elem.pointsOfInterest.length > 0 && (
				<div>
					<div className="text-xs font-semibold text-muted-foreground mb-1">Points d'intérêt</div>
					<div className="flex flex-wrap gap-1">
						{elem.pointsOfInterest.map((poi, i) => <Badge key={i} variant="outline">{poi}</Badge>)}
					</div>
				</div>
			)}

			{elem.parkRules && (
				<div className="text-xs text-muted-foreground border-t pt-2">
					<span className="font-semibold">Règles du parc: </span>{elem.parkRules}
				</div>
			)}

			{elem.sourceUrl && (
				<a href={elem.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
					<ExternalLink className="h-3 w-3" /> Source
				</a>
			)}
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
