import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

/**
 * Small building blocks used by the modules in Formation/modules/ to transcribe the Markdown lessons
 * of docs/formation/ (tables, callouts, key figures).
 */

export function DataTable ({ columns, rows, align = [] }) {
	return <Card className="overflow-hidden my-1">
		<div className="overflow-x-auto">
			<table className="w-full text-sm">
				<thead>
					<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
						{columns.map((c, i) => <th key={i} className={`px-4 py-2.5 font-semibold ${align[i] === 'right' ? 'text-right' : 'text-left'}`}>{c}</th>)}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, r) => <tr key={r} className="border-t">
						{row.map((cell, i) => <td key={i} className={`px-4 py-2.5 ${i > 0 ? 'text-muted-foreground' : ''} ${align[i] === 'right' ? 'text-right tabular-nums whitespace-nowrap' : ''}`}>{cell}</td>)}
					</tr>)}
				</tbody>
			</table>
		</div>
	</Card>;
}

export function Callout ({ children, tone = 'muted' }) {
	const tones = {
		muted: 'bg-muted/40 border-border',
		warning: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200',
	};
	return <div className={`text-sm rounded-md border px-3.5 py-2.5 ${tones[tone]}`}>{children}</div>;
}

export function Figures ({ items }) {
	return <ul className="flex flex-col gap-1.5 text-sm">
		{items.map((it, i) => <li key={i} className="flex gap-2">
			<span className="text-muted-foreground select-none">•</span>
			<span>{it}</span>
		</li>)}
	</ul>;
}
