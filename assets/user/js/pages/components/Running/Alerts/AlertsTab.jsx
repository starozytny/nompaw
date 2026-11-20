import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

const NORMAL_SIGNALS = [
	"Jambes lourdes le lendemain d'une sortie longue",
	"Légère baisse de motivation après une semaine chargée",
	"Courbatures 24–48h après la muscu",
	"Légère lassitude en fin de phase d'intensification",
]

const WARNING_SIGNALS = [
	{ text: <><strong>FC repos +7–10 bpm le matin</strong> → 1–2 jours repos complet</>, severe: false },
	{ text: <><strong>Fatigue persistante &gt;3 jours</strong> → Semaine à 50% du volume</>, severe: false },
	{ text: <><strong>Douleur tendon Achille</strong> → Stop immédiat · Glaçage · Consultation si &gt;48h</>, severe: true },
	{ text: <><strong>Perturbations du sommeil</strong> → Réduire l'intensité</>, severe: false },
	{ text: <><strong>Irritabilité + perte d'appétit</strong> → Semaine récupération complète (–70%)</>, severe: true },
]

const FATIGUE_LEVELS = [
	{ range: '1–4', label: 'VERT', desc: 'Séance normale', bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-700' },
	{ range: '5–6', label: 'JAUNE', desc: 'Réduire de 20%', bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-700' },
	{ range: '7–8', label: 'ORANGE', desc: 'Réduire de 50%', bg: 'bg-orange-50', border: 'border-orange-200', color: 'text-orange-700' },
	{ range: '9–10', label: 'ROUGE', desc: 'Repos complet', bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-700' },
]

const PREVENTION = [
	'Rouler le fascia plantaire 2 min/pied après chaque course (balle de tennis)',
	'Étirements mollets 3 min/jambe après chaque séance de course',
	'Massage glacé des tibias si douleur légère (5 min de glaçage)',
	'Excentriques mollets après chaque muscu — 3×15 sur bord de marche',
	"Chaussures : vérifier l'état, changer après 600 km",
	'7 à 8 h de sommeil les nuits suivant les séances intenses',
]

export function AlertsTab () {
	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Signaux d'alerte</h2>
			<p className="text-sm text-muted-foreground">
				Fatigue normale vs surmenage · Prévention des blessures · Protocole hebdomadaire
			</p>
		</div>

		<div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
			<Card className="p-5">
				<h3 className="font-semibold text-emerald-700 mb-3.5">✅ Signaux normaux — ignorer</h3>
				<ul className="text-sm flex flex-col gap-2">
					{NORMAL_SIGNALS.map((s, i) => <li key={i} className="px-3 py-2 bg-emerald-50 rounded-lg">{s}</li>)}
				</ul>
			</Card>
			<Card className="p-5">
				<h3 className="font-semibold text-orange-700 mb-3.5">⚠️ Alertes — réduire l'entraînement</h3>
				<ul className="text-sm flex flex-col gap-2">
					{WARNING_SIGNALS.map((s, i) => <li key={i} className={`px-3 py-2 rounded-lg ${s.severe ? 'bg-red-50' : 'bg-amber-50'}`}>{s.text}</li>)}
				</ul>
			</Card>
		</div>

		<Card className="p-6">
			<h3 className="font-semibold mb-3">🌡️ Thermomètre de fatigue — noter chaque matin de 1 à 10</h3>
			<div className="grid grid-cols-4 gap-2.5 mb-3">
				{FATIGUE_LEVELS.map(lvl => <div key={lvl.range} className={`text-center p-4 rounded-lg border ${lvl.bg} ${lvl.border}`}>
					<div className={`text-2xl font-bold ${lvl.color}`}>{lvl.range}</div>
					<div className={`text-xs font-semibold ${lvl.color}`}>{lvl.label}</div>
					<div className="text-xs text-muted-foreground mt-1">{lvl.desc}</div>
				</div>)}
			</div>
			<p className="text-xs text-muted-foreground">
				C'est une règle, pas une option. Les athlètes qui ignorent ce signal sont ceux qui se blessent à 3 semaines
				d'une course clé.
			</p>
		</Card>

		<Card className="p-5">
			<h3 className="font-semibold text-blue-700 mb-3.5">🦵 Protocole prévention hebdomadaire</h3>
			<div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
				{PREVENTION.map((p, i) => <div key={i} className="px-3.5 py-2.5 bg-blue-50 rounded-lg text-sm">{p}</div>)}
			</div>
		</Card>
	</div>
}
