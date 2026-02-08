import React from 'react';

import { Alert } from "@tailwindComponents/Elements/Alert";

import { BudgetItem, BudgetItemRecurrent } from "@userPages/Budget/BudgetItem";

export function BudgetList ({ data, recurrencesData, onEdit, onModal, onActive, onCancel, onActiveRecurrence }) {
	return <div className="list">
		<div className="list-table bg-white overflow-hidden">
			<div className="items items-budget">
				{data.length > 0 || recurrencesData.length > 0
					? <>
						{recurrencesData.map(elem => {
							return <BudgetItemRecurrent key={elem.id} elem={elem} onModal={onModal} onActive={onActiveRecurrence} />
						})}
						{data.map(elem => {
							return <BudgetItem key={elem.id} elem={elem}
											   onEdit={onEdit} onModal={onModal} onActive={onActive} onCancel={onCancel} />
						})}
					</>
					: <div className="item border-t">
						<Alert type="gray">Aucun résultat.</Alert>
					</div>
				}
			</div>
		</div>
	</div>
}
