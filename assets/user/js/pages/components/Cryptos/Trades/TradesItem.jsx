import React from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";
import { cn } from "@shadcnComponents/lib/utils";

import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Badge } from "@shadcnComponents/ui/badge";
import { CoinIcon } from "@userPages/Cryptos/CoinIcon";

const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;
const TRANSFERT = 6;
const A_CATEGORISER = 7;

export const TYPE_LABEL = ['Achat', 'Vente', 'Dépôt', 'Retrait', 'Récupération', 'Stacking', 'Transfert', 'À catégoriser'];
const TYPE_ICON = ['cart', 'receipt', 'download', 'upload', 'refresh1', 'time', 'arrow-swap-horizontal', 'warning1'];
const TYPE_COLOR = ['var(--cat-crypto)', 'var(--status-good)', 'var(--cat-income)', 'var(--cat-expense)', 'var(--cat-saving)', 'var(--cat-saving)', 'hsl(var(--muted-foreground))', 'var(--status-critical)'];
const TYPE_SOFT = ['var(--cat-crypto-soft)', 'var(--status-good-soft)', 'var(--cat-income-soft)', 'var(--cat-expense-soft)', 'var(--cat-saving-soft)', 'var(--cat-saving-soft)', 'hsl(var(--muted))', 'var(--status-critical-soft)'];

// Which side of the trade a given type actually moves, so "Sortie"/"Entrée" only show what's relevant
// (e.g. a Dépôt has no outflow leg, a Retrait has no inflow leg).
const SHOWS_SORTIE = [true, true, false, true, false, false, true, true];
const SHOWS_ENTREE = [true, true, true, false, true, true, true, true];

function formatAmount (qty, coin) {
	return coin === "EUR" ? Sanitaze.toFormatCurrency(qty) : `${qty} ${coin}`;
}

export function TradesItem ({ elem, onModal, onEditElement, invalid }) {
	const color = TYPE_COLOR[elem.type];
	const soft = TYPE_SOFT[elem.type];

	const showSortie = SHOWS_SORTIE[elem.type];
	const showEntree = SHOWS_ENTREE[elem.type];

	return <tr className={cn("border-t hover:bg-muted/40", invalid && "bg-[var(--status-critical-soft)] hover:bg-[var(--status-critical-soft)]")}>
		<td className="py-2.5 pl-4 pr-3 text-sm align-top">
			<div className="flex items-center gap-2">
				<div className="hidden sm:flex w-7 h-7 rounded-lg items-center justify-center flex-shrink-0" style={{ background: soft, color: color }}>
					<span className={`icon-${TYPE_ICON[elem.type]} text-xs`} />
				</div>
				<span className="font-medium whitespace-nowrap" style={{ color: color }}>{TYPE_LABEL[elem.type]}</span>
			</div>
			{(elem.importedFrom || elem.costPrice > 0 || elem.rawCategory || invalid) && <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:pl-9">
				{invalid && <Badge variant="outline" style={{ borderColor: 'var(--status-critical)55', color: 'var(--status-critical)' }}
									title={`Manque ${formatAmount(invalid.deficit, invalid.coin)} à cette date`}>
					<span className="icon-warning1 mr-1" />Incohérent · manque {formatAmount(invalid.deficit, invalid.coin)}
				</Badge>}
				{elem.importedFrom && <Badge variant="muted">Importé · {elem.importedFrom}</Badge>}
				{elem.costPrice > 0 && <Badge variant="muted">Frais {formatAmount(elem.costPrice, elem.costCoin)}</Badge>}
				{elem.rawCategory && <Badge variant="outline" style={{ borderColor: 'var(--status-critical)55', color: 'var(--status-critical)' }}>Catégorie d'origine · {elem.rawCategory}</Badge>}
			</div>}
		</td>

		<td className="py-2.5 pr-3 text-sm text-muted-foreground align-top whitespace-nowrap">
			<div className="font-medium text-foreground">{Sanitaze.toFormatDate(elem.tradeAt, 'D MMM YY')}</div>
			<div>{Sanitaze.toFormatDate(elem.tradeAt, 'H[h]mm')}</div>
		</td>

		<td className="py-2.5 pr-3 text-sm tabular-nums align-top whitespace-nowrap">
			{showSortie
				? <span className="inline-flex items-center gap-1.5">
					<CoinIcon coin={elem.fromCoin} />
					-{formatAmount(elem.fromNbToken, elem.fromCoin)}
				</span>
				: <span className="text-muted-foreground">—</span>
			}
		</td>

		<td className="py-2.5 pr-3 text-sm tabular-nums align-top whitespace-nowrap">
			{showEntree
				? (elem.toNbToken === null
					? <span className="text-muted-foreground">?</span>
					: <span className="inline-flex items-center gap-1.5">
						<CoinIcon coin={elem.toCoin} />
						+{formatAmount(elem.toNbToken, elem.toCoin)}
					</span>)
				: <span className="text-muted-foreground">—</span>
			}
		</td>

		<td className="py-2.5 pr-3 text-sm font-semibold tabular-nums text-right align-top whitespace-nowrap" style={{ color: color }}>
			{elem.totalReal === null
				? <span className="text-muted-foreground">—</span>
				: <>{elem.type === RETRAIT ? "-" : ""}{Sanitaze.toFormatCurrency(elem.totalReal)}</>
			}
			{elem.type === VENTE && elem.total !== null && elem.total !== elem.totalReal &&
				<div className="text-xs font-normal text-muted-foreground">
					{Sanitaze.toFormatCurrency(elem.total)} avec frais
				</div>
			}
		</td>

		<td className="py-2.5 pr-4 text-right align-top whitespace-nowrap">
			<div className="flex justify-end gap-0.5">
				<ButtonIcon type="default" icon="pencil" onClick={() => onEditElement(elem)}>Modifier</ButtonIcon>
				<ButtonIcon type="default" icon="trash" onClick={() => onModal('delete', elem)}>Supprimer</ButtonIcon>
			</div>
		</td>
	</tr>
}

TradesItem.propTypes = {
	elem: PropTypes.object.isRequired,
	invalid: PropTypes.shape({
		coin: PropTypes.string,
		deficit: PropTypes.number,
		action: PropTypes.string,
	}),
}
