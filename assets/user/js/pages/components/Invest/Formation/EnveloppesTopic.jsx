import React from 'react';

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Badge } from "@shadcnComponents/ui/badge";
import { Alert } from "@tailwindComponents/Elements/Alert";

const ENVELOPPES = [
	{
		code: 'PEA', name: 'Plan d\'épargne en actions', border: 'hsl(var(--chart-1))',
		desc: 'Enveloppe pour investir en actions européennes et ETF éligibles (ex. ETF MSCI World synthétiques via une contrepartie, trackers Europe). Plafond de versement 150 000 €.',
		fiscal: "Aucune taxe sur les plus-values ni dividendes tant qu'il n'y a pas de retrait. Après 5 ans, les retraits sont exonérés d'impôt sur le revenu (seuls les prélèvements sociaux ~17,2 % restent dus). Un retrait avant 5 ans clôture en général le plan.",
	},
	{
		code: 'AV', name: 'Assurance vie', border: 'hsl(var(--chart-2))',
		desc: "Enveloppe polyvalente : fonds euros (capital garanti, rendement modéré) et unités de compte (ETF, fonds actions, plus risqués mais plus porteurs). Pas de plafond de versement.",
		fiscal: "Avant 8 ans, les gains retirés sont taxés (flat tax 30 % ou barème). Après 8 ans, abattement annuel sur les gains (4 600 € seul / 9 200 € en couple) puis flat tax réduite sur le reste. Hors succession classique : cadre successoral avantageux.",
	},
	{
		code: 'CTO', name: 'Compte-titres ordinaire', border: 'hsl(var(--chart-3))',
		desc: "Enveloppe sans restriction : actions, ETF du monde entier (y compris hors UE), pas de plafond. C'est l'enveloppe la plus flexible mais la moins avantageuse fiscalement.",
		fiscal: "Chaque vente avec plus-value est taxée l'année de la vente (flat tax 30 % par défaut, ou option barème progressif + abattements pour durée de détention sur les titres achetés avant 2018).",
	},
	{
		code: 'Livret', name: 'Livrets réglementés / épargne', border: 'hsl(var(--chart-4))',
		desc: "Épargne sans risque, disponible immédiatement (Livret A, LDDS...). Sert de matelas de sécurité, pas de levier de croissance du patrimoine : le rendement suit rarement l'inflation sur le long terme.",
		fiscal: "Intérêts du Livret A et du LDDS totalement exonérés d'impôt et de prélèvements sociaux, mais plafonnés (22 950 € pour le Livret A).",
	},
];

export function EnveloppesTopic () {
	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Les enveloppes : PEA, Assurance vie, CTO, Livrets</h2>
			<p className="text-sm text-muted-foreground">
				Une « enveloppe » n'est pas un placement en soi : c'est un cadre juridique et fiscal dans lequel tu
				places ensuite de vrais actifs (ETF, fonds euros, actions...). Le choix de l'enveloppe change surtout
				la fiscalité et les contraintes de retrait — pas forcément ce que tu peux y acheter.
			</p>
		</div>

		<div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
			{ENVELOPPES.map(e => <Card key={e.code} style={{ borderTopColor: e.border, borderTopWidth: 3 }}>
				<CardContent className="pt-4 flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<Badge variant="outline">{e.code}</Badge>
						<div className="font-semibold">{e.name}</div>
					</div>
					<p className="text-sm text-muted-foreground">{e.desc}</p>
					<div className="text-xs bg-muted/40 rounded-md px-2.5 py-2">
						<span className="font-semibold text-foreground">Fiscalité : </span>{e.fiscal}
					</div>
				</CardContent>
			</Card>)}
		</div>

		<Alert type="blue" icon="exclamation">
			<strong>Pourquoi tu as les trois (PEA + AV + CTO) :</strong> le PEA est le plus avantageux fiscalement pour
			des ETF actions européens/monde, mais il est bloqué sans frais fiscaux qu'après 5 ans et limité aux actions
			éligibles UE. L'assurance vie ajoute le fonds euros (sécurité) et un cadre souple sans plafond. Le CTO sert
			à investir sur ce que les deux autres enveloppes ne permettent pas (ex. ETF américains non éligibles PEA).
			Répartir 100 €/mois sur les trois te garde flexible pendant que le PEA accumule son ancienneté fiscale
			(janvier 2031 pour le tien, ouvert en janvier 2026).
		</Alert>

		<Alert type="red" icon="warning">
			<strong>Les décisions déjà prises pour toi (à ne pas remettre en cause sans raison) :</strong> pas de PER
			(avantage fiscal trop faible à une TMI de 11 %) ; jamais de retrait du PEA avant 2031 ; le crédit immobilier
			à 1,3 % ne se rembourse pas par anticipation — l'argent est plus utile investi qu'à réduire une dette aussi
			bon marché.
		</Alert>

		<Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Repère rapide : où mettre quoi</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Besoin</th>
							<th className="text-left px-4 py-2.5 font-semibold">Enveloppe</th>
						</tr>
					</thead>
					<tbody>
						<tr className="border-t">
							<td className="px-4 py-2.5">Matelas de sécurité (3 mois de charges)</td>
							<td className="px-4 py-2.5 text-muted-foreground">Livret A / épargne de précaution</td>
						</tr>
						<tr className="border-t">
							<td className="px-4 py-2.5">Investissement long terme (retraite, patrimoine), ETF monde</td>
							<td className="px-4 py-2.5 text-muted-foreground">PEA en priorité, puis AV/CTO une fois le plafond ou l'éligibilité atteints</td>
						</tr>
						<tr className="border-t">
							<td className="px-4 py-2.5">Sécuriser une partie du capital tout en restant liquide</td>
							<td className="px-4 py-2.5 text-muted-foreground">Fonds euros de l'assurance vie</td>
						</tr>
						<tr className="border-t">
							<td className="px-4 py-2.5">ETF non éligibles PEA (ex. certains trackers US)</td>
							<td className="px-4 py-2.5 text-muted-foreground">CTO ou unités de compte de l'AV</td>
						</tr>
					</tbody>
				</table>
			</div>
		</Card>
	</div>
}
