import React from 'react';

import { Card, CardContent } from "@shadcnComponents/ui/card";

/**
 * Same icon-badge KPI tile shape used in the Running and Investissements headers — kept local here
 * since Dashboard isn't a sibling of either, but intentionally matching their look. Always reserves
 * the `sub` line (even when a given tile has none) so every tile in the row has equal height.
 */
export function StatCard ({ label, value, sub, Icon, color, soft, href }) {
	const content = <CardContent className="p-4 flex items-center gap-3 h-full">
		<div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg" style={{ background: soft, color }}>
			<Icon className="h-5 w-5" />
		</div>
		<div className="min-w-0">
			<div className="text-xs text-muted-foreground">{label}</div>
			<div className="text-lg font-bold mt-0.5 truncate" style={{ color }}>{value}</div>
			<div className="text-xs text-muted-foreground truncate">{sub || ' '}</div>
		</div>
	</CardContent>;

	if (href) {
		return <a href={href} className="h-full block"><Card className="h-full transition-shadow hover:shadow-md">{content}</Card></a>;
	}
	return <Card className="h-full">{content}</Card>;
}
