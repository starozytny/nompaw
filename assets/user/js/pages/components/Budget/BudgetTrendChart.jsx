import React, { useMemo, useRef, useState } from 'react';

import Sanitaze from "@commonFunctions/sanitaze";
import { cn } from "@shadcnComponents/lib/utils";

const MONTH_NAMES = [
	'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
	'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

const W = 640;
const H = 128;
const PAD = 6;

export function BudgetTrendChart ({ balances, activeMonth, onSelectMonth, todayValue }) {
	const wrapRef = useRef(null);
	const [hover, setHover] = useState(null);

	const geometry = useMemo(() => {
		const min = Math.min(...balances, 0);
		const max = Math.max(...balances, 0);
		const span = (max - min) || 1;
		const x = (i) => PAD + (i / (balances.length - 1)) * (W - PAD * 2);
		const y = (v) => PAD + (1 - (v - min) / span) * (H - PAD * 2);

		const points = balances.map((v, i) => [x(i), y(v)]);
		const linePath = points.map(([px, py], i) => (i === 0 ? 'M' : 'L') + px.toFixed(1) + ' ' + py.toFixed(1)).join(' ');
		const areaPath = linePath
			+ ' L' + points[points.length - 1][0].toFixed(1) + ' ' + y(0).toFixed(1)
			+ ' L' + points[0][0].toFixed(1) + ' ' + y(0).toFixed(1) + ' Z';

		return { min, max, points, linePath, areaPath, zeroY: y(0) };
	}, [balances]);

	const isHovering = hover !== null;
	const shown = isHovering ? hover : activeMonth - 1;
	const shownValue = balances[shown];

	const showTooltip = (i, evt) => {
		if (!wrapRef.current) return;
		const wrapRect = wrapRef.current.getBoundingClientRect();
		const svgRect = evt.currentTarget.ownerSVGElement.getBoundingClientRect();
		const [px, py] = geometry.points[i];
		setHover(i);
		wrapRef.current.style.setProperty('--tt-x', (svgRect.left - wrapRect.left + (px / W) * svgRect.width) + 'px');
		wrapRef.current.style.setProperty('--tt-y', (svgRect.top - wrapRect.top + (py / H) * svgRect.height) + 'px');
	};

	return <div className="flex flex-col gap-1">
		<div>
			<div className={cn('text-2xl font-bold tabular-nums', shownValue < 0 ? 'text-[var(--status-critical)]' : 'text-[var(--status-good)]')}>
				{Sanitaze.toFormatCurrency(shownValue)}
			</div>
			<div className="text-xs text-muted-foreground">
				{MONTH_NAMES[shown]}
				{!isHovering && todayValue !== undefined && (
					<> · Aujourd'hui <b className="text-foreground tabular-nums">{Sanitaze.toFormatCurrency(todayValue)}</b></>
				)}
			</div>
		</div>

		<div ref={wrapRef} className="relative mt-1">
			<svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block w-full h-32 overflow-visible" role="img" aria-label="Évolution du solde disponible sur 12 mois">
				<defs>
					<linearGradient id="budgetTrendFill" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor="hsl(var(--foreground))" stopOpacity="0.14" />
						<stop offset="100%" stopColor="hsl(var(--foreground))" stopOpacity="0" />
					</linearGradient>
				</defs>

				{[geometry.max, geometry.min].filter(v => v !== 0).map((v, i) => {
					const min = geometry.min, max = geometry.max, span = (max - min) || 1;
					const gy = PAD + (1 - (v - min) / span) * (H - PAD * 2);
					return <line key={i} x1={0} x2={W} y1={gy} y2={gy} stroke="hsl(var(--border))" strokeWidth={1} />;
				})}

				<path d={geometry.areaPath} fill="url(#budgetTrendFill)" />
				<line x1={0} x2={W} y1={geometry.zeroY} y2={geometry.zeroY} stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="3 3" opacity={0.6} />
				<path d={geometry.linePath} fill="none" stroke="hsl(var(--foreground))" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

				{geometry.points.map(([px, py], i) => (
					<g key={i}>
						<circle
							cx={px} cy={py} r={i === shown ? 5 : 3.5}
							fill="hsl(var(--card))" stroke="hsl(var(--foreground))" strokeWidth={2}
						/>
						<circle
							cx={px} cy={py} r={12} fill="transparent" className="cursor-pointer" tabIndex={0}
							aria-label={`${MONTH_NAMES[i]} : ${Sanitaze.toFormatCurrency(balances[i])}`}
							onMouseEnter={(e) => showTooltip(i, e)}
							onMouseLeave={() => setHover(null)}
							onFocus={(e) => showTooltip(i, e)}
							onBlur={() => setHover(null)}
							onClick={() => onSelectMonth(i + 1)}
						/>
					</g>
				))}
			</svg>

			{hover !== null && (
				<div
					className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md"
					style={{ left: 'var(--tt-x)', top: 'calc(var(--tt-y) - 8px)' }}
				>
					{MONTH_NAMES[hover]} · <b className="tabular-nums">{Sanitaze.toFormatCurrency(balances[hover])}</b>
				</div>
			)}
		</div>
	</div>;
}
