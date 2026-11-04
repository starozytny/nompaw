import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

import { eur, monthFr } from "@userPages/Invest/lib/format";

export function VersementsTab ({ tracking }) {
	const { enveloppes, contributions } = tracking;
	const linked = enveloppes.filter(e => e.buCategoryId != null);

	if (!linked.length) {
		return <Card className="p-5 text-sm text-muted-foreground">
			Aucune enveloppe n'est liée à une catégorie Épargne du Planificateur. Lie une enveloppe (champ
			« Catégorie Planificateur liée ») dans l'onglet Positions pour voir ici le prévu vs réel de ses versements.
		</Card>;
	}

	return <div className="flex flex-col gap-4">
		{linked.map(e => {
			const contrib = contributions.find(c => c.buCategoryId === e.buCategoryId);
			if (!contrib) return null;

			return <Card key={e.id} className="p-5">
				<h3 className="font-semibold mb-3">{e.name}</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
								<th className="text-left px-3 py-2 font-semibold">Mois</th>
								<th className="text-right px-3 py-2 font-semibold">Prévu</th>
								<th className="text-right px-3 py-2 font-semibold">Réel</th>
								<th className="text-right px-3 py-2 font-semibold">Écart</th>
							</tr>
						</thead>
						<tbody>
							{contrib.months.map(m => {
								const diff = m.actual - m.planned;
								return <tr key={`${m.year}-${m.month}`} className="border-t">
									<td className="px-3 py-2">{monthFr(m.year, m.month)}</td>
									<td className="px-3 py-2 text-right text-muted-foreground">{eur(m.planned)}</td>
									<td className="px-3 py-2 text-right font-semibold">{eur(m.actual)}</td>
									<td className={`px-3 py-2 text-right ${diff < 0 ? 'text-[var(--status-critical)]' : diff > 0 ? 'text-[var(--status-good)]' : 'text-muted-foreground'}`}>
										{diff > 0 ? '+' : ''}{eur(diff)}
									</td>
								</tr>;
							})}
						</tbody>
					</table>
				</div>
			</Card>;
		})}
	</div>;
}
