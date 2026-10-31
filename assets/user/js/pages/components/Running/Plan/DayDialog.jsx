import React from 'react';

import { Dialog, DialogContent } from "@shadcnComponents/ui/dialog";
import { Badge } from "@shadcnComponents/ui/badge";

import { dayTypeStyle, phaseBlockStyle, zoneBadgeClass } from "@userPages/Running/Plan/styleMaps";
import { liteText } from "@userPages/Running/Plan/detailMode";
import { TrackingPanel } from "@userPages/Running/Plan/TrackingPanel";

function PhaseBlock ({ phase, lite }) {
	const style = phaseBlockStyle(phase.color);
	return <div className={`border-l-[3px] rounded-r-md px-3.5 py-2.5 ${style.bg} ${style.border}`}>
		<div className="flex flex-wrap justify-between items-center gap-2 mb-1">
			<div className={`text-[11px] font-bold uppercase tracking-wide ${style.text}`}>{phase.name}</div>
			<div className="flex gap-1.5 flex-wrap">
				{phase.dur !== '—' && <span className="text-xs bg-black/5 rounded-full px-2 py-0.5 text-muted-foreground">{phase.dur}</span>}
				{phase.allure !== '—' && <span className="text-xs font-semibold bg-foreground text-background rounded-full px-2 py-0.5">{phase.allure}</span>}
				{phase.zone !== '—' && <Badge variant="outline" className={zoneBadgeClass(phase.zone)}>{phase.zone}</Badge>}
			</div>
		</div>
		{lite
			? <div className="text-sm text-muted-foreground">{liteText(phase)}</div>
			: <div className="text-sm" dangerouslySetInnerHTML={{ __html: phase.desc }} />
		}
	</div>
}

export function DayDialog ({ day, open, onOpenChange, detailMode, onDetailModeChange, log, onSaveLog }) {
	if (!day) return null;

	const lite = detailMode === 'lite';
	const d = day.detail;
	const style = dayTypeStyle(day.type);

	return <Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent className="max-w-xl p-0 gap-0 overflow-hidden max-h-[85vh] flex flex-col">
			<div className={`px-6 pr-12 py-5 ${style.bg} flex-shrink-0`}>
				<div className="flex justify-between items-start gap-3">
					<div className="flex-1">
						<div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${style.text}`}>{day.typeLabel} · {day.label}</div>
						<div className="text-lg font-bold leading-tight">{day.short}</div>
					</div>
					<div className="text-3xl flex-shrink-0">{day.emoji}</div>
				</div>
				{!lite && <div className="mt-3 px-3.5 py-2.5 bg-white/65 rounded-md text-sm text-muted-foreground">
					<strong className="text-foreground">Objectif physiologique :</strong> {d.objectif}
				</div>}
			</div>

			<div className="px-6 py-5 overflow-y-auto flex flex-col gap-3.5">
				<div className="flex gap-2 flex-wrap">
					<button
						onClick={() => onDetailModeChange('full')}
						className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${!lite ? 'bg-foreground text-background border-foreground' : 'bg-white text-muted-foreground border-border'}`}
					>Avec explication</button>
					<button
						onClick={() => onDetailModeChange('lite')}
						className={`text-xs font-bold px-3.5 py-1.5 rounded-full border ${lite ? 'bg-foreground text-background border-foreground' : 'bg-white text-muted-foreground border-border'}`}
					>Sans explication</button>
				</div>

				<h4 className="text-sm font-semibold text-muted-foreground">Déroulé de la séance</h4>

				<div className="flex flex-col gap-2">
					{d.phases.map((phase, i) => <PhaseBlock key={i} phase={phase} lite={lite} />)}
				</div>

				{d.nutrition && <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-md text-sm">
					<span className="font-semibold">🥗 Nutrition :</span> {d.nutrition}
				</div>}

				{!lite && d.conseil && <div className="px-3.5 py-2.5 bg-sky-50 border border-sky-200 rounded-md text-sm">
					<span className="font-semibold">💡 Conseil :</span> {d.conseil}
				</div>}

				<TrackingPanel key={day.iso} day={day} entry={log[day.iso] || {}} onSave={onSaveLog} />
			</div>
		</DialogContent>
	</Dialog>
}
