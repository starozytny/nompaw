import React, { useEffect, useRef, useState } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';
import { Plus, X, Upload, Link as LinkIcon } from 'lucide-react';

import Formulaire from "@commonFunctions/formulaire";

import { Button } from "@shadcnComponents/ui/button";
import { Input } from "@shadcnComponents/ui/input";
import { Textarea } from "@shadcnComponents/ui/textarea";
import { Label } from "@shadcnComponents/ui/label";
import { Badge } from "@shadcnComponents/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcnComponents/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@shadcnComponents/ui/select";

const URL_SAVE = "intern_api_rando_suggestions_save";
const URL_UPLOAD_PHOTO = "intern_api_rando_suggestions_upload_photo";

const TYPES = [
	{ value: '0', label: 'Randonnée' },
	{ value: '1', label: 'Bivouac' },
];

const DIFFICULTIES = [
	{ value: '0', label: 'Facile' },
	{ value: '1', label: 'Modéré' },
	{ value: '2', label: 'Difficile' },
	{ value: '3', label: 'Expert' },
];

function toLines (value) {
	return (value || "").split("\n").map(v => v.trim()).filter(v => v !== "");
}

function emptyState (element) {
	return {
		name: element?.name || "",
		type: String(element ? element.type : 0),
		difficulty: String(element ? element.difficulty : 0),
		description: element?.description || "",
		location: element?.location || "",
		distanceKm: element?.distanceKm ?? "",
		elevationGainM: element?.elevationGainM ?? "",
		altitudeMaxM: element?.altitudeMaxM ?? "",
		durationMinutes: element?.durationMinutes ?? "",
		pointsOfInterest: (element?.pointsOfInterest || []).join("\n"),
		photoUrls: element?.photoUrls || [],
		sourceUrl: element?.sourceUrl || "",
		parkRules: element?.parkRules || "",
		travelTimeFromPeyrollesMinutes: element?.travelTimeFromPeyrollesMinutes ?? "",
		travelBudget: element?.travelBudget ?? "",
		randoBudget: element?.randoBudget ?? "",
	};
}

const SECTION_CLASS = "flex flex-col gap-4 bg-muted/40 p-5 rounded-lg border";
const GRID_2 = "grid grid-cols-1 sm:grid-cols-2 gap-4";
const GRID_4 = "grid grid-cols-2 sm:grid-cols-4 gap-4";

export function SuggestionForm ({ element, open, onOpenChange, onSaved }) {
	const [state, setState] = useState(() => emptyState(element));
	const [newPhotoUrl, setNewPhotoUrl] = useState("");
	const [uploading, setUploading] = useState(false);
	const [load, setLoad] = useState(false);
	const fileInputRef = useRef(null);

	// The Sheet is opened by the parent setting `open` from outside (not from its own trigger),
	// so Radix never fires onOpenChange for that transition — reset the form here instead,
	// whenever `open` flips to true for a (possibly different) element.
	useEffect(() => {
		if (open) {
			setState(emptyState(element));
			setNewPhotoUrl("");
		}
	}, [open, element]);

	const set = (name) => (e) => setState(s => ({ ...s, [name]: e.target.value }));

	const addPhotoUrl = () => {
		let url = newPhotoUrl.trim();
		if (!url) return;
		setState(s => ({ ...s, photoUrls: [...s.photoUrls, url] }));
		setNewPhotoUrl("");
	};

	const removePhotoUrl = (index) => {
		setState(s => ({ ...s, photoUrls: s.photoUrls.filter((_, i) => i !== index) }));
	};

	const handleFileChange = (e) => {
		let file = e.target.files[0];
		e.target.value = "";
		if (!file) return;

		setUploading(true);
		let data = new FormData();
		data.append('photo', file);

		axios.post(Routing.generate(URL_UPLOAD_PHOTO), data)
			.then((response) => setState(s => ({ ...s, photoUrls: [...s.photoUrls, response.data.url] })))
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => setUploading(false))
		;
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (load || !state.name.trim()) return;

		setLoad(true);

		let payload = {
			...state,
			id: element ? element.id : undefined,
			pointsOfInterest: toLines(state.pointsOfInterest),
		};

		axios.post(Routing.generate(URL_SAVE), payload)
			.then((response) => {
				onSaved(response.data);
				onOpenChange(false);
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => setLoad(false))
		;
	};

	return <Sheet open={open} onOpenChange={onOpenChange}>
		<SheetContent className="flex flex-col p-0 sm:max-w-xl">
			<SheetHeader>
				<SheetTitle>{element ? "Modifier la suggestion" : "Nouvelle suggestion"}</SheetTitle>
			</SheetHeader>

			<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
				<div className={SECTION_CLASS}>
					<div className={GRID_2}>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="suggestion-name">Nom</Label>
							<Input id="suggestion-name" required value={state.name} onChange={set('name')} placeholder="Ex: Sommet des Encombres" />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Lieu</Label>
							<Input value={state.location} onChange={set('location')} placeholder="Ex: Massif des Encombres, Savoie" />
						</div>
					</div>

					<div className={GRID_2}>
						<div className="flex flex-col gap-1.5">
							<Label>Type</Label>
							<Select value={state.type} onValueChange={(v) => setState(s => ({ ...s, type: v }))}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Difficulté</Label>
							<Select value={state.difficulty} onValueChange={(v) => setState(s => ({ ...s, difficulty: v }))}>
								<SelectTrigger><SelectValue /></SelectTrigger>
								<SelectContent>
									{DIFFICULTIES.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>Description</Label>
						<Textarea rows={3} value={state.description} onChange={set('description')} />
					</div>
				</div>

				<div className={SECTION_CLASS}>
					<div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Topo</div>
					<div className={GRID_4}>
						<div className="flex flex-col gap-1.5">
							<Label>Distance (km)</Label>
							<Input type="number" step="0.1" value={state.distanceKm} onChange={set('distanceKm')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Dénivelé (m)</Label>
							<Input type="number" value={state.elevationGainM} onChange={set('elevationGainM')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Altitude max (m)</Label>
							<Input type="number" value={state.altitudeMaxM} onChange={set('altitudeMaxM')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Durée (min)</Label>
							<Input type="number" value={state.durationMinutes} onChange={set('durationMinutes')} />
						</div>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>Points d'intérêt <span className="font-normal text-muted-foreground">(un par ligne)</span></Label>
						<Textarea rows={3} value={state.pointsOfInterest} onChange={set('pointsOfInterest')} placeholder={"Cascade\nPoint de vue\nLac"} />
					</div>
				</div>

				<div className={SECTION_CLASS}>
					<div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Photos</div>

					{state.photoUrls.length > 0 && (
						<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
							{state.photoUrls.map((url, i) => (
								<div key={i} className="relative group aspect-square">
									<img src={url} alt="" className="h-full w-full rounded-md object-cover border" />
									<button type="button" onClick={() => removePhotoUrl(i)}
										className="absolute -top-1.5 -right-1.5 bg-background border rounded-full p-0.5 shadow-sm text-muted-foreground hover:text-[var(--status-critical)]">
										<X className="h-3.5 w-3.5" />
									</button>
								</div>
							))}
						</div>
					)}

					<div className="flex gap-2">
						<Input type="url" value={newPhotoUrl} onChange={(e) => setNewPhotoUrl(e.target.value)}
							   placeholder="https://... (lien d'une photo)" className="flex-1" />
						<Button type="button" variant="outline" size="icon" onClick={addPhotoUrl} title="Ajouter ce lien">
							<LinkIcon className="h-4 w-4" />
						</Button>
						<input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
						<Button type="button" variant="outline" size="icon" onClick={() => fileInputRef.current?.click()}
							   disabled={uploading} title="Envoyer une photo depuis cet appareil">
							<Upload className="h-4 w-4" />
						</Button>
					</div>
					{uploading && <div className="text-xs text-muted-foreground">Envoi de la photo...</div>}
				</div>

				<div className={SECTION_CLASS}>
					<div className="flex flex-col gap-1.5">
						<Label>Lien source</Label>
						<Input type="url" value={state.sourceUrl} onChange={set('sourceUrl')} placeholder="https://..." />
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>Règles du parc</Label>
						<Textarea rows={2} value={state.parkRules} onChange={set('parkRules')} />
					</div>

					<div className={GRID_4.replace('grid-cols-4', 'grid-cols-3')}>
						<div className="flex flex-col gap-1.5">
							<Label>Trajet depuis Peyrolles (min)</Label>
							<Input type="number" value={state.travelTimeFromPeyrollesMinutes} onChange={set('travelTimeFromPeyrollesMinutes')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Budget trajet (€)</Label>
							<Input type="number" step="0.01" value={state.travelBudget} onChange={set('travelBudget')} />
						</div>
						<div className="flex flex-col gap-1.5">
							<Label>Budget rando (€)</Label>
							<Input type="number" step="0.01" value={state.randoBudget} onChange={set('randoBudget')} />
						</div>
					</div>
				</div>

				<div className="mt-2 flex justify-end gap-2">
					<Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
					<Button type="submit" disabled={load}>
						{element ? "Enregistrer" : "Créer"}
					</Button>
				</div>
			</form>
		</SheetContent>
	</Sheet>;
}
