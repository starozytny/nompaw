import React, { useMemo, useState } from 'react';

import { Callout } from "@userPages/Running/Callout";
import { WeekCard } from "@userPages/Running/Plan/WeekCard";
import { DayDialog } from "@userPages/Running/Plan/DayDialog";
import { WEEKS } from "@userPages/Running/Plan/weeks";
import { PHASES } from "@userPages/Running/Plan/phases";
import { getDetailMode, storeDetailMode } from "@userPages/Running/Plan/detailMode";

export function PlanTab ({ log, onSaveLog }) {
	const [activePhase, setActivePhase] = useState('p1');
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

		<div className="flex gap-2 flex-wrap">
			{PHASES.map(p => <button
				key={p.id}
				onClick={() => setActivePhase(p.id)}
				className={`text-sm font-semibold px-4 py-2 rounded-full border transition ${activePhase === p.id ? 'bg-foreground text-background border-foreground' : 'bg-white text-muted-foreground border-border hover:border-foreground/40'}`}
			>{p.label}</button>)}
		</div>

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
