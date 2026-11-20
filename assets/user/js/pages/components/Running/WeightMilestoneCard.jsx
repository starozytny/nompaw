import React, { useState } from 'react';

import { Scale, Plus } from 'lucide-react';

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Popover, PopoverTrigger, PopoverContent } from "@shadcnComponents/ui/popover";
import { Button } from "@shadcnComponents/ui/button";

import { fr1, todayISO } from "@userPages/Running/Suivi/lib/format";
import { START_WEIGHT_KG } from "@userPages/Running/Suivi/lib/weight";
import { weightProgressColor } from "@userPages/Running/Suivi/lib/weightColor";

/**
 * Same role as the other header milestone tiles, but with a one-click "add a weight" popover — kept
 * separate from Suivi's WeightKpiTile since that one matches the plain KPI-grid look of its own tab,
 * while this one matches the icon-badge Card style of the main header. The accent color itself tracks
 * progress: red above the 90 kg starting point, fading to green as the current weight nears 80 kg.
 */
export function WeightMilestoneCard ({ weights, onSaveWeight }) {
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState(todayISO());
	const [kg, setKg] = useState('');

	const ws = weights.slice().sort((a, b) => a.d < b.d ? 1 : -1);
	const last = ws[0];
	const lost = last ? START_WEIGHT_KG - last.kg : null;
	const { color, soft } = weightProgressColor(last?.kg);

	const add = () => {
		const value = parseFloat(String(kg).replace(',', '.'));
		if (!value || value < 40 || value > 200) return;
		onSaveWeight(date || todayISO(), Math.round(value * 10) / 10).then(() => { setKg(''); setOpen(false); });
	};

	return <Card>
		<CardContent className="p-4 flex items-center gap-3">
			<div
				className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
				style={{ background: soft, color }}
			>
				<Scale className="h-[18px] w-[18px]" />
			</div>
			<div className="min-w-0 flex-1">
				<div className="text-xs text-muted-foreground">Poids</div>
				<div className="text-sm font-bold mt-0.5 truncate" style={{ color }}>
					{last ? `${fr1(last.kg)} kg` : '—'}
					{lost != null && lost > 0 && <span className="text-xs font-normal text-muted-foreground ml-1">(−{fr1(lost)} kg)</span>}
				</div>
			</div>

			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<button className="flex-none text-muted-foreground hover:text-foreground" title="Ajouter une pesée">
						<Plus className="h-4 w-4" />
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-auto" align="end">
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
						<Button size="sm" onClick={add}>OK</Button>
					</div>
				</PopoverContent>
			</Popover>
		</CardContent>
	</Card>;
}
