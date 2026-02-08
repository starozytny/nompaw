import React from 'react';

import Sanitaze from '@commonFunctions/sanitaze';

import { Badge } from "@tailwindComponents/Elements/Badge";
import { ButtonIcon } from "@tailwindComponents/Elements/Button";

export function BudgetItem ({ elem, onEdit, onModal, onActive, onCancel }) {
	let badgesBudget = ['red', 'blue', 'yellow', 'gray', 'gray'];
	let typesBudget = ['text-red-600', 'text-blue-500', 'text-yellow-500', 'text-gray-700', 'text-gray-700'];
	let bgTypes = ['bg-red-50', 'bg-blue-50', 'bg-yellow-50', 'bg-gray-50', 'bg-gray-50'];

	const isDeleted = elem.type === 3;
	const isInactive = !elem.isActive;

	return <div className={`item border-b last:border-b-0 transition-all ${
		isDeleted
			? "opacity-40 bg-gray-100"
			: (isInactive
					? "opacity-60 hover:opacity-80"
					: "hover:bg-gray-50"
			)
	}`}>
		<div className="item-content">
			<div className="item-infos">
				<div className={`hidden sm:flex w-10 h-10 rounded-lg items-center justify-center flex-shrink-0 ${bgTypes[elem.type]}`}>
					<span className={`icon-${elem.typeIcon} ${typesBudget[elem.type]}`}></span>
				</div>
				<div className="col-1">
					<div className="font-medium text-sm text-gray-900">
						<span>{Sanitaze.toFormatDate(elem.dateAt, 'Do MMM')}</span>
					</div>
					<div className="text-xs text-gray-500">
						{Sanitaze.toFormatDate(elem.dateAt, 'H[h]mm')}
					</div>
				</div>
				<div className="col-2 flex-1 min-w-0">
					<div className={`font-semibold mb-1 truncate ${isDeleted ? 'line-through' : ''}`}>
						<span>{elem.name}</span>
					</div>
					<div className="flex flex-wrap gap-1">
						{elem.recurrenceId && (
							<Badge type="gray">
								<span className="icon-refresh1 text-xs mr-1"></span>Récurrence
							</Badge>
						)}
						{isInactive && !isDeleted && (
							<Badge type="gray" onClick={() => onActive(elem)}>
								<span className="icon-eye-line text-xs mr-1"></span>Prévisionnel
							</Badge>
						)}
						{elem.type !== 4 && elem.category && (
							<Badge type={badgesBudget[elem.category.type]}>{elem.category.name}</Badge>
						)}
					</div>
				</div>
				<div className="col-3 text-right">
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
	let typesBudget = ['text-red-600', 'text-blue-600', 'text-yellow-600', 'text-gray-700', 'text-gray-700'];
	let bgTypes = ['bg-red-50', 'bg-blue-50', 'bg-yellow-50', 'bg-gray-50', 'bg-gray-50'];

	return <div className="item border-b last:border-b-0 bg-gray-50/30 hover:bg-gray-50/50 transition-all border-l-4 border-l-gray-400">
		<div className="item-content">
			<div className="item-infos flex items-center gap-4">
				<div className="col-1">
					<div className={`flex w-10 h-10 rounded-lg items-center justify-center flex-shrink-0 ${bgTypes[elem.type]} opacity-60`}>
						<span className={`icon-${elem.typeIcon} ${typesBudget[elem.type]}`}></span>
					</div>
				</div>

				<div className="col-2 flex-1 min-w-0">
					<div className="font-semibold text-gray-600 mb-1 truncate">
						<span>{elem.name}</span>
					</div>
					<div className="cursor-pointer inline-block">
						<Badge type="blue" onClick={() => onActive(elem)}>
							<span className="icon-add text-xs mr-1"></span>
							Activer cette récurrence
						</Badge>
					</div>
				</div>

				<div className="col-3 text-right">
					<div className={`font-semibold text-sm ${typesBudget[elem.type]} opacity-60`}>
						<span className={`icon-${elem.typeIcon} text-sm mr-1`}></span>
						{Sanitaze.toFormatCurrency(elem.price)}
					</div>
				</div>

				<div className="col-4 actions flex gap-1 flex-shrink-0">
					<ButtonIcon type="default" icon="trash" onClick={() => onModal('trashRef', elem)}>Supprimer</ButtonIcon>
				</div>
			</div>
		</div>
	</div>
}
