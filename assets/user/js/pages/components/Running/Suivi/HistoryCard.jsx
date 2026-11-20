import React from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Callout } from "@userPages/Running/Callout";

import { bestEffort, effort10k } from "@userPages/Running/Suivi/lib/history";
import { fmtDur, fmtPace, fr1, isoAdd, isoFr, MOIS_C, pad2, todayISO } from "@userPages/Running/Suivi/lib/format";

export function HistoryCard ({ activities }) {
	if (!activities.length) {
		return <Callout variant="info">
			Importe ton CSV Garmin pour voir ici ton volume mensuel, tes records et ta forme récente.
		</Callout>;
	}

	const now = new Date();
	const months = [];
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		months.push({ key: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`, label: MOIS_C[d.getMonth()].replace('.', ''), km: 0 });
	}
	activities.forEach(r => { const m = months.find(x => x.key === r.d.slice(0, 7)); if (m) m.km += r.km; });
	const max = Math.max(...months.map(m => m.km), 1);

	const longest = activities.reduce((a, r) => (!a || r.km > a.km ? r : a), null);
	const recs = [
		['Sortie la plus longue', longest, r => `${fr1(r.km)} km en ${fmtDur(r.sec)}`],
		['Meilleure allure sur 4,8–5,3 km', bestEffort(activities, 4.8, 5.3), r => `${fmtDur(r.sec)} pour ${fr1(r.km)} km (${fmtPace(r.km, r.sec)} /km)`],
		['Meilleure allure sur 9,4–10,6 km', bestEffort(activities, 9.4, 10.6), r => `${fmtDur(r.sec)} pour ${fr1(r.km)} km (${fmtPace(r.km, r.sec)} /km) · 10 km équivalent ≈ ${fmtDur(effort10k(r))}`],
		['Meilleure allure sur 20,5–22 km', bestEffort(activities, 20.5, 22), r => `${fmtDur(r.sec)} pour ${fr1(r.km)} km (${fmtPace(r.km, r.sec)} /km)`],
	].filter(x => x[1]);

	const since = isoAdd(todayISO(), -90);
	const recent = activities.filter(r => r.d >= since);
	const recKm = recent.reduce((a, r) => a + r.km, 0);

	return <>
		<Card className="p-5">
			<h3 className="font-semibold mb-1">Volume mensuel (km, 12 derniers mois)</h3>
			<p className="text-xs text-muted-foreground mb-3">
				{activities.length} courses importées · 90 derniers jours : {recent.length} sorties, {fr1(recKm)} km
				(≈ {fr1(recKm / 13)} km par semaine)
			</p>
			<div className="flex items-end gap-1.5 h-[150px] pt-2.5">
				{months.map(m => <div key={m.key} className="flex-1 flex flex-col items-center justify-end h-full text-[11px] text-muted-foreground">
					<span>{m.km ? Math.round(m.km) : ''}</span>
					<div className="w-full bg-primary rounded-t-sm" style={{ height: `${Math.round(m.km / max * 100)}%`, minHeight: 2 }} />
					<span className="mt-1">{m.label}</span>
				</div>)}
			</div>
		</Card>

		<Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Records et références (depuis l'import)</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Référence</th>
							<th className="text-left px-4 py-2.5 font-semibold">Résultat</th>
							<th className="text-left px-4 py-2.5 font-semibold">Date</th>
							<th className="text-left px-4 py-2.5 font-semibold">Activité</th>
						</tr>
					</thead>
					<tbody>
						{recs.map(([label, r, fmt], i) => <tr key={i} className="border-t">
							<td className="px-4 py-2.5 font-semibold">{label}</td>
							<td className="px-4 py-2.5">{fmt(r)}</td>
							<td className="px-4 py-2.5">{isoFr(r.d)}</td>
							<td className="px-4 py-2.5">{r.title || ''}</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>
	</>
}
