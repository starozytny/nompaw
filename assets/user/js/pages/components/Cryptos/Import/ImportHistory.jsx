import React, { useState, useEffect } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";

const URL_HISTORY = "intern_api_cryptos_import_history";

const VIA_LABELS = {
	file: "Fichier",
	api: "API",
};

export function ImportHistory () {
	const [logs, setLogs] = useState(null);
	const [loading, setLoading] = useState(false);

	const fetchHistory = () => {
		setLoading(true);
		axios.get(Routing.generate(URL_HISTORY))
			.then((response) => setLogs(response.data))
			.catch((error) => Formulaire.displayErrors(null, error, "Impossible de récupérer l'historique des imports."))
			.then(() => setLoading(false))
		;
	}

	useEffect(() => { fetchHistory(); }, []);

	if (logs === null) {
		return null;
	}

	return <Card>
		<CardContent className="flex flex-col gap-3 p-4">
			<div className="flex items-center justify-between">
				<div>
					<div className="text-sm font-medium">Historique des imports</div>
					<div className="text-xs text-muted-foreground">Un import par fichier ou par synchronisation, plateforme par plateforme.</div>
				</div>
				<Button type={loading ? "disabled" : "default"} onClick={fetchHistory}>Rafraîchir</Button>
			</div>

			{logs.length === 0
				? <div className="text-xs text-muted-foreground">Aucun import pour l'instant.</div>
				: <div className="flex flex-col divide-y divide-border">
					{logs.map((log) => <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
						<div className="flex flex-col">
							<div className="flex items-center gap-2">
								<span className="font-medium">{log.source}</span>
								<span className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground" style={{ background: 'hsl(var(--muted))' }}>
									{VIA_LABELS[log.via] || log.via}
								</span>
							</div>
							<div className="text-xs text-muted-foreground">
								{Sanitaze.toFormatDate(log.createdAt, 'D MMM YYYY [à] H[h]mm')}
								{log.fileName && <> · {log.fileName}</>}
							</div>
						</div>

						<div className="flex flex-wrap gap-3 text-xs">
							<div><span className="font-semibold" style={{ color: 'var(--status-good)' }}>{log.importedCount}</span> importée{log.importedCount > 1 ? "s" : ""}</div>
							<div><span className="font-semibold text-muted-foreground">{log.duplicatesCount}</span> doublon{log.duplicatesCount > 1 ? "s" : ""}</div>
							{log.errorsCount > 0 && <div><span className="font-semibold" style={{ color: 'var(--status-critical)' }}>{log.errorsCount}</span> erreur{log.errorsCount > 1 ? "s" : ""}</div>}
						</div>
					</div>)}
				</div>
			}
		</CardContent>
	</Card>
}
