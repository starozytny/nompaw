import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Badge } from "@shadcnComponents/ui/badge";

import { enveloppeValue, totalInvestedFor } from "@userPages/Invest/lib/compute";
import { eur, dateFr } from "@userPages/Invest/lib/format";
import { EditableLabel } from "@userPages/Invest/EditableLabel";
import { ConfirmDialog } from "@userPages/Invest/ConfirmDialog";
import { LineRow } from "@userPages/Invest/Positions/LineRow";
import { NewLineForm } from "@userPages/Invest/Positions/NewLineForm";

export function EnveloppeCard ({ enveloppe, totalInvested, onSaveEnveloppe, onSaveLine, onSaveSnapshot, onDeleteLine, onDeleteEnveloppe }) {
	const [confirmDeleteEnveloppe, setConfirmDeleteEnveloppe] = useState(false);
	const [lineToDelete, setLineToDelete] = useState(null);

	const val = enveloppeValue(enveloppe);
	const invested = totalInvestedFor(enveloppe.buCategoryId, totalInvested);
	const gain = invested != null ? val - invested : null;

	const renameEnveloppe = (name) => onSaveEnveloppe({
		id: enveloppe.id, name, type: enveloppe.type, buCategoryId: enveloppe.buCategoryId,
		taxExemptDate: enveloppe.taxExemptDate, notes: enveloppe.notes, position: enveloppe.position,
	});

	const renameLine = (line, name) => onSaveLine({
		id: line.id, enveloppeId: enveloppe.id, name, isin: line.isin,
		targetAllocationPct: line.targetAllocationPct, position: line.position, notes: line.notes,
	});

	return <Card className="p-5">
		<div className="flex flex-wrap justify-between items-start gap-3 mb-3">
			<div>
				<div className="flex items-center gap-2 mb-1">
					<EditableLabel value={enveloppe.name} onCommit={renameEnveloppe} className="font-semibold" />
					<Badge variant="outline">{enveloppe.typeString}</Badge>
				</div>
				{enveloppe.taxExemptDate && <div className="text-xs text-muted-foreground">Exonération fiscale à partir du {dateFr(enveloppe.taxExemptDate)}</div>}
			</div>
			<div className="text-right">
				<div className="text-lg font-bold">{eur(val)}</div>
				{invested != null && <div className={`text-xs ${gain >= 0 ? 'text-[var(--status-good)]' : 'text-[var(--status-critical)]'}`}>
					{gain >= 0 ? '+' : ''}{eur(gain)} vs {eur(invested)} versé
				</div>}
			</div>
		</div>

		{enveloppe.lines.length > 0 && <div className="overflow-x-auto mb-2">
			<table className="w-full text-sm table-fixed">
				<colgroup>
					<col className="w-[34%]" />
					<col className="w-[18%]" />
					<col className="w-[14%]" />
					<col className="w-[14%]" />
					<col className="w-[10%]" />
					<col className="w-[10%]" />
				</colgroup>
				<thead>
					<tr className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
						<th className="text-left px-3 py-2 font-semibold">Ligne</th>
						<th className="text-right px-3 py-2 font-semibold">Valeur</th>
						<th className="text-right px-3 py-2 font-semibold">Allocation</th>
						<th className="text-right px-3 py-2 font-semibold">Au</th>
						<th className="px-3 py-2"></th>
						<th className="px-3 py-2"></th>
					</tr>
				</thead>
				<tbody>
					{enveloppe.lines.map(line => <LineRow
						key={line.id} line={line} envTotal={val}
						onRename={(name) => renameLine(line, name)}
						onSaveSnapshot={onSaveSnapshot} onDeleteLine={() => setLineToDelete(line)}
					/>)}
				</tbody>
			</table>
		</div>}

		<NewLineForm enveloppeId={enveloppe.id} onSaveLine={onSaveLine} onSaveSnapshot={onSaveSnapshot} />

		<div className="mt-3 text-right">
			<button onClick={() => setConfirmDeleteEnveloppe(true)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-red-600">
				<span className="icon-trash"></span> Supprimer l'enveloppe
			</button>
		</div>

		<ConfirmDialog
			open={confirmDeleteEnveloppe} onOpenChange={setConfirmDeleteEnveloppe}
			title="Supprimer l'enveloppe"
			description={`Supprimer définitivement "${enveloppe.name}" et toutes ses lignes (y compris leur historique de valorisation) ?`}
			onConfirm={() => onDeleteEnveloppe(enveloppe.id)}
		/>

		<ConfirmDialog
			open={!!lineToDelete} onOpenChange={(open) => !open && setLineToDelete(null)}
			title="Supprimer la ligne"
			description={lineToDelete ? `Supprimer définitivement "${lineToDelete.name}" et son historique de valorisation ?` : ''}
			onConfirm={() => onDeleteLine(lineToDelete.id)}
		/>
	</Card>;
}
