import React from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";

import { tackingToCsv, downloadFile } from "@userPages/Invest/lib/csv";
import { todayISO } from "@userPages/Invest/lib/format";

export function SauvegardeTab ({ tracking }) {
	const exportJson = () => downloadFile(JSON.stringify(tracking, null, 1), `investissements-${todayISO()}.json`, 'application/json');
	const exportCsv = () => downloadFile(tackingToCsv(tracking), `investissements-${todayISO()}.csv`, 'text/csv');

	return <Card className="p-5">
		<h3 className="font-semibold mb-1.5">Export</h3>
		<p className="text-sm text-muted-foreground mb-3">
			Garde une copie de tes données pour analyse externe, ou pour les relire dans une conversation avec Claude.
		</p>
		<div className="flex gap-2.5 flex-wrap">
			<Button type="default" iconLeft="download" onClick={exportJson}>Exporter en JSON</Button>
			<Button type="default" iconLeft="download" onClick={exportCsv}>Exporter en CSV</Button>
		</div>
	</Card>;
}
