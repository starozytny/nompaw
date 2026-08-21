import React, { useState } from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";
import { Button } from "@tailwindComponents/Elements/Button";
import { Badge } from "@tailwindComponents/Elements/Badge";
import { TaxReportPriceDialog } from "@userPages/Cryptos/TaxReport/TaxReportPriceDialog";

export function TaxReportRow ({ line, onReportUpdate }) {
	const [dialogOpen, setDialogOpen] = useState(false);

	let missing = line.portfolioValue === null;

	return <tr className="border-t hover:bg-muted/40">
		<td className="py-2.5 pl-4 pr-3 text-sm">{Sanitaze.toFormatDate(line.tradeAt, 'L')}</td>
		<td className="py-2.5 pr-3 text-sm">
			<span className="tabular-nums">{line.fromNbToken}</span>{' '}
			<Badge type="indigo">{line.fromCoin}</Badge>
		</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums">{Sanitaze.toFormatCurrency(line.cessionPrice)}</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums text-muted-foreground">{Sanitaze.toFormatCurrency(line.grossAcquisitionCost)}</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums text-muted-foreground">{Sanitaze.toFormatCurrency(line.acquisitionFractionsConsumed)}</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums">{Sanitaze.toFormatCurrency(line.netAcquisitionCost)}</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums">
			{missing
				? <Button type="yellow" pa="py-1 px-2.5" onClick={() => setDialogOpen(true)}>Renseigner les prix</Button>
				: <div className="flex items-center gap-1.5">
					<span>{Sanitaze.toFormatCurrency(line.portfolioValue)}</span>
					<Badge type={line.portfolioValueSource === 'manual' ? 'gray' : 'indigo'}>
						{line.portfolioValueSource === 'manual' ? 'manuel' : 'auto'}
					</Badge>
					<button type="button" className="icon-pencil text-xs text-muted-foreground hover:text-foreground"
							title="Corriger les prix par actif" onClick={() => setDialogOpen(true)} />
				</div>
			}
		</td>
		<td className="py-2.5 pr-4 text-sm font-semibold tabular-nums">
			{line.plusValue === null
				? <span className="text-xs font-normal text-muted-foreground">Non calculable</span>
				: <span className="inline-flex items-center rounded-full px-2 py-1 text-xs"
						style={{
							background: line.plusValue < 0 ? 'var(--status-critical-soft)' : 'var(--status-good-soft)',
							color: line.plusValue < 0 ? 'var(--status-critical)' : 'var(--status-good)',
						}}>
					{Sanitaze.toFormatCurrency(line.plusValue)}
				</span>
			}
		</td>

		<TaxReportPriceDialog open={dialogOpen} onOpenChange={setDialogOpen} line={line} onReportUpdate={onReportUpdate} />
	</tr>
}

TaxReportRow.propTypes = {
	line: PropTypes.object.isRequired,
	onReportUpdate: PropTypes.func.isRequired,
}
