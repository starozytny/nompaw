import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Card } from "@shadcnComponents/ui/card";

const URL_GET_DATA = "intern_api_cryptos_trades_holdings";

export function HoldingsTab ({ refreshSignal }) {
	const [holdings, setHoldings] = useState([]);
	const [alerts, setAlerts] = useState([]);
	const [loadingData, setLoadingData] = useState(true);

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
