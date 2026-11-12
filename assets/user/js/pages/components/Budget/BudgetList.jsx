import React from 'react';

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { BudgetItem, BudgetItemRecurrent } from "@userPages/Budget/BudgetItem";

export function BudgetList ({ data, recurrencesData, onEdit, onModal, onActive, onCancel, onActiveRecurrence, sortable = false, onReorder, emptyMessage = "Aucune opération pour ce mois." }) {
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
	);

	let handleDragEnd = (e) => {
		let { active, over } = e;
		if (!over || active.id === over.id) return;

		let oldIndex = data.findIndex(d => d.id === active.id);
		let newIndex = data.findIndex(d => d.id === over.id);
		if (oldIndex === -1 || newIndex === -1) return;

		let reordered = arrayMove(data, oldIndex, newIndex);
		let draggedIndex = reordered.findIndex(d => d.id === active.id);

		onReorder(reordered[draggedIndex], reordered[draggedIndex - 1] ?? null, reordered[draggedIndex + 1] ?? null);
	}

	if (data.length === 0 && recurrencesData.length === 0) {
		return <div className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyMessage}</div>;
	}

	return <div className="flex flex-col">
		{recurrencesData.map(elem => (
			<BudgetItemRecurrent key={elem.id} elem={elem} onModal={onModal} onActive={onActiveRecurrence} />
		))}
		{sortable
			? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={data.map(d => d.id)} strategy={verticalListSortingStrategy}>
					{data.map(elem => (
						<BudgetItem key={elem.id} elem={elem} sortable
									onEdit={onEdit} onModal={onModal} onActive={onActive} onCancel={onCancel} />
					))}
				</SortableContext>
			</DndContext>
			: data.map(elem => (
				<BudgetItem key={elem.id} elem={elem}
							onEdit={onEdit} onModal={onModal} onActive={onActive} onCancel={onCancel} />
			))
		}
	</div>
}
