import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Toastr from "@tailwindFunctions/toastr";

import { Button } from "@tailwindComponents/Elements/Button";
import { Input } from "@tailwindComponents/Elements/Fields";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcnComponents/ui/sheet";
import { CurrencyConverter } from "@userPages/Cryptos/Trades/CurrencyConverter";

const DEPOT = 2;
const TRANSFERT = 6;

const URL_CREATE_ELEMENT = "intern_api_cryptos_trades_create";
const URL_UPDATE_ELEMENT = "intern_api_cryptos_trades_update";
const URL_HOLDINGS_AS_OF = "intern_api_cryptos_trades_holdings_as_of";
const URL_PRICE = "intern_api_cryptos_trades_price";

// totalReal = EUR value of what is received (CrTaxReportService: net EUR received on a Vente), falling
// back to the given side when the received price is unknown. null when nothing usable is filled in.
export function computeTotalReal ({ fromCoin, fromNbToken, fromPrice, toCoin, toNbToken, toPrice }) {
	const value = (coin, nb, price) => {
		const n = parseFloat(nb), p = String(coin).toUpperCase() === 'EUR' ? 1 : parseFloat(price);
		return isNaN(n) || isNaN(p) || p === 0 ? null : n * p;
	}
	const total = value(toCoin, toNbToken, toPrice) ?? value(fromCoin, fromNbToken, fromPrice);
	return total === null ? null : String(Math.round(total * 100) / 100);
}

const TOTAL_INPUTS = ['fromCoin', 'fromNbToken', 'fromPrice', 'toCoin', 'toNbToken', 'toPrice'];

const TYPE_ITEMS = [
	{ value: 0, label: 'Achat' },
	{ value: 1, label: 'Vente' },
	{ value: 2, label: 'Dépôt' },
	{ value: 3, label: 'Retrait' },
	{ value: 4, label: 'Récupération' },
	{ value: 5, label: 'Stacking' },
	{ value: 6, label: 'Transfert' },
	{ value: 7, label: 'À catégoriser' },
];

export function TradesFormulaire ({ context, element, open, onOpenChange, onUpdateList, tokens = [] }) {
	return <Sheet open={open} onOpenChange={onOpenChange}>
		<SheetContent className="flex flex-col p-0 sm:max-w-lg [&_label]:mb-1.5 [&_label]:mt-0">
			<SheetHeader>
				<SheetTitle>{context === "create" ? (element ? "Ajouter l'opération manquante" : "Ajouter une transaction") : "Modifier la transaction"}</SheetTitle>
			</SheetHeader>

			<div className="flex-1 overflow-y-auto px-6 py-5">
				<Form
					key={element ? (element.id ?? element.prefillKey) : 'new'}
					context={context}
					element={element}
					onClose={() => onOpenChange(false)}
					onUpdateList={onUpdateList}
					tokens={tokens}
				/>
			</div>
		</SheetContent>
	</Sheet>;
}

function Form ({ context, element, onClose, onUpdateList, tokens }) {
	const [state, setState] = useState({
		tradeAt: element ? Formulaire.setValueDateTime(element.tradeAt) : Formulaire.setValueDateTime(new Date()),
		type: element ? Formulaire.setValue(element.type) : 0,
		fromCoin: element ? Formulaire.setValue(element.fromCoin) : '',
		toCoin: element ? Formulaire.setValue(element.toCoin) : '',
		costPrice: element ? Formulaire.setValue(element.costPrice) : '0',
		costCoin: element ? Formulaire.setValue(element.costCoin) : 'EUR',
		fromNbToken: element ? Formulaire.setValue(element.fromNbToken) : '',
		toNbToken: element ? Formulaire.setValue(element.toNbToken) : '',
		toPrice: element ? Formulaire.setValue(element.toPrice) : '',
		fromPrice: element ? Formulaire.setValue(element.fromPrice) : '',
		totalReal: element ? Formulaire.setValue(element.totalReal) : '0',
	});
	const [errors, setErrors] = useState([]);
	// Once the user types a total by hand, stop overwriting it (fees, real bank amount…).
	const [totalTouched, setTotalTouched] = useState(false);
	const [load, setLoad] = useState(false);

	const handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === 'fromCoin' || name === 'toCoin' || name === 'costCoin') {
			value = value !== "" ? value.toUpperCase() : value;
		}

		if (name === 'totalReal') {
			setTotalTouched(true);
		}

		handleSelect(name, value);
	}

	const handleSelect = (identifiant, value) => {
		setState(prev => {
			const next = { ...prev, [identifiant]: value };
			if (!totalTouched && TOTAL_INPUTS.includes(identifiant)) {
				next.totalReal = computeTotalReal(next) ?? prev.totalReal;
			}
			return next;
		});
	}

	const handleRecomputeTotal = () => {
		setTotalTouched(false);
		setState(prev => ({ ...prev, totalReal: computeTotalReal(prev) ?? prev.totalReal }));
	}

	// Fills fromPrice/toPrice with the coin's EUR price on the trade's day (CrPriceService cache).
	const [priceLoading, setPriceLoading] = useState(null);
	const handleFetchPrice = (coinField, priceField) => {
		const coin = state[coinField];
		if (!coin || !state.tradeAt) {
			Toastr.toast('warning', 'Renseigne la date et le token.');
			return;
		}
		setPriceLoading(priceField);
		axios({ method: "GET", url: Routing.generate(URL_PRICE), params: { coin, date: state.tradeAt } })
			.then(response => handleSelect(priceField, String(response.data.price)))
			.catch(error => Toastr.toast('error', error.response?.data?.message || 'Cours introuvable.'))
			.then(() => setPriceLoading(null))
		;
	}

	const handleSubmit = (e) => {
		e.preventDefault();
		if (load) return;

		setErrors([]);

		const { tradeAt, type, fromCoin, fromNbToken, toCoin, toNbToken, toPrice, fromPrice, costPrice, costCoin, totalReal } = state;

		let paramsToValidate = [
			{ type: "text", id: 'tradeAt', value: tradeAt },
			{ type: "text", id: 'type', value: type },
			{ type: "text", id: 'toCoin', value: toCoin },
			{ type: "text", id: 'toNbToken', value: toNbToken },
			{ type: "text", id: 'costPrice', value: costPrice },
			{ type: "text", id: 'costCoin', value: costCoin },
		];

		if (parseInt(type) !== TRANSFERT) {
			paramsToValidate = [...paramsToValidate, { type: "text", id: 'totalReal', value: totalReal }];
		}

		if (parseInt(type) !== DEPOT) {
			paramsToValidate = [...paramsToValidate, ...[
				{ type: "text", id: 'fromCoin', value: fromCoin },
				{ type: "text", id: 'fromNbToken', value: fromNbToken },
				{ type: "text", id: 'toPrice', value: toPrice },
				{ type: "text", id: 'fromPrice', value: fromPrice },
			]]
		}

		let validate = Validateur.validateur(paramsToValidate);
		if (!validate.code) {
			Toastr.toast('warning', 'Veuillez vérifier les informations transmises.');
			setErrors(validate.errors);
			return;
		}

		setLoad(true);
		Formulaire.loader(true);

		let url = context === "create" ? Routing.generate(URL_CREATE_ELEMENT) : Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });

		axios({ method: context === "create" ? "POST" : "PUT", url: url, data: state })
			.then(function (response) {
				Toastr.toast('info', 'Transaction enregistrée.');
				onUpdateList(response.data, context);
				onClose();
			})
			.catch(function (error) {
				Formulaire.displayErrors({ setState: (s) => setErrors(s.errors || []) }, error);
			})
			.then(function () {
				Formulaire.loader(false);
				setLoad(false);
			})
		;
	}

	const { tradeAt, type, fromCoin, toCoin, costPrice, costCoin, fromNbToken, toNbToken, toPrice, fromPrice, totalReal } = state;
	const isDepot = parseInt(type) === DEPOT;
	const isTransfert = parseInt(type) === TRANSFERT;
	const params = { errors: errors, onChange: handleChange };

	// Balance as it stood right before this specific transaction — not a *current* total, which would be
	// meaningless for a transaction backdated years ago (e.g. re-entering something from 2019). Excludes
	// the transaction being edited itself, so its own effect doesn't count towards "what was available
	// before it". Computed server-side (CrTradeReplayService::computeHoldingsAsOf, full-history replay)
	// instead of client-side, and debounced on the date the same way CurrencyConverter debounces its own
	// lookup, since the full history no longer lives in the browser to replay on every keystroke.
	const [holdingsAsOfDate, setHoldingsAsOfDate] = useState([]);

	useEffect(() => {
		if (!tradeAt) {
			setHoldingsAsOfDate([]);
			return;
		}

		let cancelled = false;
		const timeout = setTimeout(() => {
			axios({ method: "GET", url: Routing.generate(URL_HOLDINGS_AS_OF), params: { date: tradeAt, excludeId: element ? element.id : undefined } })
				.then(function (response) {
					if (cancelled) return;
					setHoldingsAsOfDate(response.data.holdings);
				})
				.catch(function () {
					if (cancelled) return;
					setHoldingsAsOfDate([]);
				})
			;
		}, 500);

		return () => { cancelled = true; clearTimeout(timeout); }
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [tradeAt]);

	let currentBalance = null;
	if (fromCoin) {
		let held = holdingsAsOfDate.find(h => h.coin === fromCoin.toUpperCase());
		currentBalance = held ? held.quantity : 0;
	}

	const priceField = (coinField, priceIdentifiant, valeur, label) => <div>
		<Input type="number" identifiant={priceIdentifiant} valeur={valeur} {...params} placeholder="0.00">{label}</Input>
		<button type="button" className="mt-1 text-[11px] font-medium text-[var(--cat-crypto)] hover:underline disabled:opacity-50"
				disabled={priceLoading === priceIdentifiant} onClick={() => handleFetchPrice(coinField, priceIdentifiant)}>
			{priceLoading === priceIdentifiant ? "Recherche…" : "Cours € à cette date"}
		</button>
	</div>;

	// Suggestions: tokens held at the trade date (with balance) for the given side, every token already
	// used in a trade (+ EUR) for the received side. Native datalist, so any other ticker can still be typed.
	const toSuggestions = [...new Set(['EUR', ...tokens])];

	return <div className="flex flex-col gap-5">
		<datalist id="trade-from-coins">
			{holdingsAsOfDate.filter(h => h.quantity > 0).map(h => <option key={h.coin} value={h.coin}>{h.coin} — solde {h.quantity}</option>)}
			<option value="EUR" />{/* EUR isn't tracked in holdings but pays for most Achats */}
		</datalist>
		<datalist id="trade-to-coins">
			{toSuggestions.map(c => <option key={c} value={c} />)}
		</datalist>
		<div>
			<div className="mb-1.5 text-sm font-medium">Type de transaction</div>
			<div role="radiogroup" aria-label="Type de transaction" className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
				{TYPE_ITEMS.map(t => {
					const active = parseInt(type) === t.value;
					return <button key={t.value} type="button" role="radio" aria-checked={active}
								   onClick={() => handleSelect('type', t.value)}
								   className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${active ? 'border-[var(--cat-crypto)] bg-[var(--cat-crypto-soft)] text-[var(--cat-crypto)]' : 'hover:bg-muted'}`}>
						{t.label}
					</button>
				})}
			</div>
		</div>

		<div><Input type="datetime-local" identifiant="tradeAt" valeur={tradeAt} {...params}>Date</Input></div>

		{!isDepot && <div className="rounded-lg border p-3">
			<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Token cédé</div>
			<div className="grid grid-cols-2 gap-2">
				<div>
					<Input identifiant="fromCoin" valeur={fromCoin} {...params} placeholder="BTC" list="trade-from-coins" autocomplete="off">Token</Input>
					{currentBalance !== null && <button type="button" title="Utiliser tout le solde comme quantité"
														className="mt-1 block text-left text-[11px] text-muted-foreground hover:text-foreground"
														onClick={() => handleSelect('fromNbToken', String(currentBalance))}>
						Solde à cette date : <span className="font-semibold tabular-nums underline decoration-dotted">{currentBalance}</span> {fromCoin.toUpperCase()}
					</button>}
				</div>
				<div><Input type="number" identifiant="fromNbToken" valeur={fromNbToken} {...params} placeholder="0.00">Quantité</Input></div>
				{priceField('fromCoin', 'fromPrice', fromPrice, 'Prix unitaire cédé')}
			</div>
		</div>}

		<div className="rounded-lg border p-3" style={{ borderColor: 'var(--cat-crypto)' }}>
			<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cat-crypto)' }}>Token reçu</div>
			<div className="grid grid-cols-2 gap-2">
				<div><Input identifiant="toCoin" valeur={toCoin} {...params} placeholder="EUR" list="trade-to-coins" autocomplete="off">Token</Input></div>
				<div><Input type="number" identifiant="toNbToken" valeur={toNbToken} {...params} placeholder="0.00">Quantité</Input></div>
				{!isDepot && priceField('toCoin', 'toPrice', toPrice, 'Prix unitaire reçu')}
			</div>
		</div>

		<div className="grid grid-cols-2 gap-4">
			<div><Input type="number" identifiant="costPrice" valeur={costPrice} {...params} placeholder="0">Frais</Input></div>
			<div><Input identifiant="costCoin" valeur={costCoin} {...params} placeholder="EUR">Devise des frais</Input></div>
		</div>

		<div className="flex flex-col gap-2">
			<div>
				<div><Input type="number" identifiant="totalReal" valeur={totalReal} {...params}>Total réel (€){isTransfert ? " (optionnel)" : ""}</Input></div>
				<div className="mt-1 text-[11px] text-muted-foreground">
					{totalTouched
						? <button type="button" className="font-medium text-[var(--cat-crypto)] hover:underline" onClick={handleRecomputeTotal}>Recalculer (quantité × prix reçu)</button>
						: "Calculé automatiquement : quantité × prix unitaire reçu (ou cédé à défaut)."}
				</div>
			</div>
			<CurrencyConverter date={tradeAt} />
		</div>

		<div className="flex justify-end gap-2">
			{context === "update" && <Button type="default" onClick={onClose}>Annuler</Button>}
			<Button type="blue" isSubmit={true} iconLeft={load ? "chart-3" : ""} onClick={handleSubmit} width="w-full sm:w-auto">
				{context === "create" ? "Enregistrer" : "Modifier"}
			</Button>
		</div>
	</div>
}
