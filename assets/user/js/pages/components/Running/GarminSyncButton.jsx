import React, { useState } from 'react';

import { RefreshCw } from 'lucide-react';

import { Button } from "@shadcnComponents/ui/button";

/**
 * Pulls the last 14 days from Garmin's Personal API (RunningController::garminSync) — shared between
 * the always-visible header shortcut and the Historique sub-tab's "ou" alternative to a CSV import,
 * so the sync logic/message only lives once.
 */
export function GarminSyncButton ({ onSyncGarmin, variant = 'default', size = 'default', label = 'Synchroniser Garmin' }) {
	const [syncing, setSyncing] = useState(false);
	const [msg, setMsg] = useState(null);

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

	return <div className="flex flex-col items-start gap-1">
		<Button variant={variant} size={size} onClick={handleSync} disabled={syncing}>
			<RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
			{syncing ? 'Synchronisation…' : label}
		</Button>
		{msg && <span className={`text-xs ${msg.error ? 'text-[var(--status-critical)]' : 'text-[var(--status-good)]'}`}>{msg.error || msg.text}</span>}
	</div>;
}
