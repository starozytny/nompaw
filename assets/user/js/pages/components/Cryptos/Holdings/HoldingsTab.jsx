import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Card } from "@shadcnComponents/ui/card";
import { CoinIcon } from "@userPages/Cryptos/CoinIcon";

const URL_GET_DATA = "intern_api_cryptos_trades_holdings";
const URL_GET_LEDGER = "intern_api_cryptos_trades_ledger";

export function HoldingsTab ({ refreshSignal }) {
	const [holdings, setHoldings] = useState([]);
	const [alerts, setAlerts] = useState([]);
	const [loadingData, setLoadingData] = useState(true);
	const [openCoin, setOpenCoin] = useState(null);

	useEffect(() => {
		axios({ method: "GET", url: Routing.generate(URL_GET_DATA), data: {} })
			.then(function (response) {
				setHoldings(response.data.holdings);
				setAlerts(response.data.alerts);
				setLoadingData(false);
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setLoadingData(false);
			})
		;
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [refreshSignal]);

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
					{holdings.map(h => <div key={h.coin}>
						<button type="button" aria-expanded={openCoin === h.coin}
								onClick={() => setOpenCoin(openCoin === h.coin ? null : h.coin)}
								className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50">
							<div className="flex items-center gap-3">
								<CoinIcon coin={h.coin} size={32} />
								<span className="font-medium text-sm">{h.coin}</span>
							</div>
							<span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
								{fmt(h.quantity)}
								<span className={`icon-${openCoin === h.coin ? 'up' : 'down'}-chevron text-xs text-muted-foreground`} />
							</span>
						</button>
						{openCoin === h.coin && <CoinLedger coin={h.coin} refreshSignal={refreshSignal} />}
					</div>)}
				</div>
			</Card>
		}
	</div>
}

const fmt = (n) => Number(n.toFixed(8)).toLocaleString('fr-FR', { maximumFractionDigits: 8 });

// Movements of one coin: totals per type, then every trade with its signed delta and running balance.
function CoinLedger ({ coin, refreshSignal }) {
	const [rows, setRows] = useState(null);

	useEffect(() => {
		axios({ method: "GET", url: Routing.generate(URL_GET_LEDGER, { coin }) })
			.then(response => {
				let prev = 0;
				setRows(response.data.ledger.map(r => {
					const delta = r.balanceAfter - prev;
					prev = r.balanceAfter;
					return { ...r, delta };
				}));
			})
			.catch(error => { Formulaire.displayErrors(null, error); setRows([]); })
		;
	}, [coin, refreshSignal]);

	if (rows === null) {
		return <LoaderElements />
	}

	const byType = {};
	rows.forEach(r => {
		const t = byType[r.type] ??= { type: r.type, count: 0, in: 0, out: 0 };
		t.count++;
		if (r.delta > 0) t.in += r.delta; else t.out += r.delta;
	});

	return <div className="flex flex-col gap-3 bg-muted/30 px-4 py-3 text-xs">
		<div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 gap-y-1">
			<span className="font-semibold">Type</span>
			<span className="text-right font-semibold">Nb</span>
			<span className="text-right font-semibold">Entrées</span>
			<span className="text-right font-semibold">Sorties</span>
			{Object.values(byType).map(t => <React.Fragment key={t.type}>
				<span>{t.type}</span>
				<span className="text-right tabular-nums">{t.count}</span>
				<span className="text-right tabular-nums text-green-600">{t.in ? '+' + fmt(t.in) : '—'}</span>
				<span className="text-right tabular-nums text-red-600">{t.out ? fmt(t.out) : '—'}</span>
			</React.Fragment>)}
		</div>
		<p className="text-muted-foreground">
			Les « Transfert » et « À catégoriser » ne changent pas le solde : un envoi vers un portefeuille externe
			ou une vente mal catégorisée laisse donc la crypto comptée comme restante.
		</p>
		<div className="max-h-96 overflow-auto rounded border bg-background">
			<table className="w-full">
				<thead className="sticky top-0 bg-background text-left">
					<tr className="border-b">
						<th className="px-2 py-1.5">Date</th>
						<th className="px-2 py-1.5">Type</th>
						<th className="px-2 py-1.5">Opération</th>
						<th className="px-2 py-1.5">Plateforme</th>
						<th className="px-2 py-1.5 text-right">Mouvement</th>
						<th className="px-2 py-1.5 text-right">Solde</th>
					</tr>
				</thead>
				<tbody>
					{rows.map(r => <tr key={r.id} className={`border-b last:border-0 ${r.balanceAfter < -1e-8 ? 'bg-red-50 dark:bg-red-950/30' : ''}`}>
						<td className="whitespace-nowrap px-2 py-1">{Sanitaze.toFormatDate(r.tradeAt, 'L')}</td>
						<td className="px-2 py-1">{r.type}</td>
						<td className="whitespace-nowrap px-2 py-1 tabular-nums">{r.fromNbToken ?? ''} {r.fromCoin ?? ''} → {r.toNbToken ?? ''} {r.toCoin ?? ''}</td>
						<td className="px-2 py-1">{r.platform}</td>
						<td className={`px-2 py-1 text-right tabular-nums ${r.delta > 0 ? 'text-green-600' : r.delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
							{Math.abs(r.delta) < 1e-10 ? '0' : (r.delta > 0 ? '+' : '') + fmt(r.delta)}
						</td>
						<td className="px-2 py-1 text-right font-medium tabular-nums">{fmt(r.balanceAfter)}</td>
					</tr>)}
				</tbody>
			</table>
		</div>
	</div>
}
