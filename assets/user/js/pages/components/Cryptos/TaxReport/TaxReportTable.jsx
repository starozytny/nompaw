import React from "react";
import PropTypes from 'prop-types';

import { Card } from "@shadcnComponents/ui/card";
import { TaxReportRow } from "@userPages/Cryptos/TaxReport/TaxReportRow";

export function TaxReportTable ({ lines, onLineUpdate }) {
	if (lines.length === 0) {
		return <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
			<span className="icon-receipt text-2xl text-muted-foreground" />
			<div className="text-sm font-medium">Aucune vente trouvée pour cette année</div>
			<div className="text-xs text-muted-foreground">Les cessions imposables apparaîtront ici dès qu'une vente sera enregistrée sur cette période.</div>
		</Card>
	}

	return <Card className="overflow-hidden">
		<div className="overflow-x-auto">
			<table className="w-full min-w-[680px]">
				<thead>
					<tr className="border-b bg-[var(--cat-crypto-soft)] text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cat-crypto)' }}>
						<th className="py-2.5 pl-4 pr-3">Date</th>
						<th className="py-2.5 pr-3">Cédé</th>
						<th className="py-2.5 pr-3">Prix de cession</th>
						<th className="py-2.5 pr-3">Coût acquis. cumulé</th>
						<th className="py-2.5 pr-3">Valeur portefeuille</th>
						<th className="py-2.5 pr-4">Plus-value</th>
					</tr>
				</thead>
				<tbody>
					{lines.map(line => <TaxReportRow key={line.id} line={line} onLineUpdate={onLineUpdate} />)}
				</tbody>
			</table>
		</div>
	</Card>
}

TaxReportTable.propTypes = {
	lines: PropTypes.array.isRequired,
	onLineUpdate: PropTypes.func.isRequired,
}
