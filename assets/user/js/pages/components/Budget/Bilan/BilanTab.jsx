import React, { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from "@commonFunctions/sanitaze";

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";

import { monthFr } from "@userPages/Budget/Bilan/lib/format";
import { makeBilan, activeMonthsThisYear } from "@userPages/Budget/Bilan/lib/bilan";
import { budgetToCsv, downloadFile } from "@userPages/Budget/Bilan/lib/csv";

const URL_PLANNING = 'intern_api_budget_planning_index';

export function BilanTab ({ initialYear, yearMin }) {
	const [year, setYear] = useState(initialYear);
	const [tracking, setTracking] = useState(null);
	const [loading, setLoading] = useState(true);
	const [copied, setCopied] = useState(false);

	const load = useCallback((targetYear) => {
		setLoading(true);
		return axios.get(Routing.generate(URL_PLANNING, { year: targetYear }))
			.then(res => { setYear(res.data.year); setTracking(res.data); })
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => { load(year); }, []); // eslint-disable-line react-hooks/exhaustive-deps

	if (loading || !tracking) {
		return <LoaderElements text="Chargement du bilan" />;
	}

	const text = makeBilan(tracking);
	const eligibleRecurrences = tracking.recurrences.filter(r => year >= r.initYear);
	const copy = () => navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
	const exportJson = () => downloadFile(JSON.stringify(tracking, null, 1), `budget-${year}.json`, 'application/json');
	const exportCsv = () => downloadFile(budgetToCsv(tracking), `budget-${year}.csv`, 'text/csv');

	return <div className="flex flex-col gap-4">
		<div className="flex items-center justify-between gap-3">
			<div className="flex items-center gap-1 rounded-lg bg-muted p-1">
				<button
					onClick={() => load(year - 1)} disabled={year - 1 < yearMin}
					className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-card disabled:opacity-30 disabled:hover:bg-transparent"
				>
					<span className="icon-left-arrow text-sm" />
				</button>
				<span className="px-2 text-sm font-semibold tabular-nums">{year}</span>
				<button onClick={() => load(year + 1)} className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-card">
					<span className="icon-right-arrow text-sm" />
				</button>
			</div>
			<div className="flex gap-2.5 flex-wrap">
				<Button type="default" iconLeft="download" onClick={exportJson}>Exporter JSON</Button>
				<Button type="default" iconLeft="download" onClick={exportCsv}>Exporter CSV</Button>
				<Button type="blue" iconLeft="copy" onClick={copy}>{copied ? 'Copié' : 'Copier le bilan'}</Button>
			</div>
		</div>

		<Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Résumé mensuel {year} (réel)</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Mois</th>
							<th className="text-right px-4 py-2.5 font-semibold">Dépenses</th>
							<th className="text-right px-4 py-2.5 font-semibold">Revenus</th>
							<th className="text-right px-4 py-2.5 font-semibold">Économies</th>
							<th className="text-right px-4 py-2.5 font-semibold">Solde</th>
						</tr>
					</thead>
					<tbody>
						{tracking.monthlySummaries.map(m => <tr key={m.month} className="border-t">
							<td className="px-4 py-2.5 capitalize">{monthFr(m.month)}</td>
							<td className="px-4 py-2.5 text-right">{Sanitaze.toFormatCurrency(m.totalExpenseReal)}</td>
							<td className="px-4 py-2.5 text-right">{Sanitaze.toFormatCurrency(m.totalIncomeReal)}</td>
							<td className="px-4 py-2.5 text-right">{Sanitaze.toFormatCurrency(m.totalSavingReal)}</td>
							<td className={`px-4 py-2.5 text-right font-semibold ${m.totalDispo < 0 ? 'text-[var(--status-critical)]' : ''}`}>{Sanitaze.toFormatCurrency(m.totalDispo)}</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>

		{eligibleRecurrences.length > 0 && <Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Récurrences actives en {year}</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Nom</th>
							<th className="text-left px-4 py-2.5 font-semibold">Catégorie</th>
							<th className="text-left px-4 py-2.5 font-semibold">Type</th>
							<th className="text-right px-4 py-2.5 font-semibold">Montant</th>
							<th className="text-right px-4 py-2.5 font-semibold">Occurrences</th>
							<th className="text-right px-4 py-2.5 font-semibold">Total prévu</th>
						</tr>
					</thead>
					<tbody>
						{eligibleRecurrences.map(r => {
							const activeMonths = activeMonthsThisYear(r, year);
							return <tr key={r.id} className="border-t">
								<td className="px-4 py-2.5">{r.name}</td>
								<td className="px-4 py-2.5 text-muted-foreground">{r.category ? r.category.name : '—'}</td>
								<td className="px-4 py-2.5 text-muted-foreground">{r.typeString}</td>
								<td className="px-4 py-2.5 text-right">{Sanitaze.toFormatCurrency(r.price)}/mois</td>
								<td className="px-4 py-2.5 text-right">{activeMonths.length === 12 ? 'Tous les mois' : activeMonths.map(monthFr).join(', ')}</td>
								<td className="px-4 py-2.5 text-right font-semibold">{Sanitaze.toFormatCurrency(r.price * activeMonths.length)}</td>
							</tr>;
						})}
					</tbody>
				</table>
			</div>
		</Card>}

		<Card className="p-5">
			<h3 className="font-semibold mb-1.5">Bilan à copier</h3>
			<p className="text-sm text-muted-foreground mb-3">
				À coller dans une conversation avec Claude pour analyser la tendance du solde, les postes de
				dépenses et le rythme d'épargne, et ajuster le budget si besoin.
			</p>
			<pre className="text-sm whitespace-pre-wrap border rounded-lg bg-muted/20 p-4">{text}</pre>
		</Card>
	</div>;
}
