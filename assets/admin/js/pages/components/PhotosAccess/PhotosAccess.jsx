import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_LIST = "admin_photos_access_list";
const URL_CREATE = "admin_photos_access_create";
const URL_GENERATE_TOKEN = "admin_photos_access_generate_token";
const URL_REVOKE_TOKEN = "admin_photos_access_revoke_token";
const URL_TOGGLE_BLOCKED = "admin_photos_access_toggle_blocked";
const URL_DELETE = "admin_photos_access_delete";

export function PhotosAccess () {
	const [guests, setGuests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [displayName, setDisplayName] = useState("");
	const [label, setLabel] = useState("");
	const [errors, setErrors] = useState([]);
	const [tokenTarget, setTokenTarget] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [copiedId, setCopiedId] = useState(null);

	const createModal = useRef();
	const tokenModal = useRef();
	const deleteModal = useRef();

	useEffect(() => {
		fetchGuests();
	}, []);

	// Modal freezes its `footer` prop at mount time and never re-syncs it, so any handler
	// closing over component state must be pushed back in via handleUpdateFooter whenever
	// that state changes — otherwise the button keeps calling the stale first-render closure.
	useEffect(() => {
		createModal.current?.handleUpdateFooter(
			<Button type="blue" onClick={handleCreate}>Créer et générer le lien</Button>
		);
	}, [displayName, label, errors]);

	useEffect(() => {
		tokenModal.current?.handleUpdateFooter(
			<Button type="blue" onClick={handleConfirmGenerateToken}>Générer</Button>
		);
	}, [tokenTarget, label]);

	useEffect(() => {
		deleteModal.current?.handleUpdateFooter(
			<Button type="red" onClick={handleConfirmDelete}>Confirmer la suppression</Button>
		);
	}, [deleteTarget]);

	const fetchGuests = () => {
		setLoading(true);
		axios({ method: "GET", url: Routing.generate(URL_LIST) })
			.then((response) => {
				setGuests(response.data.data);
				setLoading(false);
			})
			.catch((error) => {
				Formulaire.displayErrors(null, error);
				setLoading(false);
			});
	}

	const handleCreate = (e) => {
		e.preventDefault();

		Formulaire.loader(true);
		axios({ method: "POST", url: Routing.generate(URL_CREATE), data: { displayName, label } })
			.then((response) => {
				setGuests(prev => [...prev, response.data.data]);
				setDisplayName("");
				setLabel("");
				setErrors([]);
				createModal.current.handleClose();
				Toastr.toast('info', "Membre créé, lien généré.");
			})
			.catch((error) => {
				Formulaire.displayErrors({ setState: (s) => setErrors(s.errors || []) }, error);
			})
			.then(() => Formulaire.loader(false))
		;
	}

	const handleGenerateToken = (guest) => {
		setTokenTarget(guest);
		setLabel("");
		tokenModal.current.handleClick();
	}

	const handleConfirmGenerateToken = () => {
		if (!tokenTarget) return;

		Formulaire.loader(true);
		axios({ method: "POST", url: Routing.generate(URL_GENERATE_TOKEN, { id: tokenTarget.id }), data: { label } })
			.then((response) => {
				setGuests(prev => prev.map(g => g.id === response.data.data.id ? response.data.data : g));
				tokenModal.current.handleClose();
				Toastr.toast('info', "Nouveau lien généré.");
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => Formulaire.loader(false))
		;
	}

	const handleRevokeToken = (tokenId) => {
		Formulaire.loader(true);
		axios({ method: "PUT", url: Routing.generate(URL_REVOKE_TOKEN, { id: tokenId }) })
			.then((response) => {
				setGuests(prev => prev.map(g => g.id === response.data.data.id ? response.data.data : g));
				Toastr.toast('info', "Lien révoqué.");
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => Formulaire.loader(false))
		;
	}

	const handleToggleBlocked = (guest) => {
		Formulaire.loader(true);
		axios({ method: "PUT", url: Routing.generate(URL_TOGGLE_BLOCKED, { id: guest.id }) })
			.then((response) => {
				setGuests(prev => prev.map(g => g.id === response.data.data.id ? response.data.data : g));
				Toastr.toast('info', guest.isBlocked ? "Membre débloqué." : "Membre bloqué.");
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => Formulaire.loader(false))
		;
	}

	const handleDelete = (guest) => {
		setDeleteTarget(guest);
		deleteModal.current.handleClick();
	}

	const handleConfirmDelete = () => {
		if (!deleteTarget) return;

		Formulaire.loader(true);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE, { id: deleteTarget.id }) })
			.then(() => {
				setGuests(prev => prev.filter(g => g.id !== deleteTarget.id));
				deleteModal.current.handleClose();
				Toastr.toast('info', "Membre supprimé.");
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => Formulaire.loader(false))
		;
	}

	const handleCopy = (link, tokenId) => {
		navigator.clipboard.writeText(link).then(() => {
			setCopiedId(tokenId);
			setTimeout(() => setCopiedId(null), 2000);
		});
	}

	let params0 = { errors: errors, onChange: () => {} };

	return <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
		<div className="flex items-center justify-between mb-6">
			<h3 className="text-2xl font-bold text-slate-900">Membres de la famille</h3>
			<Button type="blue" iconLeft="add" onClick={() => createModal.current.handleClick()}>
				Ajouter un membre
			</Button>
		</div>

		{loading ? (
			<div className="text-center text-slate-600 text-sm py-8">Chargement...</div>
		) : guests.length === 0 ? (
			<div className="text-center text-slate-600 text-sm py-8">Aucun membre pour le moment.</div>
		) : (
			<div className="flex flex-col gap-4">
				{guests.map(guest => (
					<div key={guest.id} className="border border-slate-200 rounded-lg p-4">
						<div className="flex items-center justify-between flex-wrap gap-2">
							<div>
								<div className="font-semibold text-slate-900">
									{guest.displayName}
									{guest.isBlocked && <span className="ml-2 text-xs font-medium text-red-600">Bloqué</span>}
								</div>
								<div className="text-xs text-slate-500">{guest.mediaCount} photo{guest.mediaCount > 1 ? "s" : ""} déposée{guest.mediaCount > 1 ? "s" : ""}</div>
							</div>
							<div className="flex gap-2">
								<ButtonIcon type="default" icon="add" onClick={() => handleGenerateToken(guest)} tooltipPosition="-bottom-7 right-0">
									Nouveau lien
								</ButtonIcon>
								<ButtonIcon type={guest.isBlocked ? "default" : "yellow"} icon="padlock" onClick={() => handleToggleBlocked(guest)} tooltipPosition="-bottom-7 right-0">
									{guest.isBlocked ? "Débloquer" : "Bloquer"}
								</ButtonIcon>
								<ButtonIcon type="red" icon="trash" onClick={() => handleDelete(guest)} tooltipPosition="-bottom-7 right-0">
									Supprimer
								</ButtonIcon>
							</div>
						</div>

						<div className="mt-3 flex flex-col gap-2">
							{guest.tokens.length === 0 ? (
								<div className="text-xs text-slate-500">Aucun lien généré.</div>
							) : guest.tokens.map(token => (
								<div key={token.id} className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${token.isActive ? "bg-slate-50" : "bg-red-50"}`}>
									<div className="flex flex-col overflow-hidden">
										<span className="font-medium text-slate-700">{token.label || "Lien"}{!token.isActive && " (révoqué)"}</span>
										<span className="text-xs text-slate-500 truncate">{token.link}</span>
									</div>
									<div className="flex gap-1 flex-shrink-0">
										{token.isActive && (
											<>
												<Button type="default" iconLeft={copiedId === token.id ? "check1" : "copy"} onClick={() => handleCopy(token.link, token.id)}>
													{copiedId === token.id ? "Copié !" : "Copier"}
												</Button>
												<Button type="red" onClick={() => handleRevokeToken(token.id)}>
													Révoquer
												</Button>
											</>
										)}
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		)}

		{createPortal(<Modal ref={createModal} identifiant="create-photos-guest" maxWidth={480} title="Ajouter un membre"
							 content={<form onSubmit={handleCreate} className="flex flex-col gap-4">
								 <div>
									 <Input identifiant="displayName" valeur={displayName} onChange={(e) => setDisplayName(e.target.value)} errors={errors}>
										 Nom affiché
									 </Input>
								 </div>
								 <div>
									 <Input identifiant="label" valeur={label} onChange={(e) => setLabel(e.target.value)} errors={errors}>
										 Étiquette du lien (optionnel, ex: "Téléphone de Maman")
									 </Input>
								 </div>
							 </form>}
							 footer={null}
							 closeTxt="Annuler" />
			, document.body
		)}

		{createPortal(<Modal ref={tokenModal} identifiant="generate-token" maxWidth={480} title="Générer un nouveau lien"
							 content={<form onSubmit={(e) => { e.preventDefault(); handleConfirmGenerateToken(); }}>
								 <Input identifiant="tokenLabel" valeur={label} onChange={(e) => setLabel(e.target.value)} errors={[]}>
									 Étiquette du lien (optionnel, ex: "Nouveau téléphone")
								 </Input>
							 </form>}
							 footer={null}
							 closeTxt="Annuler" />
			, document.body
		)}

		{createPortal(<Modal ref={deleteModal} identifiant="delete-guest" maxWidth={414} title="Supprimer ce membre"
							 content={<p>Êtes-vous sûr de vouloir supprimer <b>{deleteTarget?.displayName}</b> ? Tous ses liens seront supprimés.</p>}
							 footer={null}
							 closeTxt="Annuler" />
			, document.body
		)}
	</div>
}
