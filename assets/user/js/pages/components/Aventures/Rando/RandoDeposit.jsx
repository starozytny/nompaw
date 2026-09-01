import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";

import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";

const URL_DEPOSIT_SETTINGS = "intern_api_aventures_randos_deposit";

export function RandoDeposit ({ randoId, enabled, hasPassword, url }) {
	const modalRef = useRef(null);

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
				Toastr.toast("info", "Réglages enregistrés.");
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

	const content = (
		<div className="flex flex-col gap-3">
			<p className="text-xs text-slate-500">
				Un lien unique protégé par mot de passe permet à des personnes non connectées de
				consulter l'album et d'y déposer leurs photos et vidéos (nom saisi au moment du dépôt).
			</p>

			<label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
				<input type="checkbox" checked={isEnabled} disabled={saving}
					   onChange={(e) => save(e.currentTarget.checked)} />
				Activer le dépôt public
			</label>

			<Input type="password" identifiant="depositPassword" valeur={password} autocomplete="new-password"
				   onChange={(e) => setPassword(e.currentTarget.value)}>
				{passwordSet ? "Nouveau mot de passe (vide = inchangé)" : "Mot de passe"}
			</Input>

			{isEnabled && shareUrl && (
				<div className="border-t border-slate-100 pt-3">
					<p className="text-xs font-medium text-slate-500 mb-1">Lien à communiquer</p>
					<div className="flex items-center gap-2">
						<input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()}
							   className="flex-1 min-w-0 text-xs rounded border border-slate-200 px-2 py-1 bg-slate-50" />
						<Button type="default" onClick={copy}>Copier</Button>
					</div>
					<p className="text-xs text-slate-400 mt-1">
						Transmettez ce lien <b>et</b> le mot de passe aux personnes concernées.
					</p>
				</div>
			)}
		</div>
	);

	return <>
		<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
			<div className="flex items-center justify-between mb-1">
				<h3 className="text-sm font-semibold text-slate-700">Partage &amp; dépôt public</h3>
				{isEnabled
					? <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
						<span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Actif
					</span>
					: <span className="text-xs text-slate-400">Inactif</span>}
			</div>
			<p className="text-xs text-slate-500">
				Lien unique protégé par mot de passe : consulter l'album et y déposer des photos et vidéos, sans compte.
			</p>

			{isEnabled && shareUrl && (
				<div className="mt-3 flex items-center gap-2">
					<input readOnly value={shareUrl} onFocus={(e) => e.currentTarget.select()}
						   className="flex-1 min-w-0 text-xs rounded border border-slate-200 px-2 py-1 bg-slate-50" />
					<Button type="default" onClick={copy}>Copier</Button>
				</div>
			)}

			<button type="button" onClick={() => modalRef.current.handleClick()}
					className="group mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-700">
				<span className="icon-settings -translate-y-0.5"></span>
				<span className="group-hover:underline">{isEnabled ? "Gérer le partage" : "Configurer le partage"}</span>
			</button>
		</div>

		{createPortal(
			<Modal ref={modalRef} identifiant="rando-deposit" maxWidth={480} title="Partage &amp; dépôt public"
				   content={content}
				   footer={<Button type="blue" onClick={() => save(isEnabled)} disabled={saving}>
					   {saving ? "Enregistrement…" : (passwordSet ? "Mettre à jour le mot de passe" : "Enregistrer")}
				   </Button>}
				   closeTxt="Fermer" />,
			document.body)
		}
	</>;
}

RandoDeposit.propTypes = {
	randoId: PropTypes.string.isRequired,
	enabled: PropTypes.string,
	hasPassword: PropTypes.string,
	url: PropTypes.string,
};
