import React, { useMemo, useState } from 'react';

import { Tabs, TabsList, TabsTrigger } from "@shadcnComponents/ui/tabs";

import { Callout } from "@userPages/Running/Callout";
import { WeekCard } from "@userPages/Running/Plan/WeekCard";
import { DayDialog } from "@userPages/Running/Plan/DayDialog";
import { WEEKS } from "@userPages/Running/Plan/weeks";
import { PHASES } from "@userPages/Running/Plan/phases";
import { getDetailMode, storeDetailMode } from "@userPages/Running/Plan/detailMode";
import { todayISO, isoAdd } from "@userPages/Running/Suivi/lib/format";

/**
 * The week whose 7-day range contains today decides the default phase, so re-opening the page
 * during week 9 lands on Phase 3 instead of always Phase 1 — falls back to the nearest edge phase
 * outside the plan's date range (before week 3 or after the last week).
 */
function phaseForToday () {
	const today = todayISO();
	const current = WEEKS.find(w => today >= w.iso0 && today <= isoAdd(w.iso0, 6));
	if (current) return current.phase;
	return today < WEEKS[0].iso0 ? WEEKS[0].phase : WEEKS[WEEKS.length - 1].phase;
}

export function PlanTab ({ log, onSaveLog }) {
	const [activePhase, setActivePhase] = useState(phaseForToday);
	const [selected, setSelected] = useState(null);
	const [detailMode, setDetailModeState] = useState(getDetailMode);

	const weeksByPhase = useMemo(() => {
		const map = {};
		WEEKS.forEach(w => { (map[w.phase] = map[w.phase] || []).push(w); });
		return map;
	}, []);

	const phase = PHASES.find(p => p.id === activePhase);

	const handleDetailModeChange = (mode) => {
		setDetailModeState(mode);
		storeDetailMode(mode);
	};

	return <div className="flex flex-col gap-5">
		<div>
			<h2 className="text-xl font-bold mb-1">Plan semaine par semaine</h2>
			<p className="text-sm text-muted-foreground">
				Cliquez sur un jour pour voir le détail complet de la séance · Lundi renfo · Mardi Pilates · Mercredi et
				vendredi course (dès 18h) · Jeudi gainage · Dimanche sortie longue
			</p>
		</div>

		<Tabs value={activePhase} onValueChange={setActivePhase}>
			<TabsList className="flex-wrap h-auto">
				{PHASES.map(p => <TabsTrigger key={p.id} value={p.id}>{p.label}</TabsTrigger>)}
			</TabsList>
		</Tabs>

		{phase && <Callout variant="info"><strong>{phase.introLead}</strong> {phase.introRest}</Callout>}

		<div className="flex flex-col gap-4">
			{(weeksByPhase[activePhase] || []).map(week => <WeekCard
				key={week.id}
				week={week}
				log={log}
				onSelectDay={(w, d) => setSelected({ week: w, day: d })}
			/>)}
		</div>

		<DayDialog
			day={selected?.day}
			open={!!selected}
			onOpenChange={(open) => { if (!open) setSelected(null); }}
			detailMode={detailMode}
			onDetailModeChange={handleDetailModeChange}
			log={log}
			onSaveLog={onSaveLog}
		/>
	</div>
}
