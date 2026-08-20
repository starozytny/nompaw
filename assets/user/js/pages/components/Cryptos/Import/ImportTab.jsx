import React, { useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Toastr from "@tailwindFunctions/toastr";

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { InputFile } from "@tailwindComponents/Elements/Fields";

import { CoinbaseConnect } from "@userPages/Cryptos/Import/CoinbaseConnect";
import { KrakenConnect } from "@userPages/Cryptos/Import/KrakenConnect";
import { BitpandaConnect } from "@userPages/Cryptos/Import/BitpandaConnect";
import { BinanceConnect } from "@userPages/Cryptos/Import/BinanceConnect";
import { CryptocomConnect } from "@userPages/Cryptos/Import/CryptocomConnect";
import { ImportHistory } from "@userPages/Cryptos/Import/ImportHistory";

const URL_IMPORT = "intern_api_cryptos_import_index";

export function ImportTab () {
	const [uploading, setUploading] = useState(false);
	const [result, setResult] = useState(null);
	const [historyKey, setHistoryKey] = useState(0);

	const handleSubmit = (files) => {
		if (files.length === 0 || uploading) return;

		setUploading(true);
		setResult(null);

		let formData = new FormData();
		formData.append("file", files[0]);

		axios({ method: "POST", url: Routing.generate(URL_IMPORT), data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
			.then(function (response) {
				setResult(response.data);
				setUploading(false);
				setHistoryKey((key) => key + 1);
				Toastr.toast('info', "Import terminé.");
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setUploading(false);
			})
		;
	}

	return <div className="flex flex-col gap-4">
		<CoinbaseConnect />
		<KrakenConnect />
		<BitpandaConnect />
		<BinanceConnect />
		<CryptocomConnect />

		<Card>
			<CardContent className="flex flex-col gap-3 p-4">
				<div>
					<div className="text-sm font-medium">Importer un export d'exchange</div>
					<div className="text-xs text-muted-foreground">
						Dépose le fichier tel que téléchargé (zip ou csv) depuis Coinbase, Coinbase Pro, Kraken, Bitpanda ou Uphold —
						le format est détecté automatiquement. Les transactions déjà importées sont ignorées, pas dupliquées.
					</div>
				</div>

				<InputFile identifiant="import-file" type="simple" format="file" accept=".csv,.zip"
						   maxSize={20000000} errors={[]} valeur=""
						   onDirectSubmit={handleSubmit} />

				{uploading && <div className="text-xs text-muted-foreground">Import en cours...</div>}
			</CardContent>
		</Card>

		{result && <Card className="overflow-hidden">
			<CardContent className="flex flex-col gap-3 p-4">
				<div className="flex flex-wrap gap-4 text-sm">
					<div><span className="font-semibold" style={{ color: 'var(--status-good)' }}>{result.imported}</span> importée{result.imported > 1 ? "s" : ""}</div>
					<div><span className="font-semibold text-muted-foreground">{result.duplicates}</span> déjà présente{result.duplicates > 1 ? "s" : ""} (ignorée{result.duplicates > 1 ? "s" : ""})</div>
					{result.errors.length > 0 && <div><span className="font-semibold" style={{ color: 'var(--status-critical)' }}>{result.errors.length}</span> erreur{result.errors.length > 1 ? "s" : ""}</div>}
				</div>

				{result.skippedFiles.length > 0 && <div className="text-xs text-muted-foreground">
					Fichier{result.skippedFiles.length > 1 ? "s" : ""} ignoré{result.skippedFiles.length > 1 ? "s" : ""} (format non reconnu) : {result.skippedFiles.join(', ')}
				</div>}

				{result.errors.length > 0 && <div className="flex flex-col gap-1">
					{result.errors.map((e, i) => <div key={i} className="rounded-md p-2 text-xs" style={{ background: 'var(--status-critical-soft)', color: 'var(--status-critical)' }}>
						{e.file} — {e.message}
					</div>)}
				</div>}
			</CardContent>
		</Card>}

		<ImportHistory key={historyKey} />
	</div>
}
