import React from 'react';

import Sanitaze from '@commonFunctions/sanitaze';

import { Badge } from "@tailwindComponents/Elements/Badge";
import { ButtonIcon } from "@tailwindComponents/Elements/Button";

export function BudgetItem ({ elem, onEdit, onModal, onActive, onCancel }) {
	let badgesBudget = ['red', 'blue', 'yellow', 'gray', 'gray'];
	let typesBudget = ['text-red-600', 'text-blue-500', 'text-yellow-500', 'text-gray-700', 'text-gray-700'];

	return <div className={`item border-t hover:bg-slate-50${!elem.isActive ? " opacity-50" : ""}${elem.type === 3 ? " opacity-80 line-through" : ""}`}>
		<div className="item-content">
			<div className="item-infos">
				<div className="col-1">
					<div className="font-medium text-sm">
						<span>{Sanitaze.toFormatDate(elem.dateAt, 'Do MMM')}</span>
					</div>
				</div>
				<div className="col-2">
					<div className="font-semibold"><span>{elem.name}</span></div>
					<div className="flex flx-wrap gap-1">
						{elem.type !== 4 && elem.category && <Badge type={badgesBudget[elem.category.type]}>{elem.category.name}</Badge>}
						{elem.recurrenceId && <Badge type="gray">Récurrence</Badge>}
						{!elem.isActive && <Badge type="gray" onClick={() => onActive(elem)}>Prévisionnel</Badge>}
					</div>
				</div>
				<div className="col-3">
					<div className={`font-semibold text-sm ${typesBudget[elem.type]}`}>
						<span className={`icon-${elem.typeIcon}`}></span> {Sanitaze.toFormatCurrency(elem.price)}
					</div>
				</div>
				<div className="col-4 actions">
					{elem.type === 3
						? <ButtonIcon type="default" icon="refresh1" onClick={() => onCancel(elem)} tooltipWidth={150}>Annuler la suppression</ButtonIcon>
						: <>
							<ButtonIcon type="default" icon="pencil" onClick={() => onEdit(elem)}>Modifier</ButtonIcon>
							<ButtonIcon type="default" icon="trash" onClick={() => onModal('deleteRef', elem)}>Supprimer</ButtonIcon>
						</>
					}
				</div>
			</div>
		</div>
	</div>
}

export function BudgetItemRecurrent ({ elem, onModal, onActive }) {
	let typesBudget = ['text-red-600', 'text-blue-500', 'text-yellow-500', 'text-gray-700', 'text-gray-700'];
	return <div className="item border-t hover:bg-slate-50 opacity-50">
		<div className="item-content">
			<div className="item-infos">
				<div className="col-1">
					<div className="infos">
						<div className="font-medium text-sm">
							<span>-</span>
						</div>
					</div>
				</div>
				<div className="col-2">
					<div className="font-semibold text-gray-600"><span>{elem.name}</span></div>
					<div className="cursor-pointer">
						<Badge type="gray" onClick={() => onActive(elem)}>Activer cette récurrence</Badge>
					</div>
				</div>
				<div className="col-3">
					<div className={`font-semibold text-sm ${typesBudget[elem.type]}`}>
						<span className={`icon-${elem.typeIcon}`}></span> {Sanitaze.toFormatCurrency(elem.price)}
					</div>
				</div>
				<div className="col-4 actions">
					<ButtonIcon type="default" icon="trash" onClick={() => onModal('trashRef', elem)}>Supprimer</ButtonIcon>
				</div>
			</div>
		</div>
	</div>
}
