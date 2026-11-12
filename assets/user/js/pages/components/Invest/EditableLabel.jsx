import React, { useState } from 'react';

/**
 * Click-to-rename text: used for both envelope and line names since both just need a plain string
 * swap, with the parent responsible for sending the full updated entity back to the API.
 */
export function EditableLabel ({ value, onCommit, className = '' }) {
	const [editing, setEditing] = useState(false);
	const [draft, setDraft] = useState(value);

	const startEdit = () => { setDraft(value); setEditing(true); };

	const commit = () => {
		const trimmed = draft.trim();
		setEditing(false);
		if (trimmed && trimmed !== value) onCommit(trimmed);
	};

	if (editing) {
		return <input
			autoFocus type="text" value={draft} onChange={e => setDraft(e.target.value)}
			onBlur={commit}
			onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
			className={`w-full px-2 py-0.5 border rounded-md bg-white ${className}`}
		/>;
	}

	return <button onClick={startEdit} className={`w-full text-left truncate hover:underline ${className}`} title="Cliquer pour renommer">
		{value}
	</button>;
}
