import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

import { enveloppeAllocation, lineAllocationAcrossEnveloppes } from "@userPages/Invest/lib/compute";
import { EnveloppeCard } from "@userPages/Invest/Positions/EnveloppeCard";
import { NewEnveloppeForm } from "@userPages/Invest/Positions/NewEnveloppeForm";
import { AllocationChart } from "@userPages/Invest/Positions/AllocationChart";

export function PositionsTab ({ tracking, onSaveEnveloppe, onDeleteEnveloppe, onSaveLine, onDeleteLine, onSaveSnapshot }) {
	const { enveloppes, buCategories, totalInvested } = tracking;
	const allocationByEnveloppe = enveloppeAllocation(enveloppes);
	const allocationByLine = lineAllocationAcrossEnveloppes(enveloppes);

	return <div className="flex flex-col gap-4">
		{allocationByEnveloppe.length > 0 && <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
			<Card className="p-5">
				<h3 className="font-semibold mb-3">Allocation par enveloppe</h3>
				<AllocationChart data={allocationByEnveloppe} />
			</Card>
			<Card className="p-5">
				<h3 className="font-semibold mb-3">Allocation par ligne (toutes enveloppes)</h3>
				<AllocationChart data={allocationByLine} />
			</Card>
		</div>}

		{enveloppes.map(e => <EnveloppeCard
			key={e.id} enveloppe={e} totalInvested={totalInvested}
			onSaveEnveloppe={onSaveEnveloppe} onSaveLine={onSaveLine} onSaveSnapshot={onSaveSnapshot}
			onDeleteLine={onDeleteLine} onDeleteEnveloppe={onDeleteEnveloppe}
		/>)}

		<NewEnveloppeForm buCategories={buCategories} onSaveEnveloppe={onSaveEnveloppe} />
	</div>;
}
