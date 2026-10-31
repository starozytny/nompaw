import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

import { WEEKS } from "@userPages/Running/Plan/weeks";
import { weekStats } from "@userPages/Running/Suivi/lib/stats";
import { fmtPace, fr1, todayISO } from "@userPages/Running/Suivi/lib/format";

export function WeeksTable ({ log }) {
	const today = todayISO();

	return <Card className="overflow-hidden">
		<div className="px-5 py-4 border-b">
			<h3 className="font-semibold">Semaine par semaine : prévu et réalisé</h3>
		</div>
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
						<th className="text-left px-3 py-2.5 font-semibold">Sem.</th>
						<th className="text-left px-3 py-2.5 font-semibold">Dates</th>
						<th className="text-left px-3 py-2.5 font-semibold">Thème</th>
						<th className="text-left px-3 py-2.5 font-semibold">Prévu</th>
						<th className="text-left px-3 py-2.5 font-semibold">Réalisé</th>
						<th className="text-left px-3 py-2.5 font-semibold">Courses</th>
						<th className="text-left px-3 py-2.5 font-semibold">Allure moy.</th>
						<th className="text-left px-3 py-2.5 font-semibold">FC moy.</th>
						<th className="text-left px-3 py-2.5 font-semibold">Ressenti</th>
					</tr>
				</thead>
				<tbody>
					{WEEKS.map(w => {
						const s = weekStats(w, log), future = w.iso0 > today;
						const under = !future && s.plannedKm && s.km / s.plannedKm < 0.7;
						return <tr key={w.id} className={`border-t ${future ? 'opacity-55' : ''}`}>
							<td className="px-3 py-2 font-semibold">S{w.n}</td>
							<td className="px-3 py-2">{w.dates}</td>
							<td className="px-3 py-2">{w.label}</td>
							<td className="px-3 py-2">≈ {s.plannedKm} km</td>
							<td className={`px-3 py-2 font-semibold ${under ? 'text-orange-600' : ''}`}>{future ? '—' : fr1(s.km) + ' km'}</td>
							<td className="px-3 py-2">{future ? '—' : `${s.done}/${s.planned}`}</td>
							<td className="px-3 py-2">{s.km && s.sec ? fmtPace(s.km, s.sec) + ' /km' : '—'}</td>
							<td className="px-3 py-2">{s.hr ? Math.round(s.hr) + ' bpm' : '—'}</td>
							<td className="px-3 py-2">{s.rpe != null ? fr1(s.rpe) + '/10' : '—'}</td>
						</tr>
					})}
				</tbody>
			</table>
		</div>
	</Card>
}
