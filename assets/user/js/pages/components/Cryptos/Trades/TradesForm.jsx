import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Toastr from "@tailwindFunctions/toastr";

import { Button } from "@tailwindComponents/Elements/Button";
import { Input, SelectCombobox } from "@tailwindComponents/Elements/Fields";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcnComponents/ui/sheet";
import { CurrencyConverter } from "@userPages/Cryptos/Trades/CurrencyConverter";

const DEPOT = 2;
const TRANSFERT = 6;

const URL_CREATE_ELEMENT = "intern_api_cryptos_trades_create";
const URL_UPDATE_ELEMENT = "intern_api_cryptos_trades_update";
const URL_HOLDINGS_AS_OF = "intern_api_cryptos_trades_holdings_as_of";

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

export function TradesFormulaire ({ context, element, open, onOpenChange, onUpdateList }) {
	return <Sheet open={open} onOpenChange={onOpenChange}>
		<SheetContent className="flex flex-col p-0 sm:max-w-lg [&_label]:mb-1.5 [&_label]:mt-0">
			<SheetHeader>
				<SheetTitle>{context === "create" ? "Ajouter une transaction" : "Modifier la transaction"}</SheetTitle>
			</SheetHeader>

			<div className="flex-1 overflow-y-auto px-6 py-5">
				<Form
					key={element ? element.id : 'new'}
					context={context}
					element={element}
					onClose={() => onOpenChange(false)}
					onUpdateList={onUpdateList}
				/>
			</div>
		</SheetContent>
	</Sheet>;
}

function Form ({ context, element, onClose, onUpdateList }) {
	const [state, setState] = useState({
		tradeAt: element ? Formulaire.setValueDateTime(element.tradeAt) : Formulaire.setValueDateTime(new Date()),
		type: element ? Formulaire.setValue(element.type) : 0,
		fromCoin: element ? Formulaire.setValue(element.fromCoin) : '',
		toCoin: element ? Formulaire.setValue(element.toCoin) : '',
		costPrice: element ? Formulaire.setValue(element.costPrice) : '',
		costCoin: element ? Formulaire.setValue(element.costCoin) : '',
		fromNbToken: element ? Formulaire.setValue(element.fromNbToken) : '',
		toNbToken: element ? Formulaire.setValue(element.toNbToken) : '',
		toPrice: element ? Formulaire.setValue(element.toPrice) : '',
		fromPrice: element ? Formulaire.setValue(element.fromPrice) : '',
		totalReal: element ? Formulaire.setValue(element.totalReal) : '',
	});
	const [errors, setErrors] = useState([]);
	const [load, setLoad] = useState(false);

	const handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === 'fromCoin' || name === 'toCoin' || name === 'costCoin') {
			value = value !== "" ? value.toUpperCase() : value;
		}

		setState(prev => ({ ...prev, [name]: value }));
	}

	const handleSelect = (identifiant, value) => {
		setState(prev => ({ ...prev, [identifiant]: value }));
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

	return <div className="flex flex-col gap-5">
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<SelectCombobox identifiant="type" valeur={type} items={TYPE_ITEMS} noEmpty={true} errors={errors} onSelect={handleSelect}>
				Type de transaction
			</SelectCombobox>
			<Input type="datetime-local" identifiant="tradeAt" valeur={tradeAt} {...params}>Date</Input>
		</div>

		{!isDepot && <div className="rounded-lg border p-3">
			<div className="mb-2 flex items-center justify-between gap-2">
				<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Token cédé</div>
				{currentBalance !== null && <div className="text-[11px] text-muted-foreground">
					Solde à cette date : <span className="font-semibold tabular-nums">{currentBalance}</span> {fromCoin.toUpperCase()}
				</div>}
			</div>
			<div className="grid grid-cols-2 gap-2">
				<Input type="number" identifiant="fromNbToken" valeur={fromNbToken} {...params} placeholder="0.00">Quantité</Input>
				<Input identifiant="fromCoin" valeur={fromCoin} {...params} placeholder="BTC">Token</Input>
			</div>
		</div>}

		<div className="rounded-lg border p-3" style={{ borderColor: 'var(--cat-crypto)' }}>
			<div className="mb-2 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cat-crypto)' }}>Token reçu</div>
			<div className="grid grid-cols-2 gap-2">
				<Input identifiant="toCoin" valeur={toCoin} {...params} placeholder="EUR">Token</Input>
				<Input type="number" identifiant="toNbToken" valeur={toNbToken} {...params} placeholder="0.00">Quantité</Input>
			</div>
		</div>

		{!isDepot && <div className="grid grid-cols-2 gap-4">
			<Input type="number" identifiant="fromPrice" valeur={fromPrice} {...params}>Prix unitaire cédé</Input>
			<Input type="number" identifiant="toPrice" valeur={toPrice} {...params}>Prix unitaire reçu</Input>
		</div>}

		<div className="grid grid-cols-2 gap-4">
			<Input type="number" identifiant="costPrice" valeur={costPrice} {...params} placeholder="0">Frais</Input>
			<Input identifiant="costCoin" valeur={costCoin} {...params} placeholder="EUR">Devise des frais</Input>
		</div>

		<div className="flex flex-col gap-2">
			<Input type="number" identifiant="totalReal" valeur={totalReal} {...params}>Total réel (€){isTransfert ? " (optionnel)" : ""}</Input>
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
