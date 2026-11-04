import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";

const TYPES = [
	{ value: 0, label: 'PEA' },
	{ value: 1, label: 'CTO' },
	{ value: 2, label: 'Assurance vie' },
	{ value: 3, label: 'Livret' },
	{ value: 4, label: 'Autre' },
];

const INPUT_CLASS = "px-2.5 py-1.5 rounded-md border-0 ring-1 ring-inset ring-gray-300 text-sm font-normal normal-case tracking-normal bg-gray-100 focus:ring-1 focus:ring-inset focus:ring-gray-500";

export function NewEnveloppeForm ({ buCategories, onSaveEnveloppe }) {
	const [name, setName] = useState('');
	const [type, setType] = useState(0);
	const [buCategoryId, setBuCategoryId] = useState('');
	const [open, setOpen] = useState(false);

	const add = () => {
		if (!name.trim()) return;
		onSaveEnveloppe({ name: name.trim(), type, buCategoryId: buCategoryId || null }).then(() => {
			setName(''); setType(0); setBuCategoryId(''); setOpen(false);
		});
	};

	if (!open) {
		return <Button type="default" iconLeft="add" onClick={() => setOpen(true)}>Nouvelle enveloppe</Button>;
	}

	return <Card className="p-4">
		<div className="flex gap-2.5 flex-wrap items-end">
			<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground w-[200px]">
				Nom
				<input type="text" placeholder="PEA XTB" value={name} onChange={e => setName(e.target.value)} className={INPUT_CLASS} />
			</label>
			<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground w-[150px]">
				Type
				<select value={type} onChange={e => setType(Number(e.target.value))} className={INPUT_CLASS}>
					{TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
				</select>
			</label>
			<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground w-[220px]">
				Catégorie Planificateur liée
				<select value={buCategoryId} onChange={e => setBuCategoryId(e.target.value)} className={INPUT_CLASS}>
					<option value="">Aucune</option>
					{buCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
				</select>
			</label>
			<Button type="blue" onClick={add}>Créer</Button>
			<Button type="default" onClick={() => setOpen(false)}>Annuler</Button>
		</div>
	</Card>;
}
