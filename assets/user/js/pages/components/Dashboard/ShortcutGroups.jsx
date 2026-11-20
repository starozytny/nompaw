import React from 'react';

import { ChevronRight } from 'lucide-react';

import { Card } from "@shadcnComponents/ui/card";

const GROUPS = [
	{ key: 'souvenirs', label: 'Souvenirs' },
	{ key: 'argent', label: 'Argent' },
	{ key: 'projets', label: 'Projets & sport' },
];

// Dashboard shortcuts grouped by life area, as settings-style rows (empty groups hidden for members without the role).
export function ShortcutGroups ({ items, paths }) {
	return <div className="grid gap-5 grid-cols-1 lg:grid-cols-3 items-start">
		{GROUPS.map(g => {
			const rows = items.filter(s => s.group === g.key);
			if (!rows.length) return null;
			const label = g.key === 'projets' && rows.length === 1 ? 'Projets' : g.label;

			return <section key={g.key} className="flex flex-col gap-2">
				<h2 className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
				<Card className="overflow-hidden divide-y">
					{rows.map(({ key, Icon, title, description, color, soft }) => <a
						key={key} href={paths[key]}
						className="group flex items-center gap-3 px-4 py-3 transition-colors duration-150 ease-out [@media(hover:hover)]:hover:bg-muted/60 active:bg-muted motion-reduce:transition-none"
					>
						<span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg" style={{ background: soft, color }}>
							<Icon className="h-[18px] w-[18px]" />
						</span>
						<span className="min-w-0 flex-1">
							<span className="block text-sm font-medium">{title}</span>
							<span className="block text-xs text-muted-foreground truncate">{description}</span>
						</span>
						<ChevronRight className="h-4 w-4 flex-none text-muted-foreground transition-transform duration-150 ease-out [@media(hover:hover)]:group-hover:translate-x-0.5" />
					</a>)}
				</Card>
			</section>;
		})}
	</div>;
}
