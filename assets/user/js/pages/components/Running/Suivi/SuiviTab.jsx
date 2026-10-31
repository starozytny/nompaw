import React, { useMemo, useState } from 'react';

import { ListChecks, TrendingUp, Scale, ClipboardList } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";

import { WEEKS } from "@userPages/Running/Plan/weeks";
import { weekPlannedKm, weekStats } from "@userPages/Running/Suivi/lib/stats";
import { fr1, todayISO } from "@userPages/Running/Suivi/lib/format";

import { BilanCard } from "@userPages/Running/Suivi/BilanCard";
import { ImportCard } from "@userPages/Running/Suivi/ImportCard";
import { WeeksTable } from "@userPages/Running/Suivi/WeeksTable";
import { PredictorCard } from "@userPages/Running/Suivi/PredictorCard";
import { HistoryCard } from "@userPages/Running/Suivi/HistoryCard";
import { WeightSection } from "@userPages/Running/Suivi/WeightSection";
import { WeightKpiTile } from "@userPages/Running/Suivi/WeightKpiTile";
import { BackupCard } from "@userPages/Running/Suivi/BackupCard";

function useKpis (log) {
	return useMemo(() => {
		const today = todayISO();
		const started = WEEKS.filter(w => w.iso0 <= today);
		const last4 = started.slice(-4);

		let plannedRuns = 0, doneRuns = 0;
		started.forEach(w => { const s = weekStats(w, log); plannedRuns += s.planned; doneRuns += s.done; });

		const km4 = last4.reduce((a, w) => a + weekStats(w, log).km, 0);
		const plan4 = last4.reduce((a, w) => a + weekPlannedKm(w), 0);

		let rpeS = 0, rpeN = 0;
		last4.forEach(w => { const s = weekStats(w, log); if (s.rpe != null) { rpeS += s.rpe; rpeN++; } });

		let next = null;
		WEEKS.forEach(w => w.days.forEach(d => { if (!next && d.type === 'race' && d.iso >= today) next = d; }));
		const daysTo = next ? Math.round((Date.parse(next.iso) - Date.parse(today)) / 86400000) : null;

		return [
			[plannedRuns ? Math.round(doneRuns / plannedRuns * 100) + ' %' : '—', `Courses faites : ${doneRuns} sur ${plannedRuns} prévues depuis le début`],
			[last4.length ? fr1(km4) + ' km' : '—', `Sur les ${last4.length || 4} dernières semaines (prévu ≈ ${plan4} km)`],
			[rpeN ? fr1(rpeS / rpeN) + ' / 10' : '—', 'Ressenti moyen des 4 dernières semaines'],
			[next ? `J-${daysTo}` : '—', next ? `${next.short} · ${next.label}` : 'Aucun jalon à venir'],
		];
	}, [log]);
}

const SUB_TABS = [
	{ value: 'semaines', label: 'Semaines', Icon: ListChecks },
	{ value: 'historique', label: 'Historique & records', Icon: TrendingUp },
	{ value: 'poids', label: 'Poids', Icon: Scale },
	{ value: 'bilan', label: 'Bilan & sauvegarde', Icon: ClipboardList },
];

export function SuiviTab ({ tracking, onImportRuns, onSaveNotes, onRestoreBackup, onReset, onSaveWeight, onDeleteWeight }) {
	const [subTab, setSubTab] = useState('semaines');
	const kpis = useKpis(tracking.log);

	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Progression</h2>
			<p className="text-sm text-muted-foreground">
				Compare ce que tu as couru au plan, importe ton historique Garmin, suis ton poids et génère un bilan à
				partager.
			</p>
		</div>

		<div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
			{kpis.map(([value, label], i) => <div key={i} className="p-4 border rounded-lg bg-white">
				<div className="text-xl font-bold">{value}</div>
				<div className="text-xs text-muted-foreground mt-1">{label}</div>
			</div>)}
			<WeightKpiTile weights={tracking.weights} onSaveWeight={onSaveWeight} />
		</div>

		<Tabs value={subTab} onValueChange={setSubTab}>
			<TabsList className="self-start flex-wrap h-auto bg-muted/70">
				{SUB_TABS.map(({ value, label, Icon }) => <TabsTrigger
					key={value} value={value}
					className="gap-1.5 focus-visible:ring-1 focus-visible:ring-offset-1"
				>
					<Icon className="h-4 w-4" /> {label}
				</TabsTrigger>)}
			</TabsList>

			<TabsContent value="semaines" className="pt-4">
				<WeeksTable log={tracking.log} />
			</TabsContent>

			<TabsContent value="historique" className="pt-4">
				<div className="flex flex-col gap-5">
					<ImportCard onImportRuns={onImportRuns} />
					<HistoryCard activities={tracking.activities} />
					<PredictorCard activities={tracking.activities} />
				</div>
			</TabsContent>

			<TabsContent value="poids" className="pt-4">
				<WeightSection weights={tracking.weights} onSaveWeight={onSaveWeight} onDeleteWeight={onDeleteWeight} />
			</TabsContent>

			<TabsContent value="bilan" className="pt-4">
				<div className="flex flex-col gap-5">
					<BilanCard tracking={tracking} onSaveNotes={onSaveNotes} />
					<BackupCard tracking={tracking} onRestoreBackup={onRestoreBackup} onReset={onReset} />
				</div>
			</TabsContent>
		</Tabs>
	</div>
}
