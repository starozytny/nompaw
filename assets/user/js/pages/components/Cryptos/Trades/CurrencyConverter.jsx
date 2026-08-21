import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Input } from "@tailwindComponents/Elements/Fields";

const URL_FX_RATE = "intern_api_cryptos_fx_rate_index";

/**
 * Small helper to translate a USD (or any currency) amount into its EUR equivalent at the transaction's
 * own date, via Frankfurter/ECB historical rates (CrFxRateService) — a manual aid for filling in the
 * form's EUR fields correctly, not wired into any calculation itself.
 */
export function CurrencyConverter ({ date }) {
	const [open, setOpen] = useState(false);
	const [from, setFrom] = useState('USD');
	const [to, setTo] = useState('EUR');
	const [amountFrom, setAmountFrom] = useState('');
	const [amountTo, setAmountTo] = useState('');
	const [rateDate, setRateDate] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const day = date ? date.split('T')[0] : null;

	useEffect(() => {
		if (!open || !day || amountFrom === '' || isNaN(parseFloat(amountFrom))) {
			setAmountTo('');
			setError(null);
			return;
		}

		let cancelled = false;
		setLoading(true);

		const timeout = setTimeout(() => {
			axios({ method: "GET", url: Routing.generate(URL_FX_RATE), params: { from, to, amount: parseFloat(amountFrom), date: day } })
				.then(function (response) {
					if (cancelled) return;
					setAmountTo(String(response.data.amount));
					setRateDate(response.data.rateDate);
					setError(null);
					setLoading(false);
				})
				.catch(function () {
					if (cancelled) return;
					setError("Taux introuvable pour cette date.");
					setLoading(false);
				})
			;
		}, 500);

		return () => { cancelled = true; clearTimeout(timeout); }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, day, from, to, amountFrom]);

	const handleSwap = () => {
		setFrom(to);
		setTo(from);
		setAmountFrom(amountTo);
		setAmountTo('');
	}

	if (!open) {
		return <button type="button" className="text-[11px] font-medium text-[var(--cat-crypto)] hover:underline"
					   onClick={() => setOpen(true)}>
			Convertisseur {from} ⇄ {to}
		</button>
	}

	return <div className="rounded-lg border border-dashed p-3">
		<div className="mb-2 flex items-center justify-between gap-2">
			<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Convertisseur {from} ⇄ {to}</div>
			<button type="button" className="text-[11px] text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Fermer</button>
		</div>

		{!day
			? <p className="text-xs text-muted-foreground">Renseigne d'abord la date de la transaction.</p>
			: <>
				<div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
					<Input type="number" identifiant="fx-amount-from" valeur={amountFrom} errors={[]}
						   onChange={(e) => setAmountFrom(e.target.value)} placeholder="0.00">
						{from}
					</Input>
					<button type="button" className="icon-shuffle mb-2.5 text-muted-foreground hover:text-foreground" title="Inverser" onClick={handleSwap} />
					<Input type="number" identifiant="fx-amount-to" valeur={amountTo} errors={[]}
						   onChange={() => {}} disabled placeholder="0.00">
						{to}
					</Input>
				</div>
				<div className="mt-1.5 text-[10px] text-muted-foreground">
					{loading
						? "Calcul en cours…"
						: error
							? error
							: rateDate
								? `Taux BCE du ${rateDate}${rateDate !== day ? " (dernier jour ouvré avant le " + day + ")" : ""} — copie la valeur dans le champ du formulaire.`
								: "Saisis un montant pour convertir."
					}
				</div>
			</>
		}
	</div>
}

CurrencyConverter.propTypes = {
	date: PropTypes.string,
}
