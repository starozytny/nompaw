import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@shadcnComponents/ui/button";

import { makeBilan } from "@userPages/Running/Suivi/lib/bilan";

export function BilanCard ({ tracking, onSaveNotes }) {
	const [notes, setNotes] = useState(tracking.notes);
	const [scope, setScope] = useState('week');
	const [bilan, setBilan] = useState('');
	const [msg, setMsg] = useState('');

	const generateAndCopy = () => {
		const text = makeBilan(scope, tracking);
		setBilan(text);
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(text).then(() => setMsg('Bilan copié ✓')).catch(() => setMsg('Copie impossible : sélectionne le texte ci-dessous (Ctrl+C).'));
		} else {
			setMsg('Sélectionne le texte ci-dessous et copie-le (Ctrl+C).');
		}
	};

	return <Card className="border-l-4 border-l-primary p-5">
		<h3 className="font-semibold mb-1.5">Bilan à copier pour Claude</h3>
		<p className="text-sm text-muted-foreground mb-3">
			Génère un résumé compact (prévu contre réalisé, allures, FC, ressenti, notes), à coller dans la conversation
			pour ajuster les semaines suivantes.
		</p>

		<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground mb-3">
			Sensations, douleurs, sommeil, fatigue de la période
			<textarea
				rows={2}
				className="w-full px-2.5 py-1.5 border rounded-md text-sm font-normal normal-case tracking-normal bg-white"
				placeholder="Ex. : jambes lourdes mardi, petite gêne au mollet gauche, bonne semaine côté sommeil…"
				value={notes}
				onChange={e => setNotes(e.target.value)}
				onBlur={() => onSaveNotes(notes)}
			/>
		</label>

		<div className="flex gap-2.5 flex-wrap items-center">
			<select value={scope} onChange={e => setScope(e.target.value)} className="px-2.5 py-1.5 border rounded-md text-sm bg-white">
				<option value="week">Dernière semaine commencée</option>
				<option value="4w">4 dernières semaines</option>
				<option value="all">Depuis le début du plan</option>
			</select>
			<Button onClick={generateAndCopy}>Générer et copier le bilan</Button>
			{msg && <span className="text-sm font-semibold text-[var(--status-good)]">{msg}</span>}
		</div>

		{bilan && <textarea
			readOnly
			rows={12}
			className="w-full mt-3 px-3 py-2 border rounded-md text-xs font-mono bg-muted/30"
			value={bilan}
		/>}
	</Card>
}
