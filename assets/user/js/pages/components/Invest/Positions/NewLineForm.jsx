import React, { useState } from 'react';

import { Button } from "@tailwindComponents/Elements/Button";

import { todayISO } from "@userPages/Invest/lib/format";

const INPUT_CLASS = "px-2.5 py-1.5 rounded-md border-0 ring-1 ring-inset ring-gray-300 text-sm bg-gray-100 focus:ring-1 focus:ring-inset focus:ring-gray-500";

export function NewLineForm ({ enveloppeId, onSaveLine, onSaveSnapshot }) {
	const [name, setName] = useState('');
	const [isin, setIsin] = useState('');
	const [value, setValue] = useState('');

	const add = () => {
		if (!name.trim()) return;
		onSaveLine({ enveloppeId, name: name.trim(), isin: isin.trim() || null }).then(res => {
			const v = parseFloat(String(value).replace(',', '.'));
			const lineId = res?.id;
			setName(''); setIsin(''); setValue('');
			if (lineId && !Number.isNaN(v)) {
				onSaveSnapshot(lineId, todayISO(), v);
			}
		});
	};

	return <div className="flex gap-2 flex-wrap items-end pt-2">
		<input type="text" placeholder="Nouvelle ligne (ex. MSCI World ETF)" value={name} onChange={e => setName(e.target.value)}
			   className={`${INPUT_CLASS} flex-1 min-w-[180px]`} />
		<input type="text" placeholder="ISIN (optionnel)" value={isin} onChange={e => setIsin(e.target.value)}
			   className={`${INPUT_CLASS} w-[160px]`} />
		<input type="text" inputMode="decimal" placeholder="Valeur (€)" value={value} onChange={e => setValue(e.target.value)}
			   className={`${INPUT_CLASS} w-[110px]`} />
		<Button type="blue" pa="py-1.5 px-4" onClick={add}>Ajouter</Button>
	</div>;
}
