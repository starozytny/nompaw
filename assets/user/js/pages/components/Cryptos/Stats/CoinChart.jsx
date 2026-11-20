import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import Formulaire from "@commonFunctions/formulaire";

import { Card } from "@shadcnComponents/ui/card";
import { SelectSimple } from "@shadcnComponents/elements/Select/Select";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { CoinIcon } from "@userPages/Cryptos/CoinIcon";

import { eur, eurCompact, qty, price, monthTick, dayLabel } from "@userPages/Cryptos/Stats/format";

const URL_GET_COIN = "intern_api_cryptos_stats_coin";

function CoinTooltip ({ active, payload, label, coin }) {
	if (!active || !payload?.length) return null;
	const p = payload[0].payload;

	return <div className="min-w-48 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
		<div className="mb-1.5 font-semibold text-foreground">{dayLabel(label)}</div>
		<Row label="Quantité" value={`${qty(p.quantity)} ${coin}`} />
		<Row label="Prix" value={price(p.price)} />
		<Row label="Valeur" value={eur(p.value)} strong />
		{p.bought > 0 && <Row label="Entrées la semaine" value={`+${qty(p.bought)}`} />}
		{p.sold > 0 && <Row label="Sorties la semaine" value={`−${qty(p.sold)}`} />}
	</div>
}

function Row ({ label, value, strong }) {
	return <div className="flex justify-between gap-4 py-0.5">
		<span className="text-muted-foreground">{label}</span>
		<span className={strong ? "font-semibold tabular-nums text-foreground" : "tabular-nums text-foreground"}>{value}</span>
	</div>
}

// Weeks with buys (filled) or sells (hollow) on the quantity line; >= 8px so they're hittable/visible.
function FlowDot ({ cx, cy, payload, color }) {
	if (cx === undefined || cy === undefined) return null;
	if (payload.bought > 0) return <circle cx={cx} cy={cy} r={4} fill={color} stroke="hsl(var(--card))" strokeWidth={2} />;
	if (payload.sold > 0) return <circle cx={cx} cy={cy} r={4} fill="hsl(var(--card))" stroke={color} strokeWidth={2} />;
	return null;
}

const AXIS_TICK = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' };

/** One small chart of the stack; all three share `syncId` so the crosshair moves together. */
function Panel ({ title, data, coin, dataKey, yFormat, color, kind, showX }) {
	return <div>
		<div className="mb-1 text-xs font-medium text-muted-foreground">{title}</div>
		<div style={{ width: '100%', height: showX ? 150 : 128 }}>
			<ResponsiveContainer>
				<ComposedChart data={data} syncId="crypto-coin" margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
					<CartesianGrid vertical={false} stroke="hsl(var(--border))" />
					<XAxis dataKey="date" tickFormatter={monthTick} minTickGap={40} hide={!showX} tick={AXIS_TICK} stroke="hsl(var(--border))" />
					<YAxis tickFormatter={yFormat} width={64} tick={AXIS_TICK} axisLine={false} tickLine={false} />
					<Tooltip content={<CoinTooltip coin={coin} />} cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }} />
					{kind === 'line'
						? <Line dataKey={dataKey} type="monotone" stroke={color} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
						: <Area dataKey={dataKey} type={kind === 'step' ? 'stepAfter' : 'monotone'} stroke={color} strokeWidth={2} fill={color} fillOpacity={0.15}
								isAnimationActive={false} dot={kind === 'step' ? (props) => <FlowDot key={props.index} {...props} color={color} /> : false} />
					}
				</ComposedChart>
			</ResponsiveContainer>
		</div>
	</div>
}

export function CoinChart ({ options, defaultCoin, color }) {
	const [coin, setCoin] = useState(defaultCoin);
	const [points, setPoints] = useState(null);

	useEffect(() => {
		if (!coin) return;
		setPoints(null);
		axios({ method: "GET", url: Routing.generate(URL_GET_COIN, { coin }) })
			.then(response => setPoints(response.data.points))
			.catch(error => { Formulaire.displayErrors(null, error); setPoints([]); });
	}, [coin]);

	// Start at the coin's first holding instead of the user's first-ever trade.
	const firstHeld = points ? points.findIndex(p => p.quantity > 0) : -1;
	const data = points && firstHeld > 0 ? points.slice(Math.max(0, firstHeld - 1)) : points;
	const c = color(coin);

	return <Card className="p-4">
		<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
			<div>
				<h3 className="flex items-center gap-2 text-sm font-semibold"><CoinIcon coin={coin} /> Détail d'une crypto</h3>
				<div className="text-xs text-muted-foreground">
					Quantité détenue, prix et valeur chaque semaine · <span className="inline-flex items-center gap-1"><svg width="10" height="10"><circle cx="5" cy="5" r="4" fill={c} /></svg>entrées</span> · <span className="inline-flex items-center gap-1"><svg width="10" height="10"><circle cx="5" cy="5" r="3.5" fill="none" stroke={c} strokeWidth="1.5" /></svg>sorties</span>
				</div>
			</div>
			<div className="w-44">
				<SelectSimple identifiant="coin" valeur={coin} noEmpty
							  items={options.map(o => ({ identifiant: o, value: o, label: o }))}
							  onSelect={(identifiant, value) => setCoin(value)} />
			</div>
		</div>

		{data === null
			? <LoaderElements />
			: (data.length === 0
				? <div className="p-6 text-center text-sm text-muted-foreground">Aucune donnée pour {coin}.</div>
				: <div className="flex flex-col gap-3">
					<Panel title={`Quantité détenue (${coin})`} data={data} coin={coin} dataKey="quantity" yFormat={qty} color={c} kind="step" />
					<Panel title="Prix unitaire (€)" data={data} coin={coin} dataKey="price" yFormat={price} color={c} kind="line" />
					<Panel title="Valeur détenue (€)" data={data} coin={coin} dataKey="value" yFormat={eurCompact} color={c} kind="area" showX />
				</div>)
		}
	</Card>
}

CoinChart.propTypes = {
	options: PropTypes.array.isRequired,
	defaultCoin: PropTypes.string,
	color: PropTypes.func.isRequired,
}
