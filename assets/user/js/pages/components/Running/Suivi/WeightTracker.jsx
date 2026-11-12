import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@shadcnComponents/ui/button";

import { fr1, isoFr, todayISO } from "@userPages/Running/Suivi/lib/format";
import { START_WEIGHT_KG, weightTarget } from "@userPages/Running/Suivi/lib/weight";

export function WeightTracker ({ weights, onSaveWeight, onDeleteWeight }) {
	const [date, setDate] = useState(todayISO());
	const [kg, setKg] = useState('');

	const add = () => {
		const value = parseFloat(String(kg).replace(',', '.'));
		if (!value || value < 40 || value > 200) return;
		onSaveWeight(date || todayISO(), Math.round(value * 10) / 10).then(() => setKg(''));
	};

	const ws = weights.slice().sort((a, b) => a.d < b.d ? 1 : -1);
	const last = ws[0];
	const lost = last ? START_WEIGHT_KG - last.kg : null;
	const diff = last ? last.kg - weightTarget(last.d) : null;
	const diffColor = diff == null ? '' : diff <= 0.5 ? 'text-[var(--status-good)]' : diff <= 1.5 ? 'text-orange-600' : 'text-[var(--status-critical)]';

	return <Card className="p-5">
		<h3 className="font-semibold mb-1.5">Suivi du poids</h3>
		<p className="text-sm text-muted-foreground mb-3">
			Pèse-toi le matin à jeun, 2 à 3 fois par semaine : c'est la tendance qui compte, pas un chiffre isolé.
		</p>

		<div className="border rounded-lg bg-muted/20 p-4 mb-4 flex flex-col gap-3">
			<div className="flex flex-wrap gap-3">
				<div className="flex-1 min-w-[140px]">
					<div className="text-lg font-bold">{last ? `${fr1(last.kg)} kg` : '—'}</div>
					<div className="text-xs text-muted-foreground mt-0.5">{last ? `Dernière pesée (${isoFr(last.d)})` : 'Aucune pesée enregistrée'}</div>
				</div>
				<div className="flex-1 min-w-[140px]">
					<div className={`text-lg font-bold ${lost != null && lost > 0 ? 'text-[var(--status-good)]' : ''}`}>
						{lost != null ? `${lost > 0 ? '−' : '+'}${fr1(Math.abs(lost))} kg` : '—'}
					</div>
					<div className="text-xs text-muted-foreground mt-0.5">Perdu depuis le départ ({fr1(START_WEIGHT_KG)} kg)</div>
				</div>
			</div>

			<div className="flex gap-2.5 flex-wrap items-end">
				<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground w-[150px]">
					Date
					<input type="date" value={date} onChange={e => setDate(e.target.value)}
						   className="px-2.5 py-1.5 border rounded-md text-sm font-normal normal-case tracking-normal bg-white" />
				</label>
				<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground w-[110px]">
					Poids (kg)
					<input type="text" inputMode="decimal" placeholder="89,4" value={kg} onChange={e => setKg(e.target.value)}
						   className="px-2.5 py-1.5 border rounded-md text-sm font-normal normal-case tracking-normal bg-white" />
				</label>
				<Button onClick={add}>Ajouter</Button>
			</div>
		</div>

		{!ws.length
			? <span className="text-sm text-muted-foreground">Départ prévu à {fr1(START_WEIGHT_KG)} kg.</span>
			: <>
				<div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(190px,1fr))] mb-3">
					<div className="p-4 border rounded-lg">
						<div className={`text-xl font-bold ${diffColor}`}>{diff > 0 ? '+' : ''}{fr1(diff)} kg</div>
						<div className="text-xs text-muted-foreground mt-1">Écart avec le palier du jour ({fr1(weightTarget(last.d))} kg)</div>
					</div>
					<div className="p-4 border rounded-lg">
						<div className="text-xl font-bold">{fr1(Math.max(0, last.kg - 80))} kg</div>
						<div className="text-xs text-muted-foreground mt-1">Restant avant 80 kg</div>
					</div>
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
								<th className="text-left px-3 py-2 font-semibold">Date</th>
								<th className="text-left px-3 py-2 font-semibold">Poids</th>
								<th className="text-left px-3 py-2 font-semibold">Palier</th>
								<th className="px-3 py-2"></th>
							</tr>
						</thead>
						<tbody>
							{ws.slice(0, 10).map(w => <tr key={w.id} className="border-t">
								<td className="px-3 py-2">{isoFr(w.d)}</td>
								<td className="px-3 py-2 font-semibold">{fr1(w.kg)} kg</td>
								<td className="px-3 py-2">{fr1(weightTarget(w.d))} kg</td>
								<td className="px-3 py-2 text-right">
									<button onClick={() => onDeleteWeight(w.id)} className="text-muted-foreground hover:text-red-600 px-2">×</button>
								</td>
							</tr>)}
						</tbody>
					</table>
				</div>
			</>
		}
	</Card>
}
