import React from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Separator } from "@shadcnComponents/ui/separator";

import { MEALS, MEAL_TAG_COLORS, SNACK_TIMING } from "@userPages/Running/Nutrition/data";
import { FASTING_ITEMS, SUPPLEMENTS, LUNCH_CATEGORIES, SHOPPING_LIST, POIDS_MEALS, ALCOHOL_COLUMNS } from "@userPages/Running/Nutrition/weightLossData";

function MealSlot ({ emoji, label, slot }) {
	return <div className="px-4 py-3.5 border-t">
		<div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">{emoji} {label}</div>
		<div className="font-semibold mb-1.5">{slot.title}</div>
		<ul className="text-sm text-muted-foreground flex flex-col gap-0.5 mb-2">
			{slot.items.map((item, i) => <li key={i} className="py-0.5 border-b border-dashed last:border-b-0">• {item}</li>)}
		</ul>
		<div className="flex justify-between items-center">
			<span className="text-xs text-muted-foreground">⏱ {slot.time}</span>
			<span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${MEAL_TAG_COLORS[slot.tagColor]}`}>{slot.tag}</span>
		</div>
	</div>
}

export function NutritionTab () {
	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Nutrition</h2>
			<p className="text-sm text-muted-foreground">
				Plan 5 jours + stratégie de course · Focus anti-crampes · Repas rapides &lt;15 min
			</p>
		</div>

		<div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
			<Card className="border-t-[3px] border-t-orange-500 p-[18px]">
				<div className="text-2xl mb-2">⚡</div>
				<h3 className="font-semibold mb-2.5 text-orange-700">Anti-crampes</h3>
				<ul className="text-sm text-muted-foreground flex flex-col">
					<li className="py-1 border-b">Magnésium bisglycinate 300 mg/soir</li>
					<li className="py-1 border-b">Amandes · épinards · chocolat noir &gt;70%</li>
					<li className="py-1 border-b">Banane (potassium) après l'effort</li>
					<li className="py-1">1,5 à 2 L d'eau minimum par jour</li>
				</ul>
			</Card>
			<Card className="border-t-[3px] border-t-blue-500 p-[18px]">
				<div className="text-2xl mb-2">🔋</div>
				<h3 className="font-semibold mb-2.5 text-blue-700">Énergie en course</h3>
				<ul className="text-sm text-muted-foreground flex flex-col">
					<li className="py-1 border-b">Gel ou banane toutes les 45 min</li>
					<li className="py-1 border-b">Jamais plus de 20 min sans glucides (semi)</li>
					<li className="py-1 border-b">Eau à chaque ravitaillement (ne pas skipper)</li>
					<li className="py-1">⚠ Ne tester aucun gel inconnu le jour J</li>
				</ul>
			</Card>
			<Card className="border-t-[3px] border-t-emerald-500 p-[18px]">
				<div className="text-2xl mb-2">🌙</div>
				<h3 className="font-semibold mb-2.5 text-emerald-700">Veille de course</h3>
				<ul className="text-sm text-muted-foreground flex flex-col">
					<li className="py-1 border-b">Riz, pâtes ou patate douce le soir</li>
					<li className="py-1 border-b">Protéines maigres (poulet, œufs)</li>
					<li className="py-1 border-b">8 h de sommeil minimum</li>
					<li className="py-1">Pas de fibres en excès, pas d'alcool J-3</li>
				</ul>
			</Card>
		</div>

		<h3 className="font-semibold text-lg">Plan repas — 5 jours</h3>
		<div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
			{MEALS.map(m => <Card key={m.day} className="overflow-hidden">
				<div className="px-4 py-3 bg-foreground text-background">
					<div className="font-semibold">{m.day}</div>
					<div className="text-xs opacity-60 mt-0.5">{m.context}</div>
				</div>
				<MealSlot emoji="🌞" label="Midi" slot={m.midi} />
				<MealSlot emoji="🌙" label="Soir" slot={m.soir} />
			</Card>)}
		</div>

		<Card className="overflow-hidden">
			<div className="px-5 py-4 border-b">
				<h3 className="font-semibold">Collations & timing nutritionnel</h3>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
							<th className="text-left px-4 py-2.5 font-semibold">Moment</th>
							<th className="text-left px-4 py-2.5 font-semibold">Collation recommandée</th>
							<th className="text-left px-4 py-2.5 font-semibold">Pourquoi</th>
						</tr>
					</thead>
					<tbody>
						{SNACK_TIMING.map((row, i) => <tr key={i} className="border-t">
							<td className={`px-4 py-2.5 font-semibold whitespace-nowrap ${row.highlight ? 'text-orange-700' : ''}`}>{row.when}</td>
							<td className="px-4 py-2.5">{row.snack}</td>
							<td className="px-4 py-2.5 text-muted-foreground">{row.why}</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>

		<Separator className="my-1" />

		<div>
			<h2 className="text-xl font-bold mb-1">Côté perte de poids</h2>
			<p className="text-sm text-muted-foreground">
				~1 800–2 000 kcal/jour · ~160–180 g protéines · Déficit ~350 kcal · jeûne matinal maintenu
			</p>
		</div>

		<Card className="border-l-4 border-l-emerald-500 p-5">
			<div className="flex items-center gap-2.5 mb-3">
				<span className="text-2xl">✅</span>
				<h3 className="font-semibold">Option A — Jeûne matinal (fenêtre 12h–20h)</h3>
			</div>
			<div className="grid gap-2.5 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] text-sm text-muted-foreground">
				{FASTING_ITEMS.map((it, i) => <div key={i} className={`p-2.5 rounded-lg ${it.warn ? 'bg-amber-50 border border-amber-200' : 'bg-emerald-50'}`}>
					{it.emoji} <strong className="text-foreground">{it.label}</strong> {it.text}
				</div>)}
			</div>
		</Card>

		<h3 className="font-semibold text-lg">Tes compléments — protocole quotidien</h3>
		<div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(270px,1fr))]">
			{SUPPLEMENTS.map(s => <Card key={s.name} className="p-[18px]">
				<div className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${s.color}`}>{s.tag}</div>
				<div className="font-semibold mb-2.5">{s.name}</div>
				<ul className="text-sm text-muted-foreground flex flex-col gap-1.5">
					{s.items.map((it, i) => <li key={i} className="pb-1.5 border-b last:border-b-0">{it}</li>)}
				</ul>
			</Card>)}
		</div>

		<div>
			<h3 className="font-semibold text-lg mb-1">Midi au boulot — supermarché + micro-ondes</h3>
			<p className="text-sm text-muted-foreground mb-3">Tout s'achète en grande surface, se chauffe 2–3 min ou se mange froid. Préparation max : 2 min.</p>
		</div>
		<div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
			{LUNCH_CATEGORIES.map(cat => <Card key={cat.title} className="p-[18px]">
				<div className={`font-semibold mb-3 ${cat.color}`}>{cat.title}</div>
				<ul className="text-sm text-muted-foreground flex flex-col gap-1.5">
					{cat.items.map((it, i) => <li key={i} className={`px-2.5 py-2 rounded-lg ${cat.bg}`}>{it}</li>)}
				</ul>
			</Card>)}
		</div>

		<Card className="p-5">
			<h3 className="font-semibold mb-3">🛒 Liste courses hebdomadaire — à toujours avoir</h3>
			<div className="grid gap-2 grid-cols-[repeat(auto-fit,minmax(190px,1fr))] text-sm">
				{SHOPPING_LIST.map((it, i) => <div key={i} className="px-3 py-2 bg-muted/40 border rounded-lg">{it}</div>)}
			</div>
		</Card>

		<div>
			<h3 className="font-semibold text-lg mb-1">Plan semaine — midi superm + soir maison</h3>
			<p className="text-sm text-muted-foreground mb-3">~1 800–2 000 kcal/jour · ~160–180 g protéines · Déficit ~350 kcal</p>
		</div>
		<div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(210px,1fr))]">
			{POIDS_MEALS.map(m => <Card key={m.day} className="overflow-hidden">
				<div className="px-4 py-3 bg-foreground text-background">
					<div className="font-semibold">{m.day}</div>
					<div className="text-xs opacity-55 mt-0.5">{m.context}</div>
				</div>
				<div className="px-4 py-3.5 border-t">
					<div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">🌞 Midi — Supermarché</div>
					<div className="font-semibold mb-1.5">{m.midi.title}</div>
					<ul className="text-sm text-muted-foreground flex flex-col gap-0.5 mb-2">
						{m.midi.items.map((it, i) => <li key={i} className="py-0.5 border-b border-dashed last:border-b-0">• {it}</li>)}
					</ul>
					<div className="flex justify-between items-center flex-wrap gap-1">
						<span className="text-xs text-muted-foreground">{m.midi.kcal} · 🥩 {m.midi.prot}</span>
						<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{m.midi.tag}</span>
					</div>
				</div>
				<div className="px-4 py-3.5 border-t">
					<div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">🌙 Soir — Maison</div>
					<div className="font-semibold mb-1.5">{m.soir.title}</div>
					<ul className="text-sm text-muted-foreground flex flex-col gap-0.5 mb-2">
						{m.soir.items.map((it, i) => <li key={i} className="py-0.5 border-b border-dashed last:border-b-0">• {it}</li>)}
					</ul>
					<div className="flex justify-between items-center flex-wrap gap-1">
						<span className="text-xs text-muted-foreground">{m.soir.kcal} · 🥩 {m.soir.prot}</span>
						<span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700">{m.soir.tag}</span>
					</div>
				</div>
				<div className="px-4 py-3 bg-amber-50 border-t border-amber-200">
					<div className="text-[11px] font-bold uppercase tracking-wide text-amber-700 mb-0.5">💊 Compléments du jour</div>
					<div className="text-sm text-muted-foreground">{m.collation}</div>
				</div>
			</Card>)}
		</div>

		<h3 className="font-semibold text-lg">🍺 Alcool — stratégie sans tout interdire</h3>
		<Card className="p-5">
			<div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
				{ALCOHOL_COLUMNS.map(col => <div key={col.title}>
					<div className={`font-semibold mb-2 ${col.color}`}>{col.title}</div>
					<ul className="text-sm text-muted-foreground flex flex-col">
						{col.items.map((it, i) => <li key={i} className="py-1 border-b last:border-b-0">{it}</li>)}
					</ul>
				</div>)}
			</div>
		</Card>
	</div>
}
