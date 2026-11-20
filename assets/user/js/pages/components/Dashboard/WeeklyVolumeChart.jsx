import React from 'react';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { WEEKS } from "@userPages/Running/Plan/weeks";
import { weekStats } from "@userPages/Running/Suivi/lib/stats";
import { todayISO } from "@userPages/Running/Suivi/lib/format";

/**
 * Last 6 started weeks, planned vs actually run km — the dashboard's "is the running plan on track"
 * glance, using the same weekStats() the Running module's own KPIs are built from.
 */
export function WeeklyVolumeChart ({ log }) {
	const today = todayISO();
	const started = WEEKS.filter(w => w.iso0 <= today).slice(-6);
	const data = started.map(w => {
		const s = weekStats(w, log);
		return { week: `S${w.n}`, prevu: s.plannedKm, realise: Math.round(s.km * 10) / 10 };
	});

	if (data.length < 2) return null;

	return <div style={{ width: '100%', height: 200 }}>
		<ResponsiveContainer>
			<BarChart data={data} barGap={2}>
				<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
				<XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
				<YAxis tick={{ fontSize: 11 }} width={30} stroke="hsl(var(--muted-foreground))" />
				<Tooltip formatter={(v) => `${v} km`} />
				<Legend wrapperStyle={{ fontSize: 11 }} />
				<Bar dataKey="prevu" name="Prévu" fill="hsl(var(--muted-foreground) / 0.3)" radius={[3, 3, 0, 0]} />
				<Bar dataKey="realise" name="Réalisé" fill="hsl(var(--chart-4))" radius={[3, 3, 0, 0]} />
			</BarChart>
		</ResponsiveContainer>
	</div>;
}
