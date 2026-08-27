import React from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";
import { Badge } from "@tailwindComponents/Elements/Badge";
import { CoinIcon } from "@userPages/Cryptos/CoinIcon";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@shadcnComponents/ui/dialog";

/**
 * Read-only breakdown of what was still held on 31/12 of the selected year (see TradeController::
 * holdingsYear(), a computeHoldingsAsOf() snapshot) — opened from TradesList's "Cryptos" stat card.
 */
export function CryptosYearDialog ({ open, onOpenChange, year, holdings }) {
	return <Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Cryptos détenues au 31/12/{year}</DialogTitle>
			</DialogHeader>

			{holdings.length === 0
				? <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
					Aucune crypto détenue à cette date.
				</div>
				: <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
					{holdings.map(h => <div key={h.coin} className="flex items-center gap-2 rounded-lg border p-2.5">
						<CoinIcon coin={h.coin} size={22} />
						<Badge type="indigo">{h.coin}</Badge>
						<span className="ml-auto text-sm font-semibold tabular-nums">{h.quantity}</span>
					</div>)}
				</div>
			}
		</DialogContent>
	</Dialog>
}

CryptosYearDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	onOpenChange: PropTypes.func.isRequired,
	year: PropTypes.number,
	holdings: PropTypes.array.isRequired,
}
