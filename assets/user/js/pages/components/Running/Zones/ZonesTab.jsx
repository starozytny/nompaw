import React from 'react';

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Badge } from "@shadcnComponents/ui/badge";

import { Callout } from "@userPages/Running/Callout";
import { ZONES, PACE_PROGRESSION, ZONE_PHYSIOLOGY } from "@userPages/Running/Zones/data";

export function ZonesTab () {
	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Zones d'entraînement</h2>
			<p className="text-sm text-muted-foreground">
				FC max observée <strong>≈ 205 bpm</strong> · FC de seuil estimée <strong>≈ 180 bpm</strong> (d'après tes courses 2026
				sur Garmin Connect, à vérifier dans la Fenix 7 : Statistiques → Performance) · 80% des kilomètres en Zone 1 et 2
				· Objectif <strong>semi en 2h10 (6:09 /km)</strong>
			</p>
		</div>

		<Card className="border-l-4 border-l-primary">
			<CardContent className="pt-6">
				<div className="font-semibold mb-2">Ton profil : 31 ans, 1,77 m, 90 kg</div>
				<ul className="text-sm text-muted-foreground list-disc pl-5 flex flex-col gap-1.5">
					<li><strong>Charge d'impact élevée :</strong> à 90 kg, chaque foulée sollicite davantage les genoux, les tibias et
						les tendons. Le plan ne dépasse jamais +10 % de volume par semaine, alterne séances dures et jours faciles,
						et garde le renfo du lundi et le gainage du jeudi.</li>
					<li><strong>Chaussures :</strong> choisis une paire bien amortie, à changer vers 600–800 km.</li>
					<li><strong>Poids et vitesse :</strong> perdre du poids est le levier le plus rentable (≈ 2 à 3 s/km par kilo).
						L'objectif de 80 kg est détaillé dans l'onglet Perte de poids.</li>
					<li><strong>Douleur :</strong> une douleur localisée qui persiste plus de 3 jours se traite avant de reprendre :
						saute une séance plutôt que d'insister.</li>
				</ul>
			</CardContent>
		</Card>

		<div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
			{ZONES.map(zone => <Card key={zone.code} style={{ borderTopColor: zone.border, borderTopWidth: 3 }}>
				<CardContent className="pt-4 flex flex-col gap-2">
					<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{zone.tag}</div>
					<div className="text-lg font-bold">{zone.name}</div>
					<div className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">FC :</span> {zone.hr}</div>
					<div className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Allure :</span> {zone.pace}</div>
					<div className={`rounded-md px-2.5 py-2 text-xs ${zone.badge}`}>{zone.usage}</div>
				</CardContent>
			</Card>)}
		</div>

		<Callout variant="info">
			<strong>Pourquoi ces zones :</strong> tes courses 2026 montrent une FC moyenne de 180 bpm sur le semi de Cannes (2h18,
			6:30/km) et 186 bpm sur le 10 km de Nice (1h01), pour des FC max de 192 à 205 bpm. Tes footings à 6:45–7:25/km
			tournent à 150–168 bpm : c'est de l'endurance, mais sur le haut de la zone 2. <strong>Priorité à la FC en
			endurance :</strong> si tu dépasses 160 bpm en EF, ralentis, surtout en côte. Sur sentier, cours à l'effort, pas à l'allure.
		</Callout>

		<Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Allures (min/km) selon ton dernier 10 km</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">10 km actuel</th>
							<th className="text-left px-4 py-2.5 font-semibold">EF</th>
							<th className="text-left px-4 py-2.5 font-semibold">SEU</th>
							<th className="text-left px-4 py-2.5 font-semibold">INT</th>
							<th className="text-left px-4 py-2.5 font-semibold">AS</th>
							<th className="text-left px-4 py-2.5 font-semibold">Semi équivalent</th>
							<th className="text-left px-4 py-2.5 font-semibold">Quand</th>
						</tr>
					</thead>
					<tbody>
						{PACE_PROGRESSION.map((row, i) => <tr key={i} className="border-t">
							<td className={`px-4 py-2.5 font-semibold ${row.highlight ? 'text-primary' : ''}`}>{row.tenK}</td>
							<td className="px-4 py-2.5">{row.ef}</td>
							<td className="px-4 py-2.5">{row.seu}</td>
							<td className="px-4 py-2.5">{row.int}</td>
							<td className={`px-4 py-2.5 ${row.highlight ? 'font-bold text-primary' : ''}`}>{row.as}</td>
							<td className="px-4 py-2.5">{row.semi}</td>
							<td className="px-4 py-2.5 text-muted-foreground">{row.when}</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>

		<p className="text-xs text-muted-foreground -mt-2">
			Tes références : 10 km de Marseille (12 avril) en 55:51 pour 9,69 km, soit ≈ 57:30 au 10 km ; 10 km de Nice
			(19 avril) en 1:01:35 pour 10,1 km.
		</p>

		<Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Détail physiologique de chaque zone</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Zone</th>
							<th className="text-left px-4 py-2.5 font-semibold">Nom</th>
							<th className="text-left px-4 py-2.5 font-semibold">Ressenti</th>
							<th className="text-left px-4 py-2.5 font-semibold">Utilisation dans ce plan</th>
							<th className="text-center px-4 py-2.5 font-semibold">% séances</th>
						</tr>
					</thead>
					<tbody>
						{ZONE_PHYSIOLOGY.map(row => <tr key={row.code} className="border-t align-top">
							<td className="px-4 py-2.5"><Badge className={row.badge} variant="outline">{row.code}</Badge></td>
							<td className="px-4 py-2.5 font-semibold">{row.name}</td>
							<td className="px-4 py-2.5 text-muted-foreground">{row.feel}</td>
							<td className="px-4 py-2.5 text-muted-foreground">{row.usage}</td>
							<td className={`px-4 py-2.5 text-center font-semibold ${row.shareColor}`}>{row.share}</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>

		<Callout variant="info">
			<strong>Règle 80/20 appliquée :</strong> 80% des kilomètres en Z1–Z2, 20% en Z3–Z5. La majorité des coureurs amateurs
			font l'inverse (trop vite en endurance, pas assez en intensité). Dans Garmin Connect, crée chaque séance en séance
			structurée avec ces allures ; les intervalles se jugent à l'allure par répétition, la FC réagit trop lentement.
		</Callout>
	</div>
}
