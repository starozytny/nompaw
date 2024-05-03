import React from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";

import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Badge } from "@tailwindComponents/Elements/Badge";

const ACHAT = 0;
const VENTE = 1;
const DEPOT = 2;
const RETRAIT = 3;
const RECUP = 4;
const STAKING = 5;
const TRANSFERT = 6;

export function TradesItem ({ elem, onEditElement }) {
	let typesString = ['Achat', "Vente", "Dépôt", "Retrait", "Récup.", "Staking", "Transfert"];
	let typesBadge = ['blue', "red", "indigo", "yellow", "indigo", "gray", "gray"];

	return <div className="item border-t hover:bg-slate-50">
		<div className="item-content">
			<div className="item-infos text-sm xl:text-base">
				<div className="col-1">
					<div className="text-sm font-medium">{Sanitaze.toFormatDate(elem.tradeAt, 'L')}</div>
					<div className="text-xs">{Sanitaze.toFormatDate(elem.tradeAt, 'LT')}</div>
				</div>
				<div className="col-2">
					<Badge type={typesBadge[elem.type]}>{typesString[elem.type]}</Badge>
					<div className="text-sm">{elem.importedFrom}</div>
				</div>
				<div className="col-3">
					{elem.type === DEPOT
						? null
						: <div className="inline-block rounded-full bg-gray-100 py-1 px-2 min-w-24 text-right">
							<span className="text-sm">{Sanitaze.toFormatCurrency(elem.fromPrice)}</span>
							<span className="inline-block ml-2 text-xs bg-white py-1 px-2 rounded-full">{elem.fromCoin}</span>
						</div>
					}
				</div>
				<div className="col-4">
					{elem.type === DEPOT
						? null
						: <div className="text-sm">{elem.nbToken}</div>
					}
				</div>
				<div className="col-5">
					{elem.type === DEPOT
						? null
						: <div className="text-sm">{elem.costPrice} {elem.costCoin}</div>
					}
				</div>
				<div className="col-6">
					<div className={`inline-block rounded-full py-1 px-2 ${elem.type === RETRAIT ? "bg-red-100" : (elem.type === DEPOT ? "bg-indigo-100" : "bg-gray-100")}`}>
						<span className="inline-block mr-2 text-xs bg-white py-1 px-2 rounded-full">{elem.toCoin}</span>
						<span className="text-sm">{elem.type === RETRAIT ? "-" : ""}{elem.toCoin === "EUR" ? Sanitaze.toFormatCurrency(elem.nbToken) : elem.nbToken}</span>
					</div>
				</div>
				<div className="col-7">
					<div className={elem.type === RETRAIT ? "text-red-500" : (elem.type === DEPOT ? "text-indigo-600" : "")}>
						{elem.type === RETRAIT ? "-" : ""}{Sanitaze.toFormatCurrency(elem.total)}
					</div>
				</div>
				<div className="col-8 actions">
					<ButtonIcon type="default" icon="pencil" onClick={() => onEditElement(elem)}>Modifier</ButtonIcon>
				</div>
			</div>
		</div>
	</div>
}

TradesItem.propTypes = {
	elem: PropTypes.object.isRequired,
}
