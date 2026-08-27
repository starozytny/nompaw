import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";
import { Badge } from "@tailwindComponents/Elements/Badge";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@shadcnComponents/ui/dialog";

const URL_HOLDINGS = "intern_api_cryptos_tax_report_holdings";
const URL_PRICES = "intern_api_cryptos_tax_report_prices";

/**
 * Lets the user fill in a EUR unit price for each coin they actually held right before one disposal,
 * instead of a single opaque portfolio total — saved onto that disposal (CrTrade.manualCoinPrices) via
 * the /prices endpoint, scoped to this one cession, so two disposals on the same date are valued from
 * their own entered prices and no longer depend on CoinGecko having that historical price.
 */
export function TaxReportPriceDialog ({ open, onOpenChange, line, onReportUpdate }) {
	const [coins, setCoins] = useState(null);
	const [values, setValues] = useState({});
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!open || !line) return;

		setLoading(true);
		setCoins(null);

		axios({ method: "GET", url: Routing.generate(URL_HOLDINGS, { id: line.id }), data: {} })
			.then(function (response) {
				let list = response.data.coins;
				setCoins(list);
				let initial = {};
				list.forEach(c => { initial[c.coin] = c.price !== null ? String(c.price) : ''; });
				setValues(initial);
				setLoading(false);
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setLoading(false);
			})
		;
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, line]);

	const handleChange = (coin) => (e) => {
		setValues(prev => ({ ...prev, [coin]: e.target.value }));
	}

	const handleSubmit = (e) => {
		e.preventDefault();
		if (saving || !coins) return;

		let prices = {};
		for (const c of coins) {
			let raw = values[c.coin];
			if (raw === undefined || raw === '') continue;
			let parsed = parseFloat(raw);
			if (isNaN(parsed) || parsed <= 0) continue;
			prices[c.coin] = parsed;
		}

		if (Object.keys(prices).length === 0) return;

		setSaving(true);
		axios({ method: "PUT", url: Routing.generate(URL_PRICES, { id: line.id }), data: { prices: prices } })
			.then(function (response) {
				onReportUpdate(response.data);
				setSaving(false);
				onOpenChange(false);
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setSaving(false);
			})
		;
	}

	return <Dialog open={open} onOpenChange={onOpenChange}>
		<DialogContent>
			{line && <>
				<DialogHeader>
					<DialogTitle>Prix des actifs détenus au {Sanitaze.toFormatDate(line.tradeAt, 'L')} <span className="text-xs text-muted-foreground">{Sanitaze.toFormatDate(line.tradeAt + ' ' + line.tradeTime, 'H[h]mm')}</span></DialogTitle>
				</DialogHeader>

				<p className="text-sm text-muted-foreground">
					Renseigne le prix unitaire (€) de chaque actif que tu détenais juste avant cette cession.
					Ces prix sont propres à cette cession : une autre cession à la même date garde ses propres
					valeurs et n'est pas modifiée.
				</p>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					{loading
						? <LoaderElements />
						: (!coins || coins.length === 0)
							? <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
								Aucun actif détenu à cette date.
							</div>
							: <div className="flex flex-col gap-2 max-h-[50vh] overflow-y-auto pr-1">
								{coins.map(c => {
									let value = values[c.coin] ?? '';
									let parsed = parseFloat(value);
									let estimated = !isNaN(parsed) ? parsed * c.quantity : null;

									return <div key={c.coin} className="flex items-center gap-2 rounded-lg border p-2.5">
										<div className="flex min-w-0 flex-1 items-center gap-2">
											<Badge type="indigo">{c.coin}</Badge>
											<span className="truncate text-xs text-muted-foreground tabular-nums">{c.quantity}</span>
										</div>
										<div className="w-32">
											<Input type="number" identifiant={`price-${c.coin}`} valeur={value} errors={[]}
												   placeholder={c.price !== null ? String(c.price) : '0.00'}
												   onChange={handleChange(c.coin)} />
										</div>
										<span className="w-24 flex-none text-right text-xs text-muted-foreground tabular-nums">
											{estimated !== null ? Sanitaze.toFormatCurrency(estimated) : '—'}
										</span>
									</div>
								})}
							</div>
					}
				</form>

				<DialogFooter>
					<Button type="default" onClick={() => onOpenChange(false)}>Annuler</Button>
					<Button type="blue" onClick={handleSubmit} iconLeft={saving ? "chart-3" : ""}>Enregistrer les prix</Button>
				</DialogFooter>
			</>}
		</DialogContent>
	</Dialog>
}

TaxReportPriceDialog.propTypes = {
	open: PropTypes.bool.isRequired,
	onOpenChange: PropTypes.func.isRequired,
	line: PropTypes.object,
	onReportUpdate: PropTypes.func.isRequired,
}
