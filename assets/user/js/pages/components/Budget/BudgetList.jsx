import React from 'react';

import { BudgetItem, BudgetItemRecurrent } from "@userPages/Budget/BudgetItem";

export function BudgetList ({ data, recurrencesData, onEdit, onModal, onActive, onCancel, onActiveRecurrence, emptyMessage = "Aucune opération pour ce mois." }) {
	if (data.length === 0 && recurrencesData.length === 0) {
		return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
	}

	return <div className="flex flex-col">
		{recurrencesData.map(elem => (
			<BudgetItemRecurrent key={elem.id} elem={elem} onModal={onModal} onActive={onActiveRecurrence} />
		))}
		{data.map(elem => (
			<BudgetItem key={elem.id} elem={elem}
						onEdit={onEdit} onModal={onModal} onActive={onActive} onCancel={onCancel} />
		))}
	</div>
}
