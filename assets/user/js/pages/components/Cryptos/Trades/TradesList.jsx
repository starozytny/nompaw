import React, { useState } from "react";
import PropTypes from 'prop-types';

import moment from "moment/moment";
import "moment/locale/fr";

import { cn } from "@shadcnComponents/lib/utils";
import Sanitaze from "@commonFunctions/sanitaze";

import { SelectSimple } from "@shadcnComponents/elements/Select/Select";
import { ComboboxMultiple } from "@shadcnComponents/elements/Combobox/Combobox";
import { TradesItem, TYPE_LABEL } from "@userPages/Cryptos/Trades/TradesItem";
import { CryptosYearDialog } from "@userPages/Cryptos/Trades/CryptosYearDialog";

const COLUMNS = 6;

const MANUAL_PLATFORM = "__manual__";

// Toggles `item` ({value, label}) in/out of a multi-select filter's selection array.
function toggleFilterValue (setter) {
	return (identifiant, item) => {
		setter(prev => prev.some(v => v.value === item.value) ? prev.filter(v => v.value !== item.value) : [...prev, item]);
	}
}

/**
 * Renders one year's worth of trades (already fetched, sorted chronologically, and annotated with
 * dispoAfter/depotAfter/retraitAfter/bonusAfter/invalid by CrTradeReplayService — see Trades.jsx). This
 * component only does light client-side work now: grouping into months and applying the type/platform/
 * token filters, both cheap over a single year's worth of data.
 */
export const TradesList = React.memo(function TradesList ({ data, years, selectedYear, yearStats, yearHoldings, filterOptions, onYearChange, onModal, onEdit }) {
	const [openMonths, setOpenMonths] = useState({});
	const [typeFilter, setTypeFilter] = useState([]);
	const [platformFilter, setPlatformFilter] = useState([]);
	const [tokenFilter, setTokenFilter] = useState([]);
	const [cryptosDialogOpen, setCryptosDialogOpen] = useState(false);

	if (data.length === 0) {
		return <div className="flex flex-col items-center gap-2 p-8 text-center">
			<span className="icon-cart text-2xl text-muted-foreground" />
			<div className="text-sm text-muted-foreground">Aucune transaction pour le moment.</div>
		</div>
	}

	const typeItems = TYPE_LABEL.map((label, index) => ({ value: String(index), label }));
	const platformItems = [
		...(filterOptions.hasManual ? [{ value: MANUAL_PLATFORM, label: "Manuel (non importé)" }] : []),
		...filterOptions.platforms.map(p => ({ value: p, label: p })),
	];
	const tokenItems = filterOptions.tokens.map(t => ({ value: t, label: t }));

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

	const yearSelect = <div className="w-28">
		<SelectSimple identifiant="year" valeur={String(selectedYear)} noEmpty
			items={years.map(y => ({ identifiant: y, value: String(y), label: String(y) }))}
			onSelect={(identifiant, value) => onYearChange(parseInt(value))} />
	</div>;

	if (filteredData.length === 0) {
		return <div className="flex flex-col gap-3 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2">
					{yearSelect}
					{filters}
				</div>
			</div>
			<div className="flex flex-col items-center gap-2 p-8 text-center">
				<span className="icon-cart text-2xl text-muted-foreground" />
				<div className="text-sm text-muted-foreground">Aucune transaction ne correspond à ces filtres.</div>
			</div>
		</div>
	}

	// data (and therefore filteredData) is already chronological ascending — grouping preserves that
	// order, which is required since each trade's dispoAfter/depotAfter/retraitAfter/bonusAfter is a
	// running total computed server-side; the month header just reads the LAST trade's values.
	let monthsData = [];
	filteredData.forEach(item => {
		const month = moment(item.tradeAt).format('MMMM');
		let bucket = monthsData.find(m => m.month === month);
		if (!bucket) {
			bucket = { month, trades: [] };
			monthsData.push(bucket);
		}
		bucket.trades.push(item);
	});

	let itemsMonth = monthsData.map((mItem, ind) => {
		let itemsTrade = mItem.trades.map(elem => (
			<TradesItem key={elem.id} elem={elem} onModal={onModal} onEditElement={onEdit} invalid={elem.invalid} />
		));
		// Trades within the month are chronological ascending (needed above for the "last = cumulative
		// as of this month" read), but displayed newest first.
		itemsTrade.reverse();

		const last = mItem.trades[mItem.trades.length - 1];
		const monthKey = `${selectedYear}-${mItem.month}`;
		const monthOpen = openMonths[monthKey] ?? true;

		return <React.Fragment key={ind}>
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
							<span>Dispo <b className="text-foreground tabular-nums">{Sanitaze.toFormatCurrency(last.dispoAfter)}</b></span>
							<span>Dépôt <b className="tabular-nums" style={{ color: 'var(--cat-income)' }}>{Sanitaze.toFormatCurrency(last.depotAfter)}</b></span>
							<span>Retrait <b className="tabular-nums" style={{ color: 'var(--cat-expense)' }}>{Sanitaze.toFormatCurrency(last.retraitAfter)}</b></span>
							<span>Bonus <b className="tabular-nums" style={{ color: 'var(--cat-saving)' }}>{Sanitaze.toFormatCurrency(last.bonusAfter)}</b></span>
						</div>
					</button>
				</td>
			</tr>
			{monthOpen && itemsTrade}
		</React.Fragment>
	});

	// Months are displayed newest first.
	itemsMonth.reverse();

	return <div className="flex flex-col gap-3 p-4">
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="flex flex-wrap items-center gap-2">
				{yearSelect}
				{filters}
			</div>
			<span className="text-xs text-muted-foreground">{yearStats.count} transaction{yearStats.count > 1 ? "s" : ""} en {selectedYear}</span>
		</div>

		<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
			<div className="rounded-lg border p-2.5">
				<div className="flex items-center justify-between gap-2">
					<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Achats</div>
					<span className="text-[10px] text-muted-foreground">{yearStats.achatCount}</span>
				</div>
				<div className="text-sm font-semibold tabular-nums">{Sanitaze.toFormatCurrency(yearStats.achat)}</div>
			</div>
			<div className="rounded-lg border p-2.5">
				<div className="flex items-center justify-between gap-2">
					<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Ventes</div>
					<span className="text-[10px] text-muted-foreground">{yearStats.venteCount}</span>
				</div>
				<div className="text-sm font-semibold tabular-nums">{Sanitaze.toFormatCurrency(yearStats.vente)}</div>
			</div>
			<button type="button" onClick={() => setCryptosDialogOpen(true)}
					className="rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/40">
				<div className="flex items-center justify-between gap-2">
					<div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Cryptos</div>
					<span className="icon-right-chevron text-[9px] text-muted-foreground" />
				</div>
				<div className="text-sm font-semibold tabular-nums">{yearHoldings.length}</div>
			</button>
		</div>

		<CryptosYearDialog open={cryptosDialogOpen} onOpenChange={setCryptosDialogOpen} year={selectedYear} holdings={yearHoldings} />

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
					{itemsMonth}
				</tbody>
			</table>
		</div>
	</div>
})

TradesList.propTypes = {
	data: PropTypes.array.isRequired,
	years: PropTypes.array.isRequired,
	selectedYear: PropTypes.number,
	yearStats: PropTypes.object,
	yearHoldings: PropTypes.array,
	filterOptions: PropTypes.shape({
		platforms: PropTypes.array,
		tokens: PropTypes.array,
		hasManual: PropTypes.bool,
	}).isRequired,
	onYearChange: PropTypes.func.isRequired,
	onModal: PropTypes.func.isRequired,
	onEdit: PropTypes.func.isRequired,
}
