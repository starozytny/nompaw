import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@shadcnComponents/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";

import { todayISO } from "@userPages/Running/Suivi/lib/format";

export function BackupCard ({ tracking, onRestoreBackup, onReset }) {
	const [msg, setMsg] = useState(null);
	const [confirmReset, setConfirmReset] = useState(false);

	const exportBackup = () => {
		const blob = new Blob([JSON.stringify(tracking, null, 1)], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = `suivi-course-${todayISO()}.json`;
		document.body.appendChild(a); a.click(); a.remove();
		setMsg({ text: '✓ Sauvegarde téléchargée.' });
	};

	const importBackup = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const data = JSON.parse(String(reader.result));
				if (!data || typeof data.log !== 'object') throw new Error('format');

				// Accepts both the current {log, activities, weights, notes} shape and the legacy
				// localStorage export {v, log, hist, meta: {notes, weights}} from the pre-DB page.
				const normalized = Array.isArray(data.activities) || Array.isArray(data.weights)
					? data
					: { log: data.log, activities: data.hist || [], weights: data.meta?.weights || [], notes: data.meta?.notes || '' };

				onRestoreBackup(normalized).then(() => setMsg({ text: '✓ Sauvegarde restaurée.' }));
			} catch (e) {
				setMsg({ error: 'Fichier de sauvegarde invalide.' });
			}
		};
		reader.readAsText(file);
	};

	const reset = () => {
		onReset().then(() => setMsg({ text: '✓ Suivi réinitialisé.' }));
	};

	return <Card className="p-5">
		<h3 className="font-semibold mb-1.5">Sauvegarde</h3>
		<p className="text-sm text-muted-foreground mb-3">
			Le suivi est enregistré dans ta base Nompaw : il suit ton compte sur tous tes appareils. Exporter reste utile
			pour garder une copie de côté.
		</p>
		<div className="flex gap-2.5 flex-wrap">
			<Button onClick={exportBackup}>Exporter la sauvegarde (JSON)</Button>
			<Button variant="outline" asChild>
				<label className="cursor-pointer">
					Importer une sauvegarde
					<input type="file" accept=".json,application/json" className="hidden" onChange={e => { importBackup(e.target.files[0]); e.target.value = ''; }} />
				</label>
			</Button>
			<Button variant="destructive" onClick={() => setConfirmReset(true)}>Tout effacer</Button>
		</div>
		{msg && <div className={`mt-2.5 text-sm ${msg.error ? 'text-[var(--status-critical)]' : 'text-[var(--status-good)] font-semibold'}`}>{msg.error || msg.text}</div>}

		<Dialog open={confirmReset} onOpenChange={setConfirmReset}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Tout effacer</DialogTitle>
					<DialogDescription>
						Effacer définitivement tout le suivi (séances saisies, historique importé, notes) ? Cette action est irréversible.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => setConfirmReset(false)}>Annuler</Button>
					<Button variant="destructive" onClick={() => { reset(); setConfirmReset(false); }}>Tout effacer</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</Card>
}
