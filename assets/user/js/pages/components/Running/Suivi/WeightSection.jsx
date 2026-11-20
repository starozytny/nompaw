import React from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Callout } from "@userPages/Running/Callout";
import { WeightTracker } from "@userPages/Running/Suivi/WeightTracker";

import { MILESTONES } from "@userPages/Running/Suivi/lib/weight";

export function WeightSection ({ weights, onSaveWeight, onDeleteWeight }) {
	return <div className="flex flex-col gap-5">
		<div>
			<h3 className="font-semibold text-lg mb-1">Plan perte de poids</h3>
			<p className="text-sm text-muted-foreground">
				1,77 m · 90 kg → objectif 80 kg d'ici octobre 2027 · jeûne matinal maintenu
			</p>
		</div>

		<Callout variant="info">
			<strong>⚖️ Objectif : 90 kg → 80 kg d'ici le semi du 10 octobre 2027</strong> (soit environ 1 kg par mois,
			1,77 m). À effort égal, chaque kilo en moins fait gagner environ 2 à 3 s/km : 10 kg représentent 20 à 30 s/km,
			ce qui fait passer ton 10 km de ≈ 57:00 à ≈ 52:30–53:30. C'est la clé du sub-2h. Rythme prudent : 0,2 à 0,3 kg
			par semaine, jamais de déficit pendant la semaine d'une course ni sur les semaines de pic de volume.
		</Callout>

		<Card className="overflow-hidden">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Date</th>
							<th className="text-left px-4 py-2.5 font-semibold">Palier</th>
							<th className="text-left px-4 py-2.5 font-semibold">Repère</th>
						</tr>
					</thead>
					<tbody>
						{MILESTONES.map((m, i) => <tr key={i} className="border-t">
							<td className="px-4 py-2.5">{m.date}</td>
							<td className={`px-4 py-2.5 font-semibold ${m.highlight ? 'text-primary' : ''}`}>{m.kg}</td>
							<td className="px-4 py-2.5">{m.note}</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>

		<WeightTracker weights={weights} onSaveWeight={onSaveWeight} onDeleteWeight={onDeleteWeight} />
	</div>
}
