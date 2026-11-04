import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

import { enveloppeAllocation } from "@userPages/Invest/lib/compute";
import { EnveloppeCard } from "@userPages/Invest/Positions/EnveloppeCard";
import { NewEnveloppeForm } from "@userPages/Invest/Positions/NewEnveloppeForm";
import { AllocationChart } from "@userPages/Invest/Positions/AllocationChart";

export function PositionsTab ({ tracking, onSaveEnveloppe, onDeleteEnveloppe, onSaveLine, onDeleteLine, onSaveSnapshot }) {
	const { enveloppes, buCategories, totalInvested } = tracking;
	const allocation = enveloppeAllocation(enveloppes);

	return <div className="flex flex-col gap-4">
		{allocation.length > 0 && <Card className="p-5">
			<h3 className="font-semibold mb-3">Allocation par enveloppe</h3>
			<AllocationChart data={allocation} />
		</Card>}

		{enveloppes.map(e => <EnveloppeCard
			key={e.id} enveloppe={e} totalInvested={totalInvested}
			onSaveEnveloppe={onSaveEnveloppe} onSaveLine={onSaveLine} onSaveSnapshot={onSaveSnapshot}
			onDeleteLine={onDeleteLine} onDeleteEnveloppe={onDeleteEnveloppe}
		/>)}

		<NewEnveloppeForm buCategories={buCategories} onSaveEnveloppe={onSaveEnveloppe} />
	</div>;
}
