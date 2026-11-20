import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Toastr from "@tailwindFunctions/toastr";

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { CoinIcon } from "@userPages/Cryptos/CoinIcon";
import { PortfolioChart } from "@userPages/Cryptos/Stats/PortfolioChart";
import { CoinChart } from "@userPages/Cryptos/Stats/CoinChart";

import { eur, qty, price, dayLabel, colorOf } from "@userPages/Cryptos/Stats/format";

const URL_GET_STATS = "intern_api_cryptos_stats_index";
const URL_REFRESH_PRICES = "intern_api_cryptos_stats_refresh_prices";

function Kpi ({ label, value, hint, tone }) {
	return <Card className="p-4">
		<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
		<div className="mt-1 text-2xl font-bold tabular-nums" style={tone ? { color: tone } : undefined}>{value}</div>
		{hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
	</Card>
}

export function StatsTab ({ refreshSignal }) {
	const [stats, setStats] = useState(null);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		axios({ method: "GET", url: Routing.generate(URL_GET_STATS) })
			.then(response => setStats(response.data))
			.catch(error => Formulaire.displayErrors(null, error));
	}, [refreshSignal]);

	const handleRefresh = () => {
		if (refreshing) return;
		setRefreshing(true);
		axios({ method: "POST", url: Routing.generate(URL_REFRESH_PRICES) })
			.then(response => {
				setStats(response.data);
				Toastr.toast('info', response.data.written > 0 ? 'Cours mis à jour.' : 'Les cours étaient déjà à jour.');
			})
			.catch(error => Formulaire.displayErrors(null, error))
			.finally(() => setRefreshing(false));
	}

	if (stats === null) return <LoaderElements />;

	const { kpis, series, coins, allocation } = stats;
	if (!kpis) {
		return <Card className="p-6 text-center text-sm text-muted-foreground">Aucune transaction : importe ou ajoute des opérations pour voir tes statistiques.</Card>;
	}

	const color = (coin) => colorOf(coins, coin);
	const resultPct = kpis.invested > 0 ? kpis.result / kpis.invested * 100 : null;
	const valued = allocation.filter(a => a.value !== null);
	const coinOptions = [...new Set([...valued.map(a => a.coin), ...coins])];

	return <div className="flex flex-col gap-4">
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="text-xs text-muted-foreground">
				Cours Binance (ouverture du jour, en €){kpis.pricesUpTo && <> · à jour au {dayLabel(kpis.pricesUpTo)}</>}
			</div>
			<Button type="default" onClick={handleRefresh}>
				<span className={refreshing ? "icon-refresh1 mr-1 inline-block animate-spin" : "icon-refresh1 mr-1"} />
				{refreshing ? "Mise à jour…" : "Actualiser les cours"}
			</Button>
		</div>

		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<Kpi label="Valeur des cryptos" value={eur(kpis.value)} hint={`${kpis.heldCount} crypto${kpis.heldCount > 1 ? 's' : ''} détenue${kpis.heldCount > 1 ? 's' : ''}`} />
			<Kpi label="€ disponibles" value={eur(kpis.cash)} hint="Restés sur les plateformes" />
			<Kpi label="Net investi" value={eur(kpis.invested)} hint="Dépôts − retraits" />
			<Kpi label="Résultat latent" value={`${kpis.result >= 0 ? '+' : ''}${eur(kpis.result)}`}
				 tone={kpis.result >= 0 ? 'var(--status-good)' : 'var(--status-critical)'}
				 hint={`${resultPct !== null ? `${resultPct >= 0 ? '▲ +' : '▼ '}${resultPct.toFixed(1).replace('.', ',')} % · ` : ''}cryptos + € − net investi`} />
		</div>

		{kpis.unpricedCoins.length > 0 && <div className="rounded-lg border border-dashed px-4 py-2.5 text-xs text-muted-foreground">
			<span className="icon-warning1 mr-1" />
			Sans cours Binance, donc exclus de la valeur : <b className="text-foreground">{kpis.unpricedCoins.join(', ')}</b>
		</div>}

		<PortfolioChart series={series} coins={coins} />

		{coinOptions.length > 0 && <CoinChart options={coinOptions} defaultCoin={coinOptions[0]} color={color} />}

		<Card className="overflow-hidden">
			<div className="border-b px-4 py-3 text-sm font-semibold">Répartition actuelle</div>
			<div className="overflow-x-auto">
				<table className="w-full min-w-[560px] text-sm">
					<thead>
						<tr className="border-b text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
							<th className="py-2 pl-4 pr-3">Crypto</th>
							<th className="py-2 pr-3 text-right">Quantité</th>
							<th className="py-2 pr-3 text-right">Prix</th>
							<th className="py-2 pr-3 text-right">Valeur</th>
							<th className="py-2 pr-4 text-right">Part</th>
						</tr>
					</thead>
					<tbody>
						{allocation.map(a => <tr key={a.coin} className="border-t">
							<td className="py-2 pl-4 pr-3"><span className="inline-flex items-center gap-2 font-medium"><CoinIcon coin={a.coin} />{a.coin}</span></td>
							<td className="py-2 pr-3 text-right tabular-nums">{qty(a.quantity)}</td>
							<td className="py-2 pr-3 text-right tabular-nums">{price(a.price)}</td>
							<td className="py-2 pr-3 text-right font-semibold tabular-nums">{eur(a.value)}</td>
							<td className="py-2 pr-4 text-right">
								{a.percent === null ? <span className="text-muted-foreground">—</span>
									: <span className="inline-flex items-center justify-end gap-2 tabular-nums">
										<span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:inline-block">
											<span className="block h-full rounded-full" style={{ width: `${Math.min(100, a.percent)}%`, background: color(a.coin) }} />
										</span>
										{a.percent.toFixed(1).replace('.', ',')} %
									</span>}
							</td>
						</tr>)}
					</tbody>
				</table>
			</div>
		</Card>
	</div>
}

StatsTab.propTypes = {
	refreshSignal: PropTypes.number,
}
