import React from "react";
import PropTypes from 'prop-types';

import Sanitaze from "@commonFunctions/sanitaze";

import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Badge } from "@tailwindComponents/Elements/Badge";

export function TradesItem ({ elem, onEditElement }) {
	let typesString = ['Achat', "Vente", "Dépôt", "Retrait", "Récup.", "Staking", "Transfert"];
	let typesBadge = ['blue', "red", "gray", "gray", "gray", "gray", "gray"];

	return <div className="item border-t hover:bg-slate-50">
		<div className="item-content">
			<div className="item-infos text-sm xl:text-base">
				<div className="col-1">
					{Sanitaze.toFormatDate(elem.tradeAt, 'DD/MM/YYYY à hh:mm')}
				</div>
				<div className="col-2">
					<Badge type={typesBadge[elem.type]}>{typesString[elem.type]}</Badge>
				</div>
				<div className="col-3">
					<div className="font-semibold">{elem.fromCoin}/{elem.toCoin}</div>
				</div>
				<div className="col-4">
					{Sanitaze.toFormatCurrency(elem.fromPrice)}
				</div>
				<div className="col-5">
					<div>{elem.nbToken}</div>
				</div>
				<div className="col-6">
					<div>{elem.costPrice} {elem.costCoin}</div>
				</div>
				<div className="col-7">
					{Sanitaze.toFormatCurrency(elem.toPrice)}
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
