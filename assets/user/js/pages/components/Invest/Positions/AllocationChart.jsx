import React from 'react';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { eur } from "@userPages/Invest/lib/format";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AllocationChart ({ data }) {
	if (!data.length) return null;

	return <div className="flex flex-wrap items-center gap-4">
		<div style={{ width: 160, height: 160 }}>
			<ResponsiveContainer>
				<PieChart>
					<Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
						{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
					</Pie>
					<Tooltip formatter={(value) => eur(value)} />
				</PieChart>
			</ResponsiveContainer>
		</div>
		<div className="flex flex-col gap-1.5 text-sm">
			{data.map((row, i) => <div key={row.name} className="flex items-center gap-2">
				<span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
				<span className="font-medium">{row.name}</span>
				<span className="text-muted-foreground">{eur(row.value)} ({row.pct.toFixed(1)} %)</span>
			</div>)}
		</div>
	</div>;
}
