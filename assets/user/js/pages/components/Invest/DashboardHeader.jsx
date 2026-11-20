import React from 'react';

import { TrendingUp, TrendingDown, Landmark, Layers } from 'lucide-react';

import Sanitaze from "@commonFunctions/sanitaze";

import { Card, CardContent } from "@shadcnComponents/ui/card";

import { totalValorisation, portfolioGain } from "@userPages/Invest/lib/compute";

function StatTile ({ icon: Icon, label, value, sub, color }) {
	return <Card>
		<CardContent className="p-4 flex items-center gap-3">
			<div
				className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
				style={{ background: color ? `${color}1a` : 'var(--cat-invest-soft)', color: color || 'var(--cat-invest)' }}
			>
				<Icon className="h-[18px] w-[18px]" />
			</div>
			<div className="min-w-0">
				<div className="text-xs text-muted-foreground truncate">{label}</div>
				<div className="text-lg font-bold tabular-nums" style={color ? { color } : undefined}>{value}</div>
				{sub && <div className="text-xs text-muted-foreground">{sub}</div>}
			</div>
		</CardContent>
	</Card>;
}

export function DashboardHeader ({ tracking }) {
	const { enveloppes, totalInvested } = tracking;
	const total = totalValorisation(enveloppes);
	const { linkedCount, investedSum, gain, gainPct } = portfolioGain(enveloppes, totalInvested);
	const lineCount = enveloppes.reduce((sum, e) => sum + e.lines.length, 0);
	const gainColor = gain != null ? (gain >= 0 ? 'var(--status-good)' : 'var(--status-critical)') : null;
	const GainIcon = gain != null && gain < 0 ? TrendingDown : TrendingUp;

	return <div className="grid gap-3 grid-cols-1 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
		<Card className="border" style={{ background: 'var(--cat-invest-soft)', borderColor: 'var(--cat-invest)' }}>
			<CardContent className="p-4 flex flex-col gap-1.5">
				<div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--cat-invest)' }}>
					<TrendingUp className="h-3.5 w-3.5" /> Valorisation totale
				</div>
				<div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--cat-invest)' }}>
					{Sanitaze.toFormatCurrency(total)}
				</div>
				{gain != null && (
					<div
						className="inline-flex self-start items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
						style={{ background: `${gainColor}1a`, color: gainColor }}
					>
						<GainIcon className="h-3.5 w-3.5" />
						{gain >= 0 ? '+' : ''}{Sanitaze.toFormatCurrency(gain)}
						{gainPct != null && ` (${gainPct >= 0 ? '+' : ''}${gainPct.toFixed(1).replace('.', ',')} %)`}
					</div>
				)}
			</CardContent>
		</Card>

		<StatTile icon={Landmark} label="Versé (enveloppes liées)" value={Sanitaze.toFormatCurrency(investedSum)} />
		{gain != null
			? <StatTile icon={GainIcon} label="Plus/moins-value" value={`${gain >= 0 ? '+' : ''}${Sanitaze.toFormatCurrency(gain)}`} color={gainColor} />
			: <StatTile icon={TrendingUp} label="Plus/moins-value" value="—" sub="Lie une enveloppe au Planificateur" />
		}
		<StatTile icon={Layers} label="Positions" value={lineCount} sub={`${enveloppes.length} enveloppe${enveloppes.length > 1 ? 's' : ''} · ${linkedCount} liée${linkedCount > 1 ? 's' : ''}`} />
	</div>;
}
