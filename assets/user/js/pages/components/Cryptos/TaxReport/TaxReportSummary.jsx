import React from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";
import { Card, CardContent } from "@shadcnComponents/ui/card";

export function TaxReportSummary ({ year, totalPlusValue }) {
	let isNeg = totalPlusValue < 0;

	return <Card className="overflow-hidden">
		<CardContent className="flex items-center gap-4 p-4">
			<div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
				 style={{ background: 'var(--cat-crypto-soft)', color: 'var(--cat-crypto)' }}>
				<span className="icon-calculator text-lg" />
			</div>
			<div className="flex flex-1 items-center justify-between gap-3">
				<div>
					<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total plus-value {year}</div>
					<div className="text-xs text-muted-foreground">Somme des cessions calculables de l'année</div>
				</div>
				<span className={"text-2xl font-bold tabular-nums " + (isNeg ? "text-[var(--status-critical)]" : "")}>
					{Sanitaze.toFormatCurrency(totalPlusValue)}
				</span>
			</div>
		</CardContent>
	</Card>
}

TaxReportSummary.propTypes = {
	year: PropTypes.number.isRequired,
	totalPlusValue: PropTypes.number.isRequired,
}
