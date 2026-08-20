import React, { useState } from "react";
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import { Input } from "@tailwindComponents/Elements/Fields";
import { Badge } from "@tailwindComponents/Elements/Badge";

const URL_OVERRIDE = "intern_api_cryptos_tax_report_override";

export function TaxReportRow ({ line, onLineUpdate }) {
	const [value, setValue] = useState("");
	const [saving, setSaving] = useState(false);

	let missing = line.portfolioValue === null;

	const handleSave = () => {
		if (value === "" || saving) return;

		setSaving(true);
		axios({ method: "PUT", url: Routing.generate(URL_OVERRIDE, { id: line.id }), data: { portfolioValueTotal: parseFloat(value) } })
			.then(function (response) {
				onLineUpdate(response.data);
				setSaving(false);
				setValue("");
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setSaving(false);
			})
		;
	}

	return <tr className="border-t hover:bg-muted/40">
		<td className="py-2.5 pl-4 pr-3 text-sm">{Sanitaze.toFormatDate(line.tradeAt, 'L')}</td>
		<td className="py-2.5 pr-3 text-sm">
			<span className="tabular-nums">{line.fromNbToken}</span>{' '}
			<Badge type="indigo">{line.fromCoin}</Badge>
		</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums">{Sanitaze.toFormatCurrency(line.cessionPrice)}</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums text-muted-foreground">{Sanitaze.toFormatCurrency(line.cumulativeAcquisitionCost)}</td>
		<td className="py-2.5 pr-3 text-sm tabular-nums">
			{missing
				? <div className="flex items-center gap-1.5">
					<div className="w-28">
						<Input type="number" identifiant={`portfolio-value-${line.id}`} valeur={value}
							   placeholder="Valeur €" disabled={saving}
							   onChange={(e) => setValue(e.target.value)}
							   onBlur={handleSave} />
					</div>
					<span className="text-[10px] font-medium text-[var(--status-critical)]">({line.missingCoins.join(', ')})</span>
				</div>
				: <div className="flex items-center gap-1.5">
					<span>{Sanitaze.toFormatCurrency(line.portfolioValue)}</span>
					<Badge type={line.portfolioValueSource === 'manual' ? 'gray' : 'indigo'}>
						{line.portfolioValueSource === 'manual' ? 'manuel' : 'auto'}
					</Badge>
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
	</tr>
}

TaxReportRow.propTypes = {
	line: PropTypes.object.isRequired,
	onLineUpdate: PropTypes.func.isRequired,
}
