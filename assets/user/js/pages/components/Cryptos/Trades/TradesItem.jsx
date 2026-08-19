import React from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";

import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Badge } from "@shadcnComponents/ui/badge";

const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;
const TRANSFERT = 6;
const A_CATEGORISER = 7;

const TYPE_LABEL = ['Achat', 'Vente', 'Dépôt', 'Retrait', 'Récupération', 'Stacking', 'Transfert', 'À catégoriser'];
const TYPE_ICON = ['cart', 'receipt', 'download', 'upload', 'refresh1', 'time', 'arrow-swap-horizontal', 'warning1'];
const TYPE_COLOR = ['var(--cat-crypto)', 'var(--status-good)', 'var(--cat-income)', 'var(--cat-expense)', 'var(--cat-saving)', 'var(--cat-saving)', 'hsl(var(--muted-foreground))', 'var(--status-critical)'];
const TYPE_SOFT = ['var(--cat-crypto-soft)', 'var(--status-good-soft)', 'var(--cat-income-soft)', 'var(--cat-expense-soft)', 'var(--cat-saving-soft)', 'var(--cat-saving-soft)', 'hsl(var(--muted))', 'var(--status-critical-soft)'];

function formatAmount (qty, coin) {
	return coin === "EUR" ? Sanitaze.toFormatCurrency(qty) : `${qty} ${coin}`;
}

export function TradesItem ({ elem, onModal, onEditElement }) {
	const color = TYPE_COLOR[elem.type];
	const soft = TYPE_SOFT[elem.type];
	const sameCoin = elem.fromCoin === elem.toCoin;

	return <div className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0 hover:bg-accent/50 transition-colors">
		<div className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center flex-shrink-0" style={{ background: soft, color: color }}>
			<span className={`icon-${TYPE_ICON[elem.type]}`} />
		</div>

		<div className="w-14 flex-shrink-0 text-xs text-muted-foreground leading-tight">
			<div className="font-medium text-foreground">{Sanitaze.toFormatDate(elem.tradeAt, 'D MMM')}</div>
			<div>{Sanitaze.toFormatDate(elem.tradeAt, 'H[h]mm')}</div>
		</div>

		<div className="flex-1 min-w-0">
			<div className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
				<Badge variant="outline" style={{ borderColor: color + '55', color: color }}>{TYPE_LABEL[elem.type]}</Badge>

				{sameCoin
					? <span className="tabular-nums">{formatAmount(elem.toNbToken, elem.toCoin)}</span>
					: <span className="flex items-center gap-1.5 tabular-nums">
						{formatAmount(elem.fromNbToken, elem.fromCoin)}
						<span className="icon-right-arrow text-[10px] text-muted-foreground" />
						{elem.toNbToken === null ? <span className="text-muted-foreground">?</span> : formatAmount(elem.toNbToken, elem.toCoin)}
					</span>
				}
			</div>

			{(elem.importedFrom || elem.costPrice > 0 || elem.rawCategory) && <div className="flex flex-wrap items-center gap-1.5 mt-1">
				{elem.importedFrom && <Badge variant="muted">Importé · {elem.importedFrom}</Badge>}
				{elem.costPrice > 0 && <Badge variant="muted">Frais {formatAmount(elem.costPrice, elem.costCoin)}</Badge>}
				{elem.rawCategory && <Badge variant="outline" style={{ borderColor: 'var(--status-critical)55', color: 'var(--status-critical)' }}>Catégorie d'origine · {elem.rawCategory}</Badge>}
			</div>}
		</div>

		<div className="text-sm font-semibold tabular-nums whitespace-nowrap" style={{ color: color }}>
			{elem.type === RETRAIT ? "-" : ""}{Sanitaze.toFormatCurrency(elem.totalReal)}
		</div>

		<div className="flex gap-0.5 flex-shrink-0">
			<ButtonIcon type="default" icon="pencil" onClick={() => onEditElement(elem)}>Modifier</ButtonIcon>
			<ButtonIcon type="default" icon="trash" onClick={() => onModal('delete', elem)}>Supprimer</ButtonIcon>
		</div>
	</div>
}

TradesItem.propTypes = {
	elem: PropTypes.object.isRequired,
}
