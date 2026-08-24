import React, { useState } from "react";
import PropTypes from 'prop-types';

import moment from "moment/moment";
import "moment/locale/fr";

import { cn } from "@shadcnComponents/lib/utils";
import Sanitaze from "@commonFunctions/sanitaze";
import CryptoHoldings from "@userFunctions/cryptoHoldings";

import { SelectSimple } from "@shadcnComponents/elements/Select/Select";
import { ComboboxMultiple } from "@shadcnComponents/elements/Combobox/Combobox";
import { TradesItem, TYPE_LABEL } from "@userPages/Cryptos/Trades/TradesItem";

const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;

const COLUMNS = 6;

const MANUAL_PLATFORM = "__manual__";

// Toggles `item` ({value, label}) in/out of a multi-select filter's selection array.
function toggleFilterValue (setter) {
	return (identifiant, item) => {
		setter(prev => prev.some(v => v.value === item.value) ? prev.filter(v => v.value !== item.value) : [...prev, item]);
	}
}

export function TradesList ({ data, onModal, onEdit }) {
	const [openMonths, setOpenMonths] = useState({});
	const [selectedYear, setSelectedYear] = useState(null);
	const [typeFilter, setTypeFilter] = useState([]);
	const [platformFilter, setPlatformFilter] = useState([]);
	const [tokenFilter, setTokenFilter] = useState([]);

	if (data.length === 0) {
		return <div className="flex flex-col items-center gap-2 p-8 text-center">
			<span className="icon-cart text-2xl text-muted-foreground" />
			<div className="text-sm text-muted-foreground">Aucune transaction pour le moment.</div>
		</div>
	}

	// Computed from the full, unfiltered data — the chronological balance replay would be wrong if some
	// transactions were excluded by the type/platform filters below.
	const invalidById = CryptoHoldings.computeTransactionValidity(data);

	const platforms = [...new Set(data.map(item => item.importedFrom).filter(Boolean))].sort();
	const hasManual = data.some(item => !item.importedFrom);
	const tokens = [...new Set(data.flatMap(item => [item.fromCoin, item.toCoin]).filter(Boolean))].sort();

	const typeItems = TYPE_LABEL.map((label, index) => ({ value: String(index), label }));
	const platformItems = [
		...(hasManual ? [{ value: MANUAL_PLATFORM, label: "Manuel (non importé)" }] : []),
		...platforms.map(p => ({ value: p, label: p })),
	];
	const tokenItems = tokens.map(t => ({ value: t, label: t }));

	const filteredData = data.filter(item => {
		if (typeFilter.length > 0 && !typeFilter.some(f => f.value === String(item.type))) return false;
		if (platformFilter.length > 0 && !platformFilter.some(f => f.value === MANUAL_PLATFORM ? !item.importedFrom : f.value === item.importedFrom)) return false;
		if (tokenFilter.length > 0 && !tokenFilter.some(f => f.value === item.fromCoin || f.value === item.toCoin)) return false;
		return true;
	});

	const filters = <div className="flex flex-wrap items-center gap-2">
		<div className="w-52">
			<ComboboxMultiple identifiant="type" valeurs={typeFilter} items={typeItems} withItems placeholder="Tous les types" onSelect={toggleFilterValue(setTypeFilter)} />
		</div>
		{platformItems.length > 0 && <div className="w-52">
			<ComboboxMultiple identifiant="platform" valeurs={platformFilter} items={platformItems} withItems placeholder="Toutes les plateformes" onSelect={toggleFilterValue(setPlatformFilter)} />
		</div>}
		{tokenItems.length > 0 && <div className="w-52">
			<ComboboxMultiple identifiant="token" valeurs={tokenFilter} items={tokenItems} withItems placeholder="Tous les tokens" onSelect={toggleFilterValue(setTokenFilter)} />
		</div>}
	</div>;

	if (filteredData.length === 0) {
		return <div className="flex flex-col gap-3 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				{filters}
			</div>
			<div className="flex flex-col items-center gap-2 p-8 text-center">
				<span className="icon-cart text-2xl text-muted-foreground" />
				<div className="text-sm text-muted-foreground">Aucune transaction ne correspond à ces filtres.</div>
			</div>
		</div>
	}

	let yData = [];
	filteredData.forEach(item => {
		let year = moment(item.tradeAt).year();

		let find = false;
		yData.forEach(yItem => {
			if (yItem.year === year) {
				find = true;
				yItem.items.push(item);
			}
		})

		if (!find) {
			yData.push({ year: year, items: [item] })
		}
	})

	let nData = [];
	yData.forEach(item => {
		let nItems = [];
		item.items.forEach(mItem => {
			let month = moment(mItem.tradeAt).format('MMMM');

			let find = false;
			nItems.forEach(nItem => {
				if (nItem.month === month) {
					find = true;
					nItem.trades.push(mItem);
				}
			})

			if (!find) {
				nItems.push({ month: month, trades: [mItem] })
			}
		})

		item.items = nItems;
		nData.push(item);
	})

	// nData is chronological (oldest year first) — needed so the running "Dispo" balance is correct.
	const years = nData.map(yItem => yItem.year);
	const effectiveYear = years.includes(selectedYear) ? selectedYear : years[years.length - 1];

	let total = 0, totalDepot = 0, totalRetrait = 0, totalBonus = 0;

	let selectedItemsMonth = [];
	let yearStats = null;

	nData.forEach(yItem => {
		let totalYDepot = 0, totalYRetrait = 0, totalYAchat = 0, totalYVente = 0, totalYBonus = 0, yearTxCount = 0;

		let itemsMonth = [];
		yItem.items.forEach((mItem, ind) => {

			let itemsTrade = [];
			mItem.trades.forEach(elem => {
				switch (elem.type) {
					case VENTE:
						// elem.totalReal is the net EUR actually received (fees already deducted by the
						// exchange); elem.total adds the fee back on top and would overstate the Dispo.
						total = Sanitaze.toRoundTwoDec(total) + Sanitaze.toRoundTwoDec(elem.totalReal);
						totalYVente = Sanitaze.toRoundTwoDec(totalYVente) + Sanitaze.toRoundTwoDec(elem.totalReal);
						break;
					case DEPOT:
						total = Sanitaze.toRoundTwoDec(total) + Sanitaze.toRoundTwoDec(elem.total);
						totalDepot = Sanitaze.toRoundTwoDec(totalDepot) + Sanitaze.toRoundTwoDec(elem.total);
						totalYDepot = Sanitaze.toRoundTwoDec(totalYDepot) + Sanitaze.toRoundTwoDec(elem.total);
						break;
					case ACHAT:
						total = Sanitaze.toRoundTwoDec(total) - Sanitaze.toRoundTwoDec(elem.total);
						totalYAchat = Sanitaze.toRoundTwoDec(totalYAchat) + Sanitaze.toRoundTwoDec(elem.total);
						break;
					case RETRAIT:
						total = Sanitaze.toRoundTwoDec(total) - Sanitaze.toRoundTwoDec(elem.total);
						totalRetrait = Sanitaze.toRoundTwoDec(totalRetrait) + Sanitaze.toRoundTwoDec(elem.totalReal);
						totalYRetrait = Sanitaze.toRoundTwoDec(totalYRetrait) + Sanitaze.toRoundTwoDec(elem.totalReal);
						break;
					case RECUP:
					case STAKING:
						totalBonus += Sanitaze.toRoundTwoDec(elem.total);
						totalYBonus += Sanitaze.toRoundTwoDec(elem.total);
						break;
					default: break;
				}

				itemsTrade.push(<TradesItem key={elem.id} elem={elem} onModal={onModal} onEditElement={onEdit} invalid={invalidById[elem.id]} />);
			})

			// Running totals above are computed chronologically (oldest to newest, as required for
			// the cumulative math), but rows within the month are displayed newest first.
			itemsTrade.reverse();

			yearTxCount += mItem.trades.length;

			const monthKey = `${yItem.year}-${mItem.month}`;
			const monthOpen = openMonths[monthKey] ?? true;

			itemsMonth.push(<React.Fragment key={ind}>
				<tr className="border-t bg-muted/40">
					<td colSpan={COLUMNS} className="p-0">
						<button type="button"
								className="flex w-full items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2 text-xs text-left"
								onClick={() => setOpenMonths(o => ({ ...o, [monthKey]: !monthOpen }))}>
							<span className="flex items-center gap-1.5 font-semibold text-foreground capitalize">
								<span className={cn("icon-down-chevron text-[9px] text-muted-foreground transition-transform", monthOpen && "rotate-180")} />
								{mItem.month} <span className="font-normal text-muted-foreground">({mItem.trades.length})</span>
							</span>
							<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
								<span>Dispo <b className="text-foreground tabular-nums">{Sanitaze.toFormatCurrency(total)}</b></span>
								<span>Dépôt <b className="tabular-nums" style={{ color: 'var(--cat-income)' }}>{Sanitaze.toFormatCurrency(totalDepot)}</b></span>
								<span>Retrait <b className="tabular-nums" style={{ color: 'var(--cat-expense)' }}>{Sanitaze.toFormatCurrency(totalRetrait)}</b></span>
								<span>Bonus <b className="tabular-nums" style={{ color: 'var(--cat-saving)' }}>{Sanitaze.toFormatCurrency(totalBonus)}</b></span>
							</div>
						</button>
					</td>
				</tr>
				{monthOpen && itemsTrade}
			</React.Fragment>)
		})

		// Months within a year are displayed newest first.
		itemsMonth.reverse();

		if (yItem.year === effectiveYear) {
			selectedItemsMonth = itemsMonth;
			yearStats = {
				count: yearTxCount,
				depot: totalYDepot,
				retrait: totalYRetrait,
				achat: totalYAchat,
				vente: totalYVente,
				bonus: totalYBonus,
				dispoEnd: total,
			};
		}
	})

	return <div className="flex flex-col gap-3 p-4">
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="flex flex-wrap items-center gap-2">
				<div className="w-28">
					<SelectSimple identifiant="year" valeur={String(effectiveYear)} noEmpty
						items={[...years].reverse().map(y => ({ identifiant: y, value: String(y), label: String(y) }))}
						onSelect={(identifiant, value) => setSelectedYear(parseInt(value))} />
				</div>
				{filters}
			</div>
			<span className="text-xs text-muted-foreground">{yearStats.count} transaction{yearStats.count > 1 ? "s" : ""} en {effectiveYear}</span>
		</div>

		<div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
			<div className="rounded-lg border p-2.5">
				<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Dépôts</div>
				<div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--cat-income)' }}>{Sanitaze.toFormatCurrency(yearStats.depot)}</div>
			</div>
			<div className="rounded-lg border p-2.5">
				<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Retraits</div>
				<div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--cat-expense)' }}>{Sanitaze.toFormatCurrency(yearStats.retrait)}</div>
			</div>
			<div className="rounded-lg border p-2.5">
				<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Achats</div>
				<div className="text-sm font-semibold tabular-nums">{Sanitaze.toFormatCurrency(yearStats.achat)}</div>
			</div>
			<div className="rounded-lg border p-2.5">
				<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ventes</div>
				<div className="text-sm font-semibold tabular-nums">{Sanitaze.toFormatCurrency(yearStats.vente)}</div>
			</div>
			<div className="rounded-lg border p-2.5">
				<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Bonus</div>
				<div className="text-sm font-semibold tabular-nums" style={{ color: 'var(--cat-saving)' }}>{Sanitaze.toFormatCurrency(yearStats.bonus)}</div>
			</div>
		</div>

		<div className="-mx-4 overflow-x-auto border-t">
			<table className="w-full min-w-[820px]">
				<thead>
					<tr className="border-b bg-[var(--cat-crypto-soft)] text-left text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--cat-crypto)' }}>
						<th className="py-2.5 pl-4 pr-3">Type de transaction</th>
						<th className="py-2.5 pr-3">Date</th>
						<th className="py-2.5 pr-3">Sortie</th>
						<th className="py-2.5 pr-3">Entrée</th>
						<th className="py-2.5 pr-3 text-right">Montant</th>
						<th className="py-2.5 pr-4"></th>
					</tr>
				</thead>
				<tbody>
					{selectedItemsMonth}
				</tbody>
			</table>
		</div>
	</div>
}

TradesList.propTypes = {
	data: PropTypes.array.isRequired,
	onModal: PropTypes.func.isRequired,
	onEdit: PropTypes.func.isRequired,
}
