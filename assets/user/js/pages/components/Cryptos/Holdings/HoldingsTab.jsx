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
			« Vendre à » : prix d'un token pour vendre ce qu'il te reste au prix de revient moyen (Équilibre), ou avec 10, 20, 30 % de gain. Les ventes passées ne changent pas ce prix de revient ; les récompenses le baissent.
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
							<div className="flex min-w-0 items-center gap-3">
								<CoinIcon coin={h.coin} size={32} />
								<div className="min-w-0">
									<div className="text-sm font-medium">{h.coin}</div>
									{h.unitCost !== null && <div className="text-[11px] text-muted-foreground">
										Prix de revient {fmtPrice(h.unitCost)} / token · {fmtEur2(h.cost)} pour ce qu'il te reste
									</div>}
								</div>
							</div>
							<div className="flex items-center gap-4">
								<div className="text-right">
									<div className="text-sm font-semibold tabular-nums">{fmt(h.quantity)}</div>
									{h.currentPrice !== null && <div className="text-[11px] text-muted-foreground tabular-nums">
										Cours {fmtPrice(h.currentPrice)}
									</div>}
								</div>
								<span className={`icon-${openCoin === h.coin ? 'up' : 'down'}-chevron text-xs text-muted-foreground`} />
							</div>
						</button>
						<SellTargets holding={h} />
						{openCoin === h.coin && <CoinLedger coin={h.coin} refreshSignal={refreshSignal} />}
					</div>)}
				</div>
			</Card>
		}
	</div>
}

const fmt = (n) => Number(n.toFixed(8)).toLocaleString('fr-FR', { maximumFractionDigits: 8 });
const fmtEur = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const fmtEur2 = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
// Token prices range from 0.00001 € to 80 000 €: cents above 1 €, 4 significant digits below.
const fmtPrice = (n) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', ...(n >= 1 ? { maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 }) });

const TARGET_LABELS = { 0: 'Équilibre', 10: '+10 %', 20: '+20 %', 30: '+30 %' };

// Sell price per token for the tokens left: their average cost (Équilibre) or +10/20/30 % on it, with the
// gain in euros on those tokens (CrTradeReplayService::sellTargets). Green once the current price is above.
function SellTargets ({ holding }) {
	const { targets, gains, currentPrice, unitCost, unpriced, coin } = holding;

	const unpricedWarning = unpriced > 0 && <div className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--status-critical)' }}>
		<span className="icon-warning1 mt-0.5 text-[10px]" />
		<span>
			{unpriced} achat{unpriced > 1 ? "s" : ""} de {coin} sans montant (total réel à 0) : {unitCost !== null ? "le prix de revient et les prix ci-dessus sont sous-estimés" : "impossible de calculer un prix de vente"}.
			{' '}Lance <code>app:crypto:trades:fill-prices</code> ou complète le total réel de ces achats.
		</span>
	</div>;

	if (unitCost === null) {
		return <div className="px-4 pb-3 pl-[60px]">
			{unpricedWarning || <div className="text-[11px] text-muted-foreground">
				Obtenu sans rien payer (récompenses, dépôts) : n'importe quel prix de vente est un gain.
			</div>}
		</div>;
	}

	return <div className="flex flex-col gap-2 px-4 pb-3 pl-[60px]">
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
			{Object.entries(TARGET_LABELS).map(([gain, label]) => {
				const price = targets[gain];
				const reached = currentPrice !== null && currentPrice >= price;
				return <div key={gain} className={`rounded-md border px-2.5 py-1.5 ${reached ? 'border-[var(--status-good)]/50 bg-[var(--status-good-soft)]' : 'bg-background'}`}>
					<div className="flex items-baseline justify-between gap-2 text-[11px]">
						<span className="font-semibold">{label}</span>
						<span className="tabular-nums text-muted-foreground">{Number(gain) === 0 ? "gain 0 €" : `gain +${fmtEur2(gains[gain])}`}</span>
					</div>
					<div className="text-[11px] text-muted-foreground">
						Vendre à <span className="text-sm font-semibold tabular-nums text-foreground" style={reached ? { color: 'var(--status-good)' } : undefined}>{fmtPrice(price)}</span>
					</div>
					{reached && <div className="text-[10px]" style={{ color: 'var(--status-good)' }}>✓ le cours actuel est au-dessus</div>}
				</div>
			})}
		</div>
		{unpricedWarning}
	</div>;
}

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
