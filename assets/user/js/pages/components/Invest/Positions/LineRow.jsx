import React, { useState } from 'react';

import { eur, pct, todayISO } from "@userPages/Invest/lib/format";
import { EditableLabel } from "@userPages/Invest/EditableLabel";

const INPUT_CLASS = "w-full px-2 py-1 rounded-md border-0 ring-1 ring-inset ring-gray-300 text-sm text-right bg-gray-100 focus:ring-1 focus:ring-inset focus:ring-gray-500";

export function LineRow ({ line, envTotal, onRename, onSaveSnapshot, onDeleteLine }) {
	const [editing, setEditing] = useState(false);
	const [value, setValue] = useState('');
	const [addingContrib, setAddingContrib] = useState(false);
	const [contribAmount, setContribAmount] = useState('');

	const pctOfEnv = envTotal ? ((line.currentValue ?? 0) / envTotal) * 100 : 0;

	const startEdit = () => {
		setValue(line.currentValue != null ? String(line.currentValue).replace('.', ',') : '');
		setEditing(true);
	};

	const commit = () => {
		const v = parseFloat(String(value).replace(',', '.'));
		if (!Number.isNaN(v) && v >= 0) {
			onSaveSnapshot(line.id, todayISO(), v).then(() => setEditing(false));
		} else {
			setEditing(false);
		}
	};

	const commitContrib = () => {
		const delta = parseFloat(String(contribAmount).replace(',', '.'));
		if (!Number.isNaN(delta) && delta !== 0) {
			const newValue = Math.max(0, (line.currentValue ?? 0) + delta);
			onSaveSnapshot(line.id, todayISO(), newValue).then(() => { setAddingContrib(false); setContribAmount(''); });
		} else {
			setAddingContrib(false);
		}
	};

	return <tr className="border-t">
		<td className="px-3 py-2">
			<EditableLabel value={line.name} onCommit={onRename} className="font-medium" />
			{line.isin && <div className="text-xs text-muted-foreground">{line.isin}</div>}
		</td>
		<td className="px-3 py-2 text-right">
			{editing
				? <input autoFocus type="text" inputMode="decimal" value={value} onChange={e => setValue(e.target.value)}
						 onBlur={commit} onKeyDown={e => e.key === 'Enter' && commit()}
						 className={INPUT_CLASS} />
				: <button onClick={startEdit} className="w-full font-semibold text-right hover:underline">{eur(line.currentValue)}</button>
			}
		</td>
		<td className="px-3 py-2 text-right text-muted-foreground">{pct(pctOfEnv)}</td>
		<td className="px-3 py-2 text-right text-xs text-muted-foreground">{line.currentDate ? line.currentDate.split('-').reverse().join('/') : '—'}</td>
		<td className="px-3 py-2 text-right">
			{addingContrib
				? <input autoFocus type="text" inputMode="decimal" placeholder="+100" value={contribAmount} onChange={e => setContribAmount(e.target.value)}
						 onBlur={commitContrib} onKeyDown={e => e.key === 'Enter' && commitContrib()}
						 className={INPUT_CLASS} />
				: <button onClick={() => setAddingContrib(true)} title="Ajouter un versement" className="w-full font-bold text-muted-foreground hover:text-[var(--status-good)]">+</button>
			}
		</td>
		<td className="px-3 py-2 text-right">
			<button onClick={() => onDeleteLine(line.id)} className="text-muted-foreground hover:text-red-600 px-2">
				<span className="icon-trash"></span>
			</button>
		</td>
	</tr>;
}
