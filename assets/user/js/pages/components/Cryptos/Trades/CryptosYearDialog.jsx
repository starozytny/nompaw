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
					Aucune activité crypto sur cette année.
				</div>
				: <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
					{holdings.map(h => <div key={h.coin} className="flex flex-col gap-1.5 rounded-lg border p-2.5">
						<div className="flex items-center gap-2">
							<CoinIcon coin={h.coin} size={22} />
							<Badge type="indigo">{h.coin}</Badge>
							<span className="ml-auto text-xs text-muted-foreground">Détenu</span>
							<span className="text-sm font-semibold tabular-nums">{h.quantity}</span>
						</div>
						<div className="flex flex-col justify-end gap-y-1 text-right border-t pt-2.5 text-xs text-muted-foreground">
							<div>Acheté ({h.achatCount}) : <b className="tabular-nums text-foreground">{Sanitaze.toFormatCurrency(h.achatTotal)}</b> / <b className="tabular-nums text-foreground">{h.achatQty}</b></div>
							<div>Vendu ({h.venteCount}) : <b className="tabular-nums text-foreground">{Sanitaze.toFormatCurrency(h.venteTotal)}</b> / <b className="tabular-nums text-foreground">{h.venteQty}</b></div>
						</div>
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
