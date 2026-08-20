import React, { useState, useEffect, useRef } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import Toastr from "@tailwindFunctions/toastr";

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";

const URL_STATUS = "intern_api_cryptos_coinbase_status";
const URL_CONNECT = "intern_api_cryptos_coinbase_connect";
const URL_SYNC = "intern_api_cryptos_coinbase_sync";
const URL_DISCONNECT = "intern_api_cryptos_coinbase_disconnect";

export function CoinbaseConnect () {
	const [status, setStatus] = useState(null);
	const [keyJson, setKeyJson] = useState("");
	const [connecting, setConnecting] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [disconnecting, setDisconnecting] = useState(false);
	const [syncResult, setSyncResult] = useState(null);

	const disconnectModal = useRef();

	const fetchStatus = () => {
		axios.get(Routing.generate(URL_STATUS))
			.then((response) => setStatus(response.data))
			.catch((error) => Formulaire.displayErrors(null, error, "Impossible de récupérer le statut Coinbase."))
		;
	}

	useEffect(() => { fetchStatus(); }, []);

	const handleConnect = () => {
		if (connecting || keyJson.trim() === "") return;

		setConnecting(true);
		axios({ method: "POST", url: Routing.generate(URL_CONNECT), data: { keyJson } })
			.then(() => {
				Toastr.toast('info', "Compte Coinbase connecté.");
				setKeyJson("");
				fetchStatus();
			})
			.catch((error) => {
				console.log(error); Formulaire.displayErrors(null, error)
			})
			.then(() => setConnecting(false))
		;
	}

	const handleSync = () => {
		if (syncing) return;

		setSyncing(true);
		setSyncResult(null);
		axios({ method: "POST", url: Routing.generate(URL_SYNC), data: {} })
			.then((response) => {
				setSyncResult(response.data);
				Toastr.toast('info', "Synchronisation Coinbase terminée.");
				fetchStatus();
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => setSyncing(false))
		;
	}

	const handleDisconnect = () => {
		if (disconnecting) return;

		setDisconnecting(true);
		axios({ method: "DELETE", url: Routing.generate(URL_DISCONNECT), data: {} })
			.then(() => {
				Toastr.toast('info', "Compte Coinbase déconnecté.");
				disconnectModal.current.handleClose();
				setSyncResult(null);
				fetchStatus();
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => setDisconnecting(false))
		;
	}

	if (status === null) {
		return null;
	}

	return <Card>
		<CardContent className="flex flex-col gap-3 p-4">
			<div>
				<div className="text-sm font-medium">Synchronisation Coinbase (clé API)</div>
				<div className="text-xs text-muted-foreground">
					Connecte une clé API Coinbase en lecture seule (Coinbase Developer Platform) pour récupérer tes transactions
					sans passer par un export manuel. Les transactions déjà importées ne sont jamais dupliquées.
				</div>
			</div>

			{!status.connected
				? <div className="flex flex-col gap-2">
					<textarea value={keyJson} onChange={(e) => setKeyJson(e.target.value)}
							  placeholder={'Colle ici le JSON téléchargé depuis portal.cdp.coinbase.com ({"name": "...", "privateKey": "..."})'}
							  rows={4}
							  className="block w-full rounded-md border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-gray-500 font-mono" />
					<Button type={connecting ? "disabled" : "blue"} onClick={handleConnect} width="self-start">
						{connecting ? "Connexion..." : "Connecter"}
					</Button>
				</div>
				: <div className="flex flex-col gap-2">
					<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span className="truncate max-w-[280px]">{status.keyName}</span>
						{status.lastSyncedAt && <span>· Dernière synchro {Sanitaze.toFormatDate(status.lastSyncedAt, 'D MMM [à] H[h]mm')}</span>}
					</div>

					{status.lastSyncError && <div className="rounded-md p-2 text-xs" style={{ background: 'var(--status-critical-soft)', color: 'var(--status-critical)' }}>
						Dernière synchro en échec : {status.lastSyncError}
					</div>}

					<div className="flex gap-2">
						<Button type={syncing ? "disabled" : "blue"} onClick={handleSync}>
							{syncing ? "Synchronisation..." : "Synchroniser maintenant"}
						</Button>
						<Button type="default" onClick={() => disconnectModal.current.handleClick()}>Déconnecter</Button>
					</div>

					{syncResult && <div className="flex flex-wrap gap-4 text-sm">
						<div><span className="font-semibold" style={{ color: 'var(--status-good)' }}>{syncResult.imported}</span> importée{syncResult.imported > 1 ? "s" : ""}</div>
						<div><span className="font-semibold text-muted-foreground">{syncResult.duplicates}</span> déjà présente{syncResult.duplicates > 1 ? "s" : ""} (ignorée{syncResult.duplicates > 1 ? "s" : ""})</div>
						{syncResult.errors.length > 0 && <div><span className="font-semibold" style={{ color: 'var(--status-critical)' }}>{syncResult.errors.length}</span> erreur{syncResult.errors.length > 1 ? "s" : ""}</div>}
					</div>}
				</div>
			}
		</CardContent>

		<Modal ref={disconnectModal} identifiant="coinbase-disconnect" title="Déconnecter Coinbase"
			   content={<p>Le compte Coinbase sera déconnecté. Les transactions déjà importées restent en place, mais tu devras reconnecter une clé API pour resynchroniser.</p>}
			   footer={<Button type={disconnecting ? "disabled" : "red"} onClick={handleDisconnect}>Confirmer la déconnexion</Button>} />
	</Card>
}
