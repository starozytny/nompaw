import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@shadcnComponents/ui/button";

import { buildRunsFromCsv } from "@userPages/Running/Suivi/lib/csv";
import { WEEKS } from "@userPages/Running/Plan/weeks";
import { isoAdd } from "@userPages/Running/Suivi/lib/format";

const RANGE_START = WEEKS[0].iso0;
const RANGE_END = isoAdd(WEEKS[WEEKS.length - 1].iso0, 6);

export function ImportCard ({ onImportRuns, onSyncGarmin }) {
	const [over, setOver] = useState(false);
	const [msg, setMsg] = useState(null);
	const [syncing, setSyncing] = useState(false);

	const handleSync = () => {
		setSyncing(true);
		setMsg(null);
		onSyncGarmin().then(r => {
			const a = r.activities, w = r.weights;
			setMsg({
				text: `✓ Synchro Garmin (14 derniers jours) : ${a.added} nouvelle(s) course(s)`
					+ `${a.kept ? `, ${a.kept} saisie(s) manuelle(s) conservée(s)` : ''} · poids : `
					+ `${w.added + w.updated} jour(s) mis à jour${w.kept ? `, ${w.kept} pesée(s) manuelle(s) conservée(s)` : ''}.`,
			});
		}).catch(e => {
			setMsg({ error: e.response?.data?.message || 'Synchronisation Garmin impossible.' });
		}).finally(() => setSyncing(false));
	};

	const handleFile = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const { runs, error } = buildRunsFromCsv(String(reader.result));
			if (error) { setMsg({ error }); return; }
			onImportRuns(runs, RANGE_START, RANGE_END).then(r => {
				setMsg({
					text: `✓ ${r.total} courses lues (${r.added} nouvelles dans l'historique). ${r.attached} jour(s) du plan remplis automatiquement${r.kept ? `, ${r.kept} saisie(s) manuelle(s) conservée(s)` : ''}.`,
				});
			});
		};
		reader.onerror = () => setMsg({ error: 'Lecture du fichier impossible.' });
		reader.readAsText(file);
	};

	return <Card className="p-5">
		<h3 className="font-semibold mb-1.5">Importer mes activités Garmin</h3>
		<p className="text-sm text-muted-foreground mb-3">
			Garmin Connect (site web) → Activités → Toutes les activités → fais défiler pour charger l'historique voulu →{' '}
			<strong>Exporter en CSV</strong>. Dépose le fichier ici : les courses des dates du plan remplissent
			automatiquement le suivi (tes saisies manuelles ne sont pas écrasées), et tout l'historique alimente les
			statistiques.
		</p>

		<label
			className={`block border-2 border-dashed rounded-lg p-5 text-center text-sm text-muted-foreground cursor-pointer transition ${over ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}
			onDragOver={e => { e.preventDefault(); setOver(true); }}
			onDragLeave={() => setOver(false)}
			onDrop={e => { e.preventDefault(); setOver(false); handleFile(e.dataTransfer.files[0]); }}
		>
			Glisse ton fichier <strong>Activities.csv</strong> ici, ou clique pour le choisir
			<input type="file" accept=".csv,text/csv" className="hidden" onChange={e => { handleFile(e.target.files[0]); e.target.value = ''; }} />
		</label>

		<div className="flex items-center gap-3 my-3.5">
			<div className="h-px flex-1 bg-border" />
			<span className="text-xs text-muted-foreground">ou</span>
			<div className="h-px flex-1 bg-border" />
		</div>

		<Button variant="outline" size="sm" onClick={handleSync} disabled={syncing}>
			{syncing ? 'Synchronisation…' : 'Synchroniser depuis Garmin (14 derniers jours)'}
		</Button>

		{msg && <div className={`mt-2.5 text-sm ${msg.error ? 'text-red-700' : ''}`}>{msg.error || msg.text}</div>}
	</Card>
}
