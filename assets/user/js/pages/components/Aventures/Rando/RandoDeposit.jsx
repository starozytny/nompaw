import React, { useState } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";

import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";

const URL_DEPOSIT_SETTINGS = "intern_api_aventures_randos_deposit";

export function RandoDeposit ({ randoId, enabled, hasPassword, url }) {
	const [isEnabled, setIsEnabled] = useState(enabled === "1");
	const [passwordSet, setPasswordSet] = useState(hasPassword === "1");
	const [password, setPassword] = useState("");
	const [shareUrl, setShareUrl] = useState(url || "");
	const [saving, setSaving] = useState(false);

	const save = (nextEnabled) => {
		setSaving(true);
		axios({
			method: "PUT",
			url: Routing.generate(URL_DEPOSIT_SETTINGS, { id: randoId }),
			data: { enabled: nextEnabled, password: password },
		})
			.then(({ data }) => {
				const d = data.data;
				setIsEnabled(d.enabled);
				setPasswordSet(d.hasPassword);
				setShareUrl(d.url || "");
				setPassword("");
				Toastr.toast("info", "Réglages du dépôt enregistrés.");
			})
			.catch((error) => {
				Toastr.toast("error", error.response?.data?.message || "Une erreur est survenue.");
			})
			.then(() => setSaving(false));
	};

	const copy = () => {
		if (navigator.clipboard) {
			navigator.clipboard.writeText(shareUrl).then(() => Toastr.toast("info", "Lien copié."));
		}
	};

	return (
		<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
			<h3 className="text-sm font-semibold text-slate-700 mb-1">Dépôt & partage public</h3>
			<p className="text-xs text-slate-500 mb-3">
				Un lien unique protégé par mot de passe permet à des personnes non connectées de
				consulter l'album et d'y déposer leurs photos et vidéos (elles indiquent leur nom
				au moment du dépôt).
			</p>

			<label className="flex items-center gap-2 text-sm text-slate-700 mb-3 cursor-pointer">
				<input type="checkbox" checked={isEnabled} disabled={saving}
					   onChange={(e) => save(e.currentTarget.checked)} />
				Activer le dépôt public
			</label>

			<Input type="password" identifiant="depositPassword" valeur={password} autocomplete="new-password"
				   onChange={(e) => setPassword(e.currentTarget.value)}>
				{passwordSet
					? "Nouveau mot de passe (laisser vide pour conserver l'actuel)"
					: "Mot de passe"}
			</Input>

			<div className="mt-3">
				<Button type="blue" onClick={() => save(isEnabled)} disabled={saving}>
					{saving
						? "Enregistrement…"
						: (passwordSet ? "Mettre à jour le mot de passe" : "Définir le mot de passe")}
				</Button>
			</div>

			{isEnabled && shareUrl && (
				<div className="mt-4 border-t border-slate-100 pt-3">
					<p className="text-xs font-medium text-slate-500 mb-1">Lien à communiquer</p>
					<div className="flex items-center gap-2">
						<input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()}
							   className="flex-1 text-xs rounded border border-slate-200 px-2 py-1 bg-slate-50" />
						<Button type="default" onClick={copy}>Copier</Button>
					</div>
					<p className="text-xs text-slate-400 mt-1">
						Transmettez ce lien <b>et</b> le mot de passe aux personnes concernées.
					</p>
				</div>
			)}
		</div>
	);
}

RandoDeposit.propTypes = {
	randoId: PropTypes.string.isRequired,
	enabled: PropTypes.string,
	hasPassword: PropTypes.string,
	url: PropTypes.string,
};
