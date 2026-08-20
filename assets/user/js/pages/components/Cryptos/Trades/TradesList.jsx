import React, { useState } from "react";
import PropTypes from 'prop-types';

import moment from "moment/moment";
import "moment/locale/fr";

import { cn } from "@shadcnComponents/lib/utils";
import Sanitaze from "@commonFunctions/sanitaze";

import { TradesItem } from "@userPages/Cryptos/Trades/TradesItem";
import { Badge } from "@shadcnComponents/ui/badge";

const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;

export function TradesList ({ data, onModal, onEdit }) {
	const [openYears, setOpenYears] = useState({});
	const [openMonths, setOpenMonths] = useState({});

	if (data.length === 0) {
		return <div className="flex flex-col items-center gap-2 p-8 text-center">
			<span className="icon-cart text-2xl text-muted-foreground" />
			<div className="text-sm text-muted-foreground">Aucune transaction pour le moment.</div>
		</div>
	}

	let yData = [];
	data.forEach(item => {
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

	const lastYearIndex = nData.length - 1;

	let total = 0, totalDepot = 0, totalRetrait = 0, totalBonus = 0;

	let items = [];
	nData.forEach((yItem, index) => {
		const isLastYear = index === lastYearIndex;
		const yearOpen = openYears[yItem.year] ?? isLastYear;
		const lastMonthIndex = yItem.items.length - 1;

		let cryptosY = [];
		let totalYDepot = 0, totalYRetrait = 0, yearTxCount = 0;

		let itemsMonth = [];
		yItem.items.forEach((mItem, ind) => {

			let itemsTrade = [];
			mItem.trades.forEach(elem => {
				let findCryptoY = 2;

				switch (elem.type) {
					case VENTE:
						total = Sanitaze.toRoundTwoDec(total) + Sanitaze.toRoundTwoDec(elem.total);

						findCryptoY = 0;
						cryptosY.forEach(cr => {
							if (cr.name === elem.fromCoin) {
								cr.total -= elem.fromNbToken;
								findCryptoY = 1;
							}
						})

						if (findCryptoY === 0) {
							cryptosY.push({ name: elem.fromCoin, total: elem.fromNbToken })
						}
						break;
					case DEPOT:
						total = Sanitaze.toRoundTwoDec(total) + Sanitaze.toRoundTwoDec(elem.total);
						totalDepot = Sanitaze.toRoundTwoDec(totalDepot) + Sanitaze.toRoundTwoDec(elem.total);
						totalYDepot = Sanitaze.toRoundTwoDec(totalYDepot) + Sanitaze.toRoundTwoDec(elem.total);
						break;
					case ACHAT:
						total = Sanitaze.toRoundTwoDec(total) - Sanitaze.toRoundTwoDec(elem.total);

						findCryptoY = 0;
						cryptosY.forEach(cr => {
							if (cr.name === elem.toCoin) {
								cr.total += elem.toNbToken;
								findCryptoY = 1;
							}
						})

						if (findCryptoY === 0) {
							cryptosY.push({ name: elem.toCoin, total: elem.toNbToken })
						}
						break;
					case RETRAIT:
						total = Sanitaze.toRoundTwoDec(total) - Sanitaze.toRoundTwoDec(elem.total);
						totalRetrait = Sanitaze.toRoundTwoDec(totalRetrait) + Sanitaze.toRoundTwoDec(elem.totalReal);
						totalYRetrait = Sanitaze.toRoundTwoDec(totalYRetrait) + Sanitaze.toRoundTwoDec(elem.totalReal);
						break;
					case RECUP:
					case STAKING:
						totalBonus += Sanitaze.toRoundTwoDec(elem.total);
						break;
					default: break;
				}

				itemsTrade.push(<TradesItem key={elem.id} elem={elem} onModal={onModal} onEditElement={onEdit} />);
			})

			yearTxCount += mItem.trades.length;

			const monthKey = `${yItem.year}-${mItem.month}`;
			const isLastMonth = isLastYear && ind === lastMonthIndex;
			const monthOpen = yearOpen && (openMonths[monthKey] ?? isLastMonth);

			itemsMonth.push(<div key={ind}>
				<button type="button"
						className="flex w-full items-center justify-between gap-x-4 gap-y-1.5 border-b bg-muted/40 px-4 py-2 text-xs text-left"
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
					{cryptosY.length > 0 && <div className="flex flex-wrap gap-1">
						{cryptosY.map(cr => <Badge key={cr.name} variant="outline" className="tabular-nums">{cr.name} {cr.total}</Badge>)}
					</div>}
				</button>
				{monthOpen && <div className="flex flex-col">
					{itemsTrade}
				</div>}
			</div>)
		})

		items.push(<div key={index}>
			<button type="button"
					className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-xs font-semibold text-left"
					style={{ background: 'var(--cat-crypto-soft)', color: 'var(--cat-crypto)' }}
					onClick={() => setOpenYears(o => ({ ...o, [yItem.year]: !yearOpen }))}>
				<span className="flex items-center gap-1.5">
					<span className={cn("icon-down-chevron text-[9px] transition-transform", yearOpen && "rotate-180")} />
					{yItem.year} <span className="font-normal opacity-80">({yearTxCount})</span>
				</span>
				<span className="font-normal">Dépôt {Sanitaze.toFormatCurrency(totalYDepot)} · Retrait {Sanitaze.toFormatCurrency(totalYRetrait)}</span>
			</button>
			{yearOpen && <div className="flex flex-col">
				{itemsMonth}
			</div>}
		</div>)
	})

	return <div className="flex flex-col">{items}</div>
}

TradesList.propTypes = {
	data: PropTypes.array.isRequired,
	onModal: PropTypes.func.isRequired,
	onEdit: PropTypes.func.isRequired,
}
