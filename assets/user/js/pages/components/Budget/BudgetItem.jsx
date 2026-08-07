import React from 'react';

import Sanitaze from '@commonFunctions/sanitaze';
import { cn } from "@shadcnComponents/lib/utils";

import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Badge } from "@shadcnComponents/ui/badge";

const TYPE_COLOR = ['var(--cat-expense)', 'var(--cat-income)', 'var(--cat-saving)', 'hsl(var(--muted-foreground))', 'hsl(var(--muted-foreground))'];
const TYPE_SOFT = ['var(--cat-expense-soft)', 'var(--cat-income-soft)', 'var(--cat-saving-soft)', 'hsl(var(--muted))', 'hsl(var(--muted))'];

export function BudgetItem ({ elem, onEdit, onModal, onActive, onCancel }) {
	const isDeleted = elem.type === 3;
	const isInactive = !elem.isActive;

	return <div
		className={cn(
			"flex items-center gap-3 border-b border-l-4 border-l-transparent px-4 py-2.5 last:border-b-0 transition-colors",
			isDeleted ? "opacity-40" : (isInactive ? "border-l-[var(--status-critical)] bg-[var(--status-critical-soft)]" : "hover:bg-accent/50")
		)}
	>
		<div
			className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center flex-shrink-0"
			style={{
				background: isInactive && !isDeleted ? 'transparent' : TYPE_SOFT[elem.type],
				color: TYPE_COLOR[elem.type],
				...(isInactive && !isDeleted ? { border: `1.5px dashed ${TYPE_COLOR[elem.type]}` } : {}),
			}}
		>
			<span className={`icon-${elem.typeIcon}`}></span>
		</div>

		<div className="w-12 flex-shrink-0 text-xs text-muted-foreground leading-tight">
			<div className="font-medium text-foreground">{Sanitaze.toFormatDate(elem.dateAt, 'D MMM')}</div>
			<div>{Sanitaze.toFormatDate(elem.dateAt, 'H[h]mm')}</div>
		</div>

		<div className="flex-1 min-w-0">
			<div className={cn("font-medium text-sm truncate", isDeleted && "line-through")}>{elem.name}</div>
			<div className="flex flex-wrap gap-1 mt-1">
				{isInactive && !isDeleted && (
					<Badge
						className="cursor-pointer border-transparent bg-[var(--status-critical)] text-white hover:opacity-90"
						onClick={() => onActive(elem)}
					>
						<span className="icon-eye-line text-[10px] mr-1"></span>Non réalisée · valider
					</Badge>
				)}
				{elem.recurrenceId && (
					<Badge variant="muted">
						<span className="icon-refresh1 text-[10px] mr-1"></span>Récurrent
					</Badge>
				)}
				{elem.type !== 4 && elem.category && (
					<Badge variant="outline" style={{ borderColor: TYPE_COLOR[elem.category.type] + '55', color: TYPE_COLOR[elem.category.type] }}>
						{elem.category.name}
					</Badge>
				)}
			</div>
		</div>

		<div
			className={cn("text-sm font-semibold tabular-nums whitespace-nowrap", isInactive && !isDeleted && "border-b-2 border-dashed pb-0.5")}
			style={{ color: TYPE_COLOR[elem.type], borderColor: isInactive && !isDeleted ? 'var(--status-critical)' : undefined }}
		>
			{Sanitaze.toFormatCurrency(elem.price)}
		</div>

		<div className="flex gap-0.5 flex-shrink-0">
			{elem.type === 3
				? <ButtonIcon type="default" icon="refresh1" onClick={() => onCancel(elem)} tooltipWidth={150}>Annuler la suppression</ButtonIcon>
				: <>
					<ButtonIcon type="default" icon="pencil" onClick={() => onEdit(elem)}>Modifier</ButtonIcon>
					<ButtonIcon type="default" icon="trash" onClick={() => onModal('deleteRef', elem)}>Supprimer</ButtonIcon>
				</>
			}
		</div>
	</div>
}

export function BudgetItemRecurrent ({ elem, onModal, onActive }) {
	return <div className="flex items-center gap-3 border-b border-l-2 border-l-muted-foreground/30 bg-muted/30 px-4 py-2.5 last:border-b-0 hover:bg-muted/50 transition-colors">
		<div className="hidden sm:flex w-9 h-9 rounded-lg items-center justify-center flex-shrink-0 opacity-60" style={{ background: TYPE_SOFT[elem.type], color: TYPE_COLOR[elem.type] }}>
			<span className={`icon-${elem.typeIcon}`}></span>
		</div>

		<div className="flex-1 min-w-0">
			<div className="font-medium text-sm text-muted-foreground truncate">{elem.name}</div>
			<Badge
				variant="outline"
				className="cursor-pointer mt-1 border-[var(--cat-income)]/40 text-[var(--cat-income)]"
				onClick={() => onActive(elem)}
			>
				<span className="icon-add text-[10px] mr-1"></span>Activer cette récurrence
			</Badge>
		</div>

		<div className="text-sm font-semibold tabular-nums opacity-60 whitespace-nowrap" style={{ color: TYPE_COLOR[elem.type] }}>
			{Sanitaze.toFormatCurrency(elem.price)}
		</div>

		<div className="flex gap-0.5 flex-shrink-0">
			<ButtonIcon type="default" icon="trash" onClick={() => onModal('trashRef', elem)}>Supprimer</ButtonIcon>
		</div>
	</div>
}
