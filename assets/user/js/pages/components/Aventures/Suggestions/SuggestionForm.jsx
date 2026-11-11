import React, { useState } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { Button } from "@tailwindComponents/Elements/Button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcnComponents/ui/sheet";

const URL_SAVE = "intern_api_rando_suggestions_save";

const TYPES = [
	{ value: 0, label: 'Randonnée' },
	{ value: 1, label: 'Bivouac' },
];

const DIFFICULTIES = [
	{ value: 0, label: 'Facile' },
	{ value: 1, label: 'Modéré' },
	{ value: 2, label: 'Difficile' },
	{ value: 3, label: 'Expert' },
];

const INPUT_CLASS = "px-2.5 py-1.5 rounded-md border-0 ring-1 ring-inset ring-gray-300 text-sm font-normal normal-case tracking-normal bg-gray-100 focus:ring-1 focus:ring-inset focus:ring-gray-500 w-full";
const LABEL_CLASS = "flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground";

function toLines (value) {
	return (value || "").split("\n").map(v => v.trim()).filter(v => v !== "");
}

function emptyState (element) {
	return {
		name: element?.name || "",
		type: element ? element.type : 0,
		difficulty: element ? element.difficulty : 0,
		description: element?.description || "",
		location: element?.location || "",
		distanceKm: element?.distanceKm ?? "",
		elevationGainM: element?.elevationGainM ?? "",
		altitudeMaxM: element?.altitudeMaxM ?? "",
		durationMinutes: element?.durationMinutes ?? "",
		pointsOfInterest: (element?.pointsOfInterest || []).join("\n"),
		photoUrls: (element?.photoUrls || []).join("\n"),
		sourceUrl: element?.sourceUrl || "",
		parkRules: element?.parkRules || "",
		travelTimeFromPeyrollesMinutes: element?.travelTimeFromPeyrollesMinutes ?? "",
		travelBudget: element?.travelBudget ?? "",
		randoBudget: element?.randoBudget ?? "",
	};
}

export function SuggestionForm ({ element, open, onOpenChange, onSaved }) {
	const [state, setState] = useState(() => emptyState(element));
	const [load, setLoad] = useState(false);

	const handleOpenChange = (next) => {
		if (next) setState(emptyState(element));
		onOpenChange(next);
	};

	const set = (name) => (e) => setState(s => ({ ...s, [name]: e.target.value }));

	const handleSubmit = (e) => {
		e.preventDefault();
		if (load || !state.name.trim()) return;

		setLoad(true);

		let payload = {
			...state,
			id: element ? element.id : undefined,
			pointsOfInterest: toLines(state.pointsOfInterest),
			photoUrls: toLines(state.photoUrls),
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

	return <Sheet open={open} onOpenChange={handleOpenChange}>
		<SheetContent className="flex flex-col p-0 sm:max-w-xl">
			<SheetHeader>
				<SheetTitle>{element ? "Modifier la suggestion" : "Nouvelle suggestion"}</SheetTitle>
			</SheetHeader>

			<form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
				<label className={LABEL_CLASS}>Nom
					<input type="text" required value={state.name} onChange={set('name')} className={INPUT_CLASS} placeholder="Ex: Sommet des Encombres" />
				</label>

				<div className="grid grid-cols-2 gap-3">
					<label className={LABEL_CLASS}>Type
						<select value={state.type} onChange={e => setState(s => ({ ...s, type: Number(e.target.value) }))} className={INPUT_CLASS}>
							{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</label>
					<label className={LABEL_CLASS}>Difficulté
						<select value={state.difficulty} onChange={e => setState(s => ({ ...s, difficulty: Number(e.target.value) }))} className={INPUT_CLASS}>
							{DIFFICULTIES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
						</select>
					</label>
				</div>

				<label className={LABEL_CLASS}>Description
					<textarea rows={3} value={state.description} onChange={set('description')} className={INPUT_CLASS} />
				</label>

				<label className={LABEL_CLASS}>Lieu
					<input type="text" value={state.location} onChange={set('location')} className={INPUT_CLASS} placeholder="Ex: Massif des Encombres, Savoie" />
				</label>

				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
					<label className={LABEL_CLASS}>Distance (km)
						<input type="number" step="0.1" value={state.distanceKm} onChange={set('distanceKm')} className={INPUT_CLASS} />
					</label>
					<label className={LABEL_CLASS}>Dénivelé (m)
						<input type="number" value={state.elevationGainM} onChange={set('elevationGainM')} className={INPUT_CLASS} />
					</label>
					<label className={LABEL_CLASS}>Altitude max (m)
						<input type="number" value={state.altitudeMaxM} onChange={set('altitudeMaxM')} className={INPUT_CLASS} />
					</label>
					<label className={LABEL_CLASS}>Durée (min)
						<input type="number" value={state.durationMinutes} onChange={set('durationMinutes')} className={INPUT_CLASS} />
					</label>
				</div>

				<label className={LABEL_CLASS}>Points d'intérêt <span className="font-normal normal-case">(un par ligne)</span>
					<textarea rows={3} value={state.pointsOfInterest} onChange={set('pointsOfInterest')} className={INPUT_CLASS} placeholder={"Cascade\nPoint de vue\nLac"} />
				</label>

				<label className={LABEL_CLASS}>Photos <span className="font-normal normal-case">(une URL par ligne)</span>
					<textarea rows={3} value={state.photoUrls} onChange={set('photoUrls')} className={INPUT_CLASS} placeholder={"https://..."} />
				</label>

				<label className={LABEL_CLASS}>Lien source
					<input type="url" value={state.sourceUrl} onChange={set('sourceUrl')} className={INPUT_CLASS} placeholder="https://..." />
				</label>

				<label className={LABEL_CLASS}>Règles du parc
					<textarea rows={2} value={state.parkRules} onChange={set('parkRules')} className={INPUT_CLASS} />
				</label>

				<div className="grid grid-cols-3 gap-3">
					<label className={LABEL_CLASS}>Trajet depuis Peyrolles (min)
						<input type="number" value={state.travelTimeFromPeyrollesMinutes} onChange={set('travelTimeFromPeyrollesMinutes')} className={INPUT_CLASS} />
					</label>
					<label className={LABEL_CLASS}>Budget trajet (€)
						<input type="number" step="0.01" value={state.travelBudget} onChange={set('travelBudget')} className={INPUT_CLASS} />
					</label>
					<label className={LABEL_CLASS}>Budget rando (€)
						<input type="number" step="0.01" value={state.randoBudget} onChange={set('randoBudget')} className={INPUT_CLASS} />
					</label>
				</div>

				<div className="mt-2 flex justify-end gap-2">
					<Button type="default" onClick={() => onOpenChange(false)}>Annuler</Button>
					<Button type="blue" isSubmit={true} iconLeft={load ? "chart-3" : ""}>
						{element ? "Enregistrer" : "Créer"}
					</Button>
				</div>
			</form>
		</SheetContent>
	</Sheet>;
}
