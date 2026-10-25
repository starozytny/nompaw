import React from 'react';

const TYPE_LABELS = ['Dépenses', 'Revenus', 'Économies'];
const TYPE_ICONS = ['minus', 'add', 'time'];
const TYPE_COLOR = ['var(--cat-expense)', 'var(--cat-income)', 'var(--cat-saving)'];
const TYPE_SOFT = ['var(--cat-expense-soft)', 'var(--cat-income-soft)', 'var(--cat-saving-soft)'];

// Groups items by their `type` (0 Dépense / 1 Revenu / 2 Économie) into three columns,
// stacked on mobile and side by side from the md breakpoint up.
export function TypeColumns ({ items, renderItem, emptyLabel = "Aucun élément de ce type." }) {
	let byType = [[], [], []];
	items.forEach(elem => { if (byType[elem.type]) byType[elem.type].push(elem); });

	return <div className="grid grid-cols-1 divide-y md:grid-cols-3 md:divide-y-0 md:divide-x divide-border">
		{byType.map((columnItems, type) => (
			<div key={type} className="flex min-w-0 flex-col">
				<div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2.5">
					<span className="flex h-6 w-6 flex-none items-center justify-center rounded-md" style={{ background: TYPE_SOFT[type], color: TYPE_COLOR[type] }}>
						<span className={`icon-${TYPE_ICONS[type]} text-xs`}></span>
					</span>
					<span className="text-sm font-semibold">{TYPE_LABELS[type]}</span>
					<span className="text-xs text-muted-foreground">({columnItems.length})</span>
				</div>
				<div className="flex flex-col">
					{columnItems.length === 0
						? <div className="px-3 py-6 text-center text-xs text-muted-foreground">{emptyLabel}</div>
						: columnItems.map(renderItem)
					}
				</div>
			</div>
		))}
	</div>
}
