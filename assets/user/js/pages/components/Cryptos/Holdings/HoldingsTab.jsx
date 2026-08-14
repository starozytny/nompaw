import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Card } from "@shadcnComponents/ui/card";

const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;

const URL_GET_DATA = "intern_api_cryptos_trades_list";

/**
 * Per-type holdings rules, confirmed with the app's owner (not derivable from the field names alone,
 * since "fromCoin" means "given up" for Achat/Vente but "received" for Recuperation/Stacking):
 * - Achat: toCoin received (+toNbToken)
 * - Vente: fromCoin given up (-fromNbToken); if toCoin isn't EUR (a crypto-to-crypto swap), toCoin
 *   received too (+toNbToken)
 * - Recuperation/Stacking: fromCoin received as a reward (+fromNbToken)
 * - Depot/Retrait: a plain EUR cash movement (no holdings impact) UNLESS the coin involved isn't
 *   EUR, in which case it represents a real external crypto deposit/withdrawal (e.g. an exchange
 *   import's "deposit" of BTC from an outside wallet) and must adjust the balance like Achat/Vente
 *   would — Depot: +toCoin, Retrait: -fromCoin.
 * - Transfert: moves between the user's own wallets, no net holdings impact
 *
 * Replays trades in chronological order (not just a final sum) so a Vente that spends more of a coin
 * than was held at that point in time is caught and surfaced as an inconsistency, rather than silently
 * netting out against a later purchase.
 */
function computeHoldingsAndAlerts (data) {
	let sorted = [...data].sort((a, b) => new Date(a.tradeAt) - new Date(b.tradeAt));
	let balances = {};
	let alerts = [];

	let add = (coin, qty) => {
		if (!coin || coin === 'EUR' || qty === null) return;
		balances[coin] = (balances[coin] || 0) + qty;
	}

	sorted.forEach(elem => {
		switch (elem.type) {
			case ACHAT:
				add(elem.toCoin, elem.toNbToken);
				break;
			case VENTE:
				add(elem.fromCoin, -elem.fromNbToken);
				if (balances[elem.fromCoin] < -0.00000001) {
					alerts.push({
						id: elem.id,
						tradeAt: elem.tradeAt,
						coin: elem.fromCoin,
						action: 'vente',
						qty: elem.fromNbToken,
						deficit: -balances[elem.fromCoin],
					});
				}
				if (elem.toCoin !== 'EUR') add(elem.toCoin, elem.toNbToken);
				break;
			case DEPOT:
				if (elem.toCoin !== 'EUR') add(elem.toCoin, elem.toNbToken);
				break;
			case RETRAIT:
				if (elem.fromCoin !== 'EUR') {
					add(elem.fromCoin, -elem.fromNbToken);
					if (balances[elem.fromCoin] < -0.00000001) {
						alerts.push({
							id: elem.id,
							tradeAt: elem.tradeAt,
							coin: elem.fromCoin,
							action: 'retrait',
							qty: elem.fromNbToken,
							deficit: -balances[elem.fromCoin],
						});
					}
				}
				break;
			case RECUP:
			case STAKING:
				add(elem.fromCoin, elem.fromNbToken);
				break;
			default: break;
		}
	})

	let holdings = Object.keys(balances)
		.map(coin => ({ coin: coin, quantity: balances[coin] }))
		.filter(h => Math.abs(h.quantity) > 0.00000001)
		.sort((a, b) => b.quantity - a.quantity);

	return { holdings, alerts };
}

export function HoldingsTab () {
	const [holdings, setHoldings] = useState([]);
	const [alerts, setAlerts] = useState([]);
	const [loadingData, setLoadingData] = useState(true);

	useEffect(() => {
		axios({ method: "GET", url: Routing.generate(URL_GET_DATA), data: {} })
			.then(function (response) {
				let result = computeHoldingsAndAlerts(response.data);
				setHoldings(result.holdings);
				setAlerts(result.alerts);
				setLoadingData(false);
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setLoadingData(false);
			})
		;
	}, []);

	if (loadingData) {
		return <LoaderElements />
	}

	return <div className="flex flex-col gap-4">
		{alerts.length > 0 && <Card className="overflow-hidden border-[var(--status-critical)]/40">
			<div className="flex items-center gap-1.5 border-b px-4 py-2.5 text-xs font-semibold" style={{ color: 'var(--status-critical)' }}>
				<span className="icon-warning1" />
				{alerts.length} incohérence{alerts.length > 1 ? "s" : ""} détectée{alerts.length > 1 ? "s" : ""} dans l'historique
			</div>
			<div className="divide-y">
				{alerts.map((a, i) => <div key={i} className="px-4 py-2.5 text-xs" style={{ background: 'var(--status-critical-soft)' }}>
					<span className="font-medium">{Sanitaze.toFormatDate(a.tradeAt, 'L')}</span>
					{' '}— {a.action} de <b className="tabular-nums">{a.qty}</b> {a.coin} alors qu'il manquait <b className="tabular-nums">{a.deficit}</b> {a.coin} au solde à ce moment-là.
				</div>)}
			</div>
		</Card>}

		<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
			<span className="icon-warning1 text-xs" />
			Quantités calculées à partir de tes transactions (Achat, Vente, Stacking, Récupération) — pas une valorisation en euros.
		</div>

		{holdings.length === 0
			? <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
				<span className="icon-storage text-2xl text-muted-foreground" />
				<div className="text-sm font-medium">Aucun solde crypto pour le moment</div>
			</Card>
			: <Card className="overflow-hidden">
				<div className="divide-y">
					{holdings.map(h => <div key={h.coin} className="flex items-center justify-between gap-3 px-4 py-3">
						<div className="flex items-center gap-3">
							<div className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold"
								 style={{ background: 'var(--cat-crypto-soft)', color: 'var(--cat-crypto)' }}>
								{h.coin.slice(0, 3)}
							</div>
							<span className="font-medium text-sm">{h.coin}</span>
						</div>
						<span className="text-sm font-semibold tabular-nums">{h.quantity}</span>
					</div>)}
				</div>
			</Card>
		}
	</div>
}
