import React from 'react';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import { Card } from "@shadcnComponents/ui/card";

import { evolutionSeries } from "@userPages/Invest/lib/compute";
import { eur, dateFr } from "@userPages/Invest/lib/format";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function EvolutionTab ({ tracking }) {
	const { enveloppes } = tracking;
	const series = evolutionSeries(enveloppes);

	if (series.length < 2) {
		return <Card className="p-5 text-sm text-muted-foreground">
			Pas encore assez d'historique : enregistre la valeur de tes lignes à quelques dates différentes
			(onglet Positions) pour voir ici l'évolution de ta valorisation dans le temps.
		</Card>;
	}

	return <Card className="p-5">
		<h3 className="font-semibold mb-3">Valorisation dans le temps</h3>
		<div style={{ width: '100%', height: 320 }}>
			<ResponsiveContainer>
				<AreaChart data={series}>
					<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
					<XAxis dataKey="date" tickFormatter={dateFr} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
					<YAxis tickFormatter={(v) => eur(v)} tick={{ fontSize: 11 }} width={90} stroke="hsl(var(--muted-foreground))" />
					<Tooltip labelFormatter={dateFr} formatter={(value) => eur(value)} />
					<Legend />
					{enveloppes.map((e, i) => <Area
						key={e.id} type="monotone" dataKey={e.name} stackId="1"
						stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.5}
					/>)}
				</AreaChart>
			</ResponsiveContainer>
		</div>
	</Card>;
}
