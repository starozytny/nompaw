import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Progress } from "@shadcnComponents/ui/progress";

import { dayTypeStyle, chargeIndicatorClass } from "@userPages/Running/Plan/styleMaps";
import { RUN_TYPES, weekStats } from "@userPages/Running/Suivi/lib/stats";
import { fr1, todayISO } from "@userPages/Running/Suivi/lib/format";

export function WeekCard ({ week, log, onSelectDay }) {
	const [descOpen, setDescOpen] = useState(false);
	const today = todayISO();
	const stats = week.iso0 <= today ? weekStats(week, log) : null;

	return <Card className="overflow-hidden">
		<div
			className={`px-6 py-5 border-b cursor-pointer ${week.isRace ? 'bg-amber-50' : 'bg-muted/30'}`}
			onClick={() => setDescOpen(o => !o)}
		>
			<div className="flex flex-wrap justify-between items-start gap-3">
				<div className="flex items-center gap-4">
					<div className="text-4xl font-bold text-primary leading-none min-w-[52px]">S{week.n}</div>
					<div>
						<div className="font-semibold flex items-center gap-2 flex-wrap">
							{week.label}
							{week.isRace && <span className="bg-orange-600 text-white rounded px-2 py-0.5 text-xs font-semibold">🏆 {week.raceDate}</span>}
						</div>
						<div className="text-sm text-muted-foreground mt-0.5">{week.dates} · {week.volume}</div>
						{stats && <div className="text-xs text-muted-foreground mt-1">
							Réalisé <strong className="text-foreground">{fr1(stats.km)} km</strong> / ≈ {stats.plannedKm} km · courses {stats.done}/{stats.planned}
						</div>}
					</div>
				</div>
				<div className="flex items-center gap-4">
					<div>
						<div className="text-xs text-muted-foreground mb-1">Charge</div>
						<Progress value={week.charge} className="w-20 h-1.5" indicatorClassName={chargeIndicatorClass(week.charge)} />
					</div>
					<span className="text-sm text-muted-foreground">{descOpen ? '▴' : '▾'} explication</span>
				</div>
			</div>
			{descOpen && <div className="mt-3 pt-3 border-t text-sm text-muted-foreground leading-relaxed">
				{week.desc}
			</div>}
		</div>

		<div className="grid gap-2.5 p-4 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
			{week.days.map(day => {
				const style = dayTypeStyle(day.type);
				const muted = day.type === 'rest' || day.type === 'pilates';
				const entry = log[day.iso];
				const badge = entry && entry.done ? '✓' : (day.iso < today && RUN_TYPES.includes(day.type) ? '✗' : null);
				return <div
					key={day.date}
					onClick={() => onSelectDay(week, day)}
					className={`relative rounded-lg p-3.5 cursor-pointer border-2 border-transparent hover:-translate-y-0.5 hover:shadow-md transition ${style.bg} ${muted ? 'opacity-65' : ''}`}
				>
					{badge && <span className={`absolute top-1.5 right-2 text-sm font-bold ${badge === '✓' ? 'text-emerald-600' : 'text-red-600 opacity-65'}`}>{badge}</span>}
					<div className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${style.text}`}>{day.date}</div>
					<div className="text-xl mb-1.5">{day.emoji}</div>
					<div className="text-sm font-semibold leading-snug mb-1">{day.short}</div>
					<div className={`text-xs font-semibold ${style.text}`}>{day.typeLabel}</div>
				</div>
			})}
		</div>
	</Card>
}
