import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

import { Callout } from "@userPages/Running/Callout";

const STRATEGIES = [
	{ n: '01', color: 'text-orange-600', border: 'border-t-orange-500', title: 'Règle des 3 premières minutes', text: "Si tu te sens très bien au départ → ralentis. Cette énergie est du glycogène que tu n'as pas le droit de dépenser avant le km 15." },
	{ n: '02', color: 'text-blue-600', border: 'border-t-blue-500', title: 'Fragmenter mentalement', text: <>Le semi n'est pas 21 km. C'est 3×7 km. <strong>Segment 1 (0–7)</strong> : conserve. <strong>Segment 2 (7–14)</strong> : maintiens. <strong>Segment 3 (14–21)</strong> : utilise ce que tu as gardé.</> },
	{ n: '03', color: 'text-emerald-600', border: 'border-t-emerald-500', title: 'Ancre de respiration', text: 'Toutes les 2 km : 3 inspirations profondes conscientes. Brise l\'automatisme, recalibre la fréquence cardiaque.' },
	{ n: '04', color: 'text-violet-600', border: 'border-t-violet-500', title: 'Mot déclencheur anti-panique', text: <>Au km 15+, dis-toi : <em>« J'ai préparé ça. »</em> La douleur au km 15 n'est pas un signal d'alarme — c'est exactement là où la préparation commence à payer.</> },
	{ n: '05', color: 'text-red-600', border: 'border-t-red-500', title: 'Jamais avant le km 16', text: <>Règle non négociable : <strong>aucune accélération avant le km 16</strong>. Peu importe les sensations, peu importe les concurrents.</> },
]

const SCENES = [
	{ label: 'SCÈNE 1', bg: 'bg-emerald-50', chip: 'bg-emerald-600', text: 'Visualise-toi courir à l\'allure objectif, corps détendu, épaules basses, bras fluides, respiration régulière. Tout est fluide.' },
	{ label: 'SCÈNE 2', bg: 'bg-orange-50', chip: 'bg-orange-600', text: 'Visualise le km 15 : tu souffres, c\'est normal. Mais tes jambes répondent. Tu maintiens l\'allure. Tu tiens grâce à l\'entraînement.' },
	{ label: 'SCÈNE 3', bg: 'bg-blue-50', chip: 'bg-blue-600', text: 'Visualise le dernier kilomètre : tu accélères, tu franchis la ligne. L\'horloge affiche 2h10 ou moins. Tu l\'as fait.' },
]

export function MentalTab () {
	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Stratégie mentale</h2>
			<p className="text-sm text-muted-foreground">
				Finir sans exploser · Les kilomètres 15–18 se gagnent à l'entraînement
			</p>
		</div>

		<Callout variant="warn">
			<strong>Diagnostic clé :</strong> Les crampes au km 14 ne sont pas uniquement physiologiques. Le schéma classique :
			départ trop rapide de 15–20 s/km → dette énergétique accumulée → explosion entre km 14–17.
		</Callout>

		<div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
			{STRATEGIES.map(s => <Card key={s.n} className={`p-[18px] border-t-[3px] ${s.border}`}>
				<div className={`text-4xl font-bold leading-none mb-2.5 ${s.color}`}>{s.n}</div>
				<div className="font-semibold text-sm mb-1.5">{s.title}</div>
				<div className="text-sm text-muted-foreground">{s.text}</div>
			</Card>)}
		</div>

		<Card className="p-6">
			<h3 className="font-semibold mb-3 text-orange-600">Visualisation — 3 jours avant la course</h3>
			<p className="text-sm text-muted-foreground mb-4">10 minutes chaque soir avant de dormir, dans le calme, les yeux fermés :</p>
			<div className="flex flex-col gap-2.5">
				{SCENES.map(scene => <div key={scene.label} className={`flex gap-3 items-start p-3 rounded-lg ${scene.bg}`}>
					<span className={`text-white rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap mt-0.5 ${scene.chip}`}>{scene.label}</span>
					<p className="text-sm">{scene.text}</p>
				</div>)}
			</div>
		</Card>
	</div>
}
