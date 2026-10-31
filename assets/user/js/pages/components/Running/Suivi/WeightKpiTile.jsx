import React, { useState } from 'react';

import { Plus } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@shadcnComponents/ui/popover";

import { fr1, isoFr, todayISO } from "@userPages/Running/Suivi/lib/format";
import { START_WEIGHT_KG } from "@userPages/Running/Suivi/lib/weight";

/**
 * Lives in the top KPI strip of the Suivi tab (next to "Courses faites", "km des 4 dernières semaines"...)
 * so the last weight and total loss are visible at a glance, with a one-click add — the full history,
 * paliers and detailed KPIs stay in the Poids sub-tab.
 */
export function WeightKpiTile ({ weights, onSaveWeight }) {
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState(todayISO());
	const [kg, setKg] = useState('');

	const ws = weights.slice().sort((a, b) => a.d < b.d ? 1 : -1);
	const last = ws[0];
	const lost = last ? START_WEIGHT_KG - last.kg : null;

	const add = () => {
		const value = parseFloat(String(kg).replace(',', '.'));
		if (!value || value < 40 || value > 200) return;
		onSaveWeight(date || todayISO(), Math.round(value * 10) / 10).then(() => { setKg(''); setOpen(false); });
	};

	return <div className="p-4 border rounded-lg bg-white flex flex-col justify-between gap-2">
		<div>
			<div className="text-xl font-bold">{last ? `${fr1(last.kg)} kg` : '—'}</div>
			<div className="text-xs text-muted-foreground mt-1">
				{last
					? <>Dernier poids ({isoFr(last.d)}) · <span className={lost > 0 ? 'text-emerald-700 font-semibold' : ''}>{lost > 0 ? '−' : '+'}{fr1(Math.abs(lost))} kg</span> depuis le départ</>
					: 'Aucune pesée enregistrée'
				}
			</div>
		</div>

		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button className="self-start text-xs font-bold text-primary flex items-center gap-1 hover:underline">
					<Plus className="h-3.5 w-3.5" /> Ajouter une pesée
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-auto">
				<div className="flex gap-2 items-end">
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
						Date
						<input type="date" value={date} onChange={e => setDate(e.target.value)}
							   className="px-2 py-1 border rounded-md text-sm font-normal normal-case tracking-normal bg-white w-[130px]" />
					</label>
					<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
						Kg
						<input type="text" inputMode="decimal" placeholder="89,4" value={kg} onChange={e => setKg(e.target.value)}
							   className="px-2 py-1 border rounded-md text-sm font-normal normal-case tracking-normal bg-white w-[80px]" />
					</label>
					<button onClick={add} className="text-xs font-bold px-3 py-1.5 rounded-full bg-foreground text-background">OK</button>
				</div>
			</PopoverContent>
		</Popover>
	</div>
}
