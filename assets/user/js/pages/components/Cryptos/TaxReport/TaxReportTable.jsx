import React from "react";
import PropTypes from 'prop-types';

import { Card } from "@shadcnComponents/ui/card";
import { TaxReportRow } from "@userPages/Cryptos/TaxReport/TaxReportRow";

export function TaxReportTable ({ lines, onReportUpdate }) {
	if (lines.length === 0) {
		return <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
			<span className="icon-receipt text-2xl text-muted-foreground" />
			<div className="text-sm font-medium">Aucune vente trouvée pour cette année</div>
			<div className="text-xs text-muted-foreground">Les cessions imposables apparaîtront ici dès qu'une vente sera enregistrée sur cette période.</div>
		</Card>
	}

	const LineRef = ({ children }) => <span className="block text-[9px] font-normal normal-case tracking-normal text-muted-foreground/70">{children}</span>

	return <Card className="overflow-hidden">
		<div className="overflow-x-auto">
			<table className="w-full min-w-[900px]">
				<thead>
					<tr className="border-b bg-[var(--cat-crypto-soft)] text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cat-crypto)' }}>
						<th className="py-2.5 pl-4 pr-3">Date<LineRef>2086 l.211</LineRef></th>
						<th className="py-2.5 pr-3">Cédé</th>
						<th className="py-2.5 pr-3">Prix de cession<LineRef>l.213/218</LineRef></th>
						<th className="py-2.5 pr-3">Acquis. brut<LineRef>l.220</LineRef></th>
						<th className="py-2.5 pr-3">Fractions conso.<LineRef>l.221</LineRef></th>
						<th className="py-2.5 pr-3">Acquis. net<LineRef>l.223</LineRef></th>
						<th className="py-2.5 pr-3">Valeur portefeuille<LineRef>l.212</LineRef></th>
						<th className="py-2.5 pr-4">Plus-value</th>
					</tr>
				</thead>
				<tbody>
					{lines.map(line => <TaxReportRow key={line.id} line={line} onReportUpdate={onReportUpdate} />)}
				</tbody>
			</table>
		</div>
	</Card>
}

TaxReportTable.propTypes = {
	lines: PropTypes.array.isRequired,
	onReportUpdate: PropTypes.func.isRequired,
}
