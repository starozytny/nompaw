import React, { useMemo, useState } from "react";
import PropTypes from 'prop-types';

import moment from "moment/moment";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import { cn } from "@shadcnComponents/lib/utils";
import { Card } from "@shadcnComponents/ui/card";

import { eur, eurCompact, monthTick, dayLabel, colorOf, OTHER_COLOR } from "@userPages/Cryptos/Stats/format";

const OTHERS = 'Autres';
const RANGES = [
	{ value: '1y', label: '1 an', years: 1 },
	{ value: '3y', label: '3 ans', years: 3 },
	{ value: 'all', label: 'Tout', years: null },
];

function PortfolioTooltip ({ active, payload, label, coins }) {
	if (!active || !payload?.length) return null;
	const row = payload[0].payload;
	const parts = [...coins, OTHERS].map(c => ({ coin: c, value: row[c] ?? 0 })).filter(p => p.value > 0).sort((a, b) => b.value - a.value);

	return <div className="min-w-52 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
		<div className="mb-1.5 font-semibold text-foreground">{dayLabel(label)}</div>
		{parts.map(p => <div key={p.coin} className="flex items-center justify-between gap-4 py-0.5">
			<span className="flex items-center gap-1.5 text-muted-foreground">
				<span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: p.coin === OTHERS ? OTHER_COLOR : colorOf(coins, p.coin) }} />
				{p.coin}
			</span>
			<span className="tabular-nums text-foreground">{eur(p.value)}</span>
		</div>)}
		<div className="mt-1.5 flex justify-between gap-4 border-t pt-1.5 font-semibold text-foreground">
			<span>Total</span><span className="tabular-nums">{eur(row.total)}</span>
		</div>
		<div className="flex justify-between gap-4 text-muted-foreground">
			<span>Net investi</span><span className="tabular-nums">{eur(row.invested)}</span>
		</div>
	</div>
}

/**
 * Stacked value per coin over time (top coins + "Autres"), with the cumulative "Net investi" as a
 * dashed line on the SAME € axis — one scale, so the gap between them reads directly as the result.
 */
export function PortfolioChart ({ series, coins }) {
	const [range, setRange] = useState('all');

	const data = useMemo(() => {
		const years = RANGES.find(r => r.value === range).years;
		if (!years) return series;
		const from = moment().subtract(years, 'years').format('YYYY-MM-DD');
		return series.filter(p => p.date >= from);
	}, [series, range]);

	const keys = [...coins, OTHERS];

	return <Card className="p-4">
		<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h3 className="text-sm font-semibold">Valeur du portefeuille dans le temps</h3>
				<div className="text-xs text-muted-foreground">Par crypto, chaque dimanche, aux cours du jour</div>
			</div>
			<div className="inline-flex rounded-lg bg-muted p-0.5" role="group" aria-label="Période">
				{RANGES.map(r => <button key={r.value} type="button" aria-pressed={range === r.value} onClick={() => setRange(r.value)}
										 className={cn("rounded-md px-3 py-1 text-xs font-medium text-muted-foreground transition-colors",
											 range === r.value && "bg-background text-foreground shadow-sm")}>
					{r.label}
				</button>)}
			</div>
		</div>

		<div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
			{keys.map(k => <span key={k} className="inline-flex items-center gap-1.5">
				<span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: k === OTHERS ? OTHER_COLOR : colorOf(coins, k) }} />{k}
			</span>)}
			<span className="inline-flex items-center gap-1.5">
				<span className="inline-block w-4 border-t-2 border-dashed border-foreground" />Net investi
			</span>
		</div>

		<div style={{ width: '100%', height: 340 }}>
			<ResponsiveContainer>
				<ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
					<CartesianGrid vertical={false} stroke="hsl(var(--border))" />
					<XAxis dataKey="date" tickFormatter={monthTick} minTickGap={40} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} stroke="hsl(var(--border))" />
					<YAxis tickFormatter={eurCompact} width={64} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
					<Tooltip content={<PortfolioTooltip coins={coins} />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }} />
					{keys.map(k => <Area key={k} dataKey={k} stackId="v" type="monotone" isAnimationActive={false}
										 fill={k === OTHERS ? OTHER_COLOR : colorOf(coins, k)} fillOpacity={0.85}
										 stroke="hsl(var(--card))" strokeWidth={1} />)}
					<Line dataKey="invested" type="stepAfter" dot={false} isAnimationActive={false}
						  stroke="hsl(var(--foreground))" strokeWidth={2} strokeDasharray="5 4" />
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	</Card>
}

PortfolioChart.propTypes = {
	series: PropTypes.array.isRequired,
	coins: PropTypes.array.isRequired,
}
