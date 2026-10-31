import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

import { RACES, CHECKPOINTS } from "@userPages/Running/Races/data";

export function RacesTab () {
	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Plans Jour J</h2>
			<p className="text-sm text-muted-foreground">
				Stratégie précise pour chaque course — gestion des allures, nutrition, mental
			</p>
		</div>

		<div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,460px),1fr))]">
			{RACES.map(race => <Card key={race.date} className="overflow-hidden">
				<div className="px-5 py-4 text-white" style={{ background: race.color }}>
					<div className="text-xs font-semibold opacity-80 mb-1">{race.date}</div>
					<div className="text-lg font-bold mb-1">{race.title}</div>
					<div className="text-sm opacity-90">{race.goal}</div>
				</div>
				<div className="px-5 py-4">
					{race.steps.map((s, i) => <div key={i} className="flex gap-3 items-start py-2.5 border-b last:border-b-0">
						<div className="min-w-[100px] text-xs font-bold pt-px" style={{ color: race.color }}>{s.label}</div>
						<div className="flex-1">
							<div className="text-sm mb-0.5">{s.desc}</div>
							{s.allure !== '—' && <div className="text-xs font-semibold text-muted-foreground">→ {s.allure}</div>}
						</div>
					</div>)}
					<div className="mt-3 px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-sm">
						🧃 <strong>Nutrition course :</strong> {race.nutrition}
					</div>
				</div>
			</Card>)}
		</div>

		<Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Checkpoints de progression</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Date</th>
							<th className="text-left px-4 py-2.5 font-semibold">Épreuve</th>
							<th className="text-left px-4 py-2.5 font-semibold">Résultat attendu</th>
							<th className="text-left px-4 py-2.5 font-semibold">Action</th>
						</tr>
					</thead>
					<tbody>
						{CHECKPOINTS.map((c, i) => <tr key={i} className="border-t align-top">
							<td className={`px-4 py-2.5 font-semibold whitespace-nowrap ${c.highlight ? 'text-primary' : ''}`}>{c.date}</td>
							<td className="px-4 py-2.5">{c.event}</td>
							<td className="px-4 py-2.5 text-muted-foreground">{c.result}</td>
							<td className="px-4 py-2.5 text-muted-foreground">{c.action}</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>

		<p className="text-xs text-muted-foreground">
			Si un test est nettement en dessous du résultat attendu, garde les allures de la ligne précédente 2 semaines de
			plus avant de monter.
		</p>
	</div>
}
