import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

import { Callout } from "@userPages/Running/Callout";
import { EXERCISES_BASE, EXERCISES_ADVANCED } from "@userPages/Running/Muscu/data";

function ExerciseGrid ({ exercises }) {
	return <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
		{exercises.map(ex => <Card key={ex.name} className="overflow-hidden">
			<div className="h-28 bg-muted flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
				<span className="text-3xl">🏋️</span>
				<span className="text-xs">Illustration non disponible</span>
			</div>
			<div className="p-3.5">
				<div className="flex justify-between items-start mb-1 gap-2">
					<div className="font-semibold">{ex.name}</div>
					<div className="text-xs font-bold text-primary whitespace-nowrap">{ex.sets}</div>
				</div>
				<div className="text-sm text-primary font-semibold mb-1.5">{ex.target}</div>
				<div className="text-sm text-muted-foreground">💡 {ex.tip}</div>
				{ex.rest && <div className="text-sm text-muted-foreground mt-1">⏱ Repos : {ex.rest}</div>}
			</div>
		</Card>)}
	</div>
}

export function MuscuTab () {
	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Musculation & Gainage</h2>
			<p className="text-sm text-muted-foreground">
				Lundi : renfo bas du corps (25–30') · Jeudi : gainage et mobilité (15–20') · Pilates le mardi · Matériel : tapis
				· 2×5 kg haltères · marche ou banc
			</p>
		</div>

		<Callout variant="success">
			<strong>Pourquoi la muscu prévient les crampes après le km 14 ?</strong> Les crampes tardives sont souvent
			musculaires, pas seulement liées à la déshydratation. Les squats excentriques, fentes et extensions de mollets
			renforcent la résistance musculaire à la fatigue. Deux séances par semaine produisent des résultats visibles dès
			la semaine 6.
		</Callout>

		<Card className="border-l-4 border-l-primary p-5">
			<h3 className="font-semibold mb-2.5">Comment enchaîner les exercices : circuit, pas séries séparées</h3>
			<p className="text-sm text-muted-foreground mb-3">
				Tu fais <strong>1 série de chaque exercice dans l'ordre</strong>, puis tu recommences au début : <strong>3
				tours</strong> au total, soit 3 séries de chaque exercice. Tu ne fais jamais 3 séries d'affilée du même
				exercice. Le circuit travaille la résistance à la fatigue (ce qu'il faut après le km 14), fait gagner du temps
				et laisse chaque muscle récupérer pendant l'exercice suivant.
			</p>
			<div className="overflow-x-auto mb-3">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="px-3 py-2"></th>
							<th className="text-left px-3 py-2 font-semibold">Lundi — renfo jambes</th>
							<th className="text-left px-3 py-2 font-semibold">Jeudi — gainage</th>
						</tr>
					</thead>
					<tbody>
						<tr className="border-t"><td className="px-3 py-2 font-semibold">Tours</td><td className="px-3 py-2">3 tours</td><td className="px-3 py-2">3 tours</td></tr>
						<tr className="border-t"><td className="px-3 py-2 font-semibold">Repos entre exercices</td><td className="px-3 py-2">30 s</td><td className="px-3 py-2">20 s</td></tr>
						<tr className="border-t"><td className="px-3 py-2 font-semibold">Repos entre tours</td><td className="px-3 py-2">60 s</td><td className="px-3 py-2">45 s</td></tr>
						<tr className="border-t"><td className="px-3 py-2 font-semibold">Tempo</td><td className="px-3 py-2">Descente 3 s, remontée 1 s</td><td className="px-3 py-2">Lent et contrôlé, maintiens statiques</td></tr>
						<tr className="border-t"><td className="px-3 py-2 font-semibold">Charge</td><td className="px-3 py-2">Poids du corps 4 semaines, puis 2 haltères de 5 kg</td><td className="px-3 py-2">Aucune</td></tr>
						<tr className="border-t"><td className="px-3 py-2 font-semibold">Durée</td><td className="px-3 py-2">≈ 25 min (30 min avec step-ups)</td><td className="px-3 py-2">≈ 15–20 min mobilité comprise</td></tr>
					</tbody>
				</table>
			</div>
			<p className="text-sm text-muted-foreground">
				<strong>Progression :</strong> +2 répétitions ou +1 tour toutes les 2 semaines ; arrête chaque série avec 2
				répétitions « en réserve ». <strong>Règles :</strong> montées de marche (step-ups) en 5e exercice dès novembre
				pour préparer le trail ; pas de renfo des jambes dans les 5 jours avant une course (1er nov, 29 nov, 14 mars),
				gainage seulement ; le lendemain d'une course, repos. Chaque séance du plan détaille le déroulé exercice par
				exercice.
			</p>
		</Card>

		<h3 className="font-semibold text-lg">Lundi — Renfo bas du corps (25–30')</h3>
		<ExerciseGrid exercises={EXERCISES_BASE} />

		<h3 className="font-semibold text-lg">Jeudi — Gainage & mobilité (15–20')</h3>
		<ExerciseGrid exercises={EXERCISES_ADVANCED} />
	</div>
}
