import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input, InputFile } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";
import { Camera, Plus, Lock, Unlock, Trash2, Check, Copy, RotateCcw } from "lucide-react";

const URL_LIST = "admin_photos_access_list";
const URL_CREATE = "admin_photos_access_create";
const URL_UPDATE = "admin_photos_access_update";
const URL_GENERATE_TOKEN = "admin_photos_access_generate_token";
const URL_REVOKE_TOKEN = "admin_photos_access_revoke_token";
const URL_REACTIVATE_TOKEN = "admin_photos_access_reactivate_token";
const URL_TOGGLE_BLOCKED = "admin_photos_access_toggle_blocked";
const URL_DELETE = "admin_photos_access_delete";
const URL_DELETE_TOKEN = "admin_photos_access_delete_token";
const URL_LIST_ACCOUNTS = "admin_photos_access_list_accounts";
const URL_TOGGLE_ACCOUNT_ACCESS = "admin_photos_access_toggle_account_access";

export function PhotosAccess () {
	const [guests, setGuests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [accounts, setAccounts] = useState([]);
	const [accountsLoading, setAccountsLoading] = useState(true);
	const [displayName, setDisplayName] = useState("");
	const [label, setLabel] = useState("");
	const [errors, setErrors] = useState([]);
	const [tokenTarget, setTokenTarget] = useState(null);
	const [deleteTarget, setDeleteTarget] = useState(null);
	const [copiedId, setCopiedId] = useState(null);
	const [editTarget, setEditTarget] = useState(null);
	const [editDisplayName, setEditDisplayName] = useState("");
	const [editErrors, setEditErrors] = useState([]);
	const [tokenDeleteTarget, setTokenDeleteTarget] = useState(null);

	const createModal = useRef();
	const tokenModal = useRef();
	const deleteModal = useRef();
	const editModal = useRef();
	const tokenDeleteModal = useRef();
	const avatarInput = useRef();
	const editAvatarInput = useRef();

	useEffect(() => {
		fetchGuests();
		fetchAccounts();
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

	useEffect(() => {
		editModal.current?.handleUpdateFooter(
			<Button type="blue" onClick={handleConfirmEdit}>Enregistrer</Button>
		);
	}, [editTarget, editDisplayName, editErrors]);

	useEffect(() => {
		tokenDeleteModal.current?.handleUpdateFooter(
			<Button type="red" onClick={handleConfirmDeleteToken}>Confirmer la suppression</Button>
		);
	}, [tokenDeleteTarget]);

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

	const fetchAccounts = () => {
		setAccountsLoading(true);
		axios({ method: "GET", url: Routing.generate(URL_LIST_ACCOUNTS) })
			.then((response) => {
				setAccounts(response.data.data);
				setAccountsLoading(false);
			})
			.catch((error) => {
				Formulaire.displayErrors(null, error);
				setAccountsLoading(false);
			});
	}

	const handleToggleAccountAccess = (account) => {
		Formulaire.loader(true);
		axios({ method: "PUT", url: Routing.generate(URL_TOGGLE_ACCOUNT_ACCESS, { id: account.id }) })
			.then((response) => {
				setAccounts(prev => prev.map(a => a.id === response.data.data.id ? response.data.data : a));
				Toastr.toast('info', response.data.data.photosAccess ? "Accès accordé." : "Accès retiré.");
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => Formulaire.loader(false))
		;
	}

	const handleCreate = (e) => {
		e.preventDefault();

		Formulaire.loader(true);

		let formData = new FormData();
		formData.append("data", JSON.stringify({ displayName, label }));

		let file = avatarInput.current;
		if (file.state.files.length > 0) {
			formData.append("avatar", file.state.files[0]);
		}

		axios({ method: "POST", url: Routing.generate(URL_CREATE), data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
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

	const handleEdit = (guest) => {
		setEditTarget(guest);
		setEditDisplayName(guest.displayName);
		setEditErrors([]);
		editModal.current.handleClick();
	}

	const handleConfirmEdit = () => {
		if (!editTarget) return;

		Formulaire.loader(true);

		let formData = new FormData();
		formData.append("data", JSON.stringify({ displayName: editDisplayName }));

		let file = editAvatarInput.current;
		if (file && file.state.files.length > 0) {
			formData.append("avatar", file.state.files[0]);
		}

		axios({ method: "POST", url: Routing.generate(URL_UPDATE, { id: editTarget.id }), data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
			.then((response) => {
				setGuests(prev => prev.map(g => g.id === response.data.data.id ? response.data.data : g));
				editModal.current.handleClose();
				Toastr.toast('info', "Membre mis à jour.");
			})
			.catch((error) => {
				Formulaire.displayErrors({ setState: (s) => setEditErrors(s.errors || []) }, error);
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

	const handleReactivateToken = (tokenId) => {
		Formulaire.loader(true);
		axios({ method: "PUT", url: Routing.generate(URL_REACTIVATE_TOKEN, { id: tokenId }) })
			.then((response) => {
				setGuests(prev => prev.map(g => g.id === response.data.data.id ? response.data.data : g));
				Toastr.toast('info', "Lien réactivé.");
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => Formulaire.loader(false))
		;
	}

	const handleDeleteToken = (token) => {
		setTokenDeleteTarget(token);
		tokenDeleteModal.current.handleClick();
	}

	const handleConfirmDeleteToken = () => {
		if (!tokenDeleteTarget) return;

		Formulaire.loader(true);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_TOKEN, { id: tokenDeleteTarget.id }) })
			.then((response) => {
				setGuests(prev => prev.map(g => g.id === response.data.data.id ? response.data.data : g));
				tokenDeleteModal.current.handleClose();
				Toastr.toast('info', "Lien supprimé.");
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

	return <div className="flex flex-col gap-6">
		<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
			<h3 className="text-2xl font-bold text-slate-900 mb-1">Comptes complets</h3>
			<p className="text-sm text-slate-600 mb-4">
				Les comptes normaux (amis, famille) n'ont plus accès à l'espace photos par défaut.
				Active l'accès explicitement pour ceux qui doivent le voir. Les administrateurs y ont toujours accès automatiquement.
			</p>

			{accountsLoading ? (
				<div className="text-center text-slate-600 text-sm py-4">Chargement...</div>
			) : accounts.length === 0 ? (
				<div className="text-center text-slate-600 text-sm py-4">Aucun compte complet pour le moment.</div>
			) : (
				<div className="flex flex-col gap-2">
					{accounts.map(account => (
						<div key={account.id} className="flex items-center justify-between gap-2 rounded-md px-3 py-2 bg-slate-50 border border-slate-200">
							<div>
								<div className="font-medium text-slate-900">
									{account.displayName}
									{account.isAdmin && <span className="ml-2 text-xs font-medium text-blue-600">Admin</span>}
								</div>
								<div className="text-xs text-slate-500">{account.email}</div>
							</div>
							{account.isAdmin ? (
								<span className="text-xs text-slate-500">Accès automatique</span>
							) : (
								<Button
									type={account.photosAccess ? "red" : "blue"}
									onClick={() => handleToggleAccountAccess(account)}
								>
									{account.photosAccess ? "Retirer l'accès" : "Donner l'accès"}
								</Button>
							)}
						</div>
					))}
				</div>
			)}
		</div>

		<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
		<div className="flex items-center justify-between mb-6">
			<h3 className="text-2xl font-bold text-slate-900">Membres de la famille (lien magique)</h3>
			<button type="button" onClick={() => createModal.current.handleClick()}
					className="flex items-center justify-center gap-2 rounded-md py-2 px-4 text-sm font-semibold shadow-sm transition-colors bg-blue-600 text-slate-50 hover:bg-blue-500 ring-1 ring-inset ring-blue-600">
				<Plus size={16} />
				Ajouter un membre
			</button>
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
							<div className="flex items-center gap-3">
								<button type="button" onClick={() => handleEdit(guest)} className="relative group flex-shrink-0" aria-label="Modifier l'avatar">
									<img src={guest.avatarFile} alt={guest.displayName} className="w-10 h-10 rounded-full object-cover bg-slate-100" />
									<span className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
										<Camera size={14} className="text-white" />
									</span>
								</button>
								<div>
									<div className="font-semibold text-slate-900">
										{guest.displayName}
										{guest.isBlocked && <span className="ml-2 text-xs font-medium text-red-600">Bloqué</span>}
									</div>
									<div className="text-xs text-slate-500">{guest.mediaCount} photo{guest.mediaCount > 1 ? "s" : ""} déposée{guest.mediaCount > 1 ? "s" : ""}</div>
								</div>
							</div>
							<div className="flex gap-2">
								<IconButton type="default" icon={Camera} onClick={() => handleEdit(guest)} tooltipPosition="-bottom-7 right-0">
									Modifier l'avatar
								</IconButton>
								<IconButton type="default" icon={Plus} onClick={() => handleGenerateToken(guest)} tooltipPosition="-bottom-7 right-0">
									Nouveau lien
								</IconButton>
								<IconButton type={guest.isBlocked ? "default" : "yellow"} icon={guest.isBlocked ? Unlock : Lock} onClick={() => handleToggleBlocked(guest)} tooltipPosition="-bottom-7 right-0">
									{guest.isBlocked ? "Débloquer" : "Bloquer"}
								</IconButton>
								<IconButton type="red" icon={Trash2} onClick={() => handleDelete(guest)} tooltipPosition="-bottom-7 right-0">
									Supprimer
								</IconButton>
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
										{token.isActive ? (
											<>
												<button type="button" onClick={() => handleCopy(token.link, token.id)}
													className="flex items-center justify-center gap-2 rounded-md py-2 px-4 text-sm font-semibold shadow-sm transition-colors bg-white text-gray-900 hover:bg-gray-50 ring-1 ring-inset ring-gray-300">
													{copiedId === token.id ? <Check size={16} /> : <Copy size={16} />}
													{copiedId === token.id ? "Copié !" : "Copier"}
												</button>
												<Button type="red" onClick={() => handleRevokeToken(token.id)}>
													Révoquer
												</Button>
											</>
										) : token.revokedAt && (
											<button type="button" onClick={() => handleReactivateToken(token.id)}
												className="flex items-center justify-center gap-2 rounded-md py-2 px-4 text-sm font-semibold shadow-sm transition-colors bg-blue-600 text-slate-50 hover:bg-blue-500 ring-1 ring-inset ring-blue-600">
												<RotateCcw size={16} />
												Réactiver
											</button>
										)}
										<IconButton type="red" icon={Trash2} onClick={() => handleDeleteToken(token)} tooltipPosition="-bottom-7 right-0">
											Supprimer le lien
										</IconButton>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		)}
		</div>

		{createPortal(<Modal ref={createModal} identifiant="create-photos-guest" maxWidth={480} title="Ajouter un membre"
							 content={<form onSubmit={handleCreate} className="flex flex-col gap-4">
								 <div>
									 <Input identifiant="displayName" valeur={displayName} onChange={(e) => setDisplayName(e.target.value)} errors={errors}>
										 Nom affiché
									 </Input>
								 </div>
								 <div>
									 <InputFile ref={avatarInput} type="simple" identifiant="avatar" errors={errors}>
										 Avatar <span className="text-sm text-gray-600">(facultatif)</span>
									 </InputFile>
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

		{createPortal(<Modal ref={tokenDeleteModal} identifiant="delete-token" maxWidth={414} title="Supprimer ce lien"
							 content={<p>Êtes-vous sûr de vouloir supprimer le lien <b>{tokenDeleteTarget?.label || "Lien"}</b> ? Cette action est définitive.</p>}
							 footer={null}
							 closeTxt="Annuler" />
			, document.body
		)}

		{createPortal(<Modal ref={editModal} identifiant="edit-photos-guest" maxWidth={480} title="Modifier le membre"
							 content={<form onSubmit={(e) => { e.preventDefault(); handleConfirmEdit(); }} className="flex flex-col gap-4">
								 <div>
									 <Input identifiant="displayName" valeur={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} errors={editErrors}>
										 Nom affiché
									 </Input>
								 </div>
								 <div>
									 <InputFile ref={editAvatarInput} type="simple" identifiant="avatar" valeur={editTarget?.avatarFile} errors={editErrors}>
										 Avatar
									 </InputFile>
								 </div>
							 </form>}
							 footer={null}
							 closeTxt="Annuler" />
			, document.body
		)}
	</div>
}

function IconButton ({ type, icon: Icon, onClick, children, tooltipPosition = "-top-7 right-0" }) {
	const colorVariants = {
		yellow: 'bg-yellow-500 shadow-sm text-slate-50 hover:bg-yellow-400',
		red: 'bg-red-600 shadow-sm text-slate-50 hover:bg-red-500',
		default: 'bg-white shadow-sm text-gray-900 hover:bg-gray-50 ring-1 ring-inset ring-gray-300',
	};
	const iconColorVariants = {
		yellow: 'text-slate-50',
		red: 'text-slate-50',
		default: 'text-gray-600',
	};

	return <button type="button" onClick={onClick}
					className={`relative inline-flex items-center justify-center rounded-md px-2 py-2 ${colorVariants[type]}`}>
		<Icon size={18} className={iconColorVariants[type]} />
		<span className={`tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute ${tooltipPosition} text-xs hidden whitespace-nowrap`}>
			{children}
		</span>
	</button>
}
