import React from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";
import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Badge } from "@tailwindComponents/Elements/Badge";

export function TaxReportSummary ({ year, totalPlusValue, totalCessionPrice, isExempt, exemptionThreshold, declarationLine, flatTaxRate, estimatedFlatTax }) {
	let isNeg = totalPlusValue < 0;

	return <Card className="overflow-hidden">
		<CardContent className="flex flex-col gap-4 p-4">
			<div className="flex items-center gap-4">
				<div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
					 style={{ background: 'var(--cat-crypto-soft)', color: 'var(--cat-crypto)' }}>
					<span className="icon-calculator text-lg" />
				</div>
				<div className="flex flex-1 items-center justify-between gap-3">
					<div>
						<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total plus-value {year}</div>
						<div className="text-xs text-muted-foreground">Somme des cessions calculables de l'année — à reporter en case {declarationLine} de la 2042 C</div>
					</div>
					<span className={"text-2xl font-bold tabular-nums " + (isNeg ? "text-[var(--status-critical)]" : "")}>
						{Sanitaze.toFormatCurrency(totalPlusValue)}
					</span>
				</div>
			</div>

			<div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-3 text-xs">
				<div className="flex items-center gap-1.5">
					<span className="text-muted-foreground">Total des prix de cession :</span>
					<span className="font-semibold tabular-nums">{Sanitaze.toFormatCurrency(totalCessionPrice)}</span>
				</div>
				{isExempt
					? <Badge type="green">Exonéré — cessions ≤ {exemptionThreshold} €</Badge>
					: <>
						<div className="flex items-center gap-1.5">
							<span className="text-muted-foreground">Flat tax estimée ({(flatTaxRate * 100).toFixed(1)} %) :</span>
							<span className="font-semibold tabular-nums">{Sanitaze.toFormatCurrency(estimatedFlatTax)}</span>
						</div>
						<span className="text-[11px] text-muted-foreground">hors option barème progressif (case 3CN)</span>
					</>
				}
			</div>
		</CardContent>
	</Card>
}

TaxReportSummary.propTypes = {
	year: PropTypes.number.isRequired,
	totalPlusValue: PropTypes.number.isRequired,
	totalCessionPrice: PropTypes.number.isRequired,
	isExempt: PropTypes.bool.isRequired,
	exemptionThreshold: PropTypes.number.isRequired,
	declarationLine: PropTypes.string.isRequired,
	flatTaxRate: PropTypes.number.isRequired,
	estimatedFlatTax: PropTypes.number.isRequired,
}
