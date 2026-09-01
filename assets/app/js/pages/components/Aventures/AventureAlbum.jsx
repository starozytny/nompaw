import React, { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

import axios from "axios";

import Toastr from "@tailwindFunctions/toastr";

import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";
import { Alert } from "@tailwindComponents/Elements/Alert";

// Même raisonnement que RandoImages.jsx / PhotosGallery.jsx : au-delà de 5 envois
// simultanés, l'E/S disque de l'hébergement mutualisé devient le facteur limitant.
const UPLOAD_BATCH_SIZE = 5;

export function AventureAlbum ({ token, randoName, unlocked, isMember, memberName, loginUrl }) {
	const base = `/album-aventure/${token}`;

	const [isUnlocked, setIsUnlocked] = useState(unlocked);
	const [password, setPassword] = useState("");
	const [unlockError, setUnlockError] = useState(null);
	const [unlocking, setUnlocking] = useState(false);

	const [images, setImages] = useState([]);
	const [page, setPage] = useState(1);
	const [hasMore, setHasMore] = useState(false);
	const [total, setTotal] = useState(0);
	const [loadingImages, setLoadingImages] = useState(false);

	const [depositName, setDepositName] = useState(() => {
		try { return window.localStorage.getItem("ra_album_name") || ""; } catch (e) { return ""; }
	});
	const [nameError, setNameError] = useState(false);
	const [upload, setUpload] = useState({ total: 0, done: 0 });
	const fileInputRef = useRef(null);

	const fetchImages = useCallback((nextPage) => {
		setLoadingImages(true);
		axios.get(`${base}/images/${nextPage}`)
			.then(({ data }) => {
				const payload = data.data;
				setImages(prev => nextPage === 1 ? payload.images : [...prev, ...payload.images]);
				setPage(payload.page);
				setHasMore(payload.hasMore);
				setTotal(payload.total);
			})
			.catch((error) => {
				if (error.response?.status === 403) {
					setIsUnlocked(false);
					setUnlockError("Session expirée, ressaisissez le mot de passe.");
				} else {
					Toastr.toast("error", "Impossible de charger l'album.");
				}
			})
			.then(() => setLoadingImages(false));
	}, [base]);

	useEffect(() => {
		if (isUnlocked) {
			fetchImages(1);
		}
	}, [isUnlocked, fetchImages]);

	const handleUnlock = (e) => {
		e.preventDefault();
		if (password.trim() === "") {
			setUnlockError("Merci de saisir le mot de passe.");
			return;
		}
		setUnlocking(true);
		setUnlockError(null);
		axios.post(`${base}/unlock`, { password })
			.then(() => setIsUnlocked(true))
			.catch((error) => {
				setUnlockError(error.response?.data?.message || "Mot de passe incorrect.");
			})
			.then(() => setUnlocking(false));
	};

	const rememberName = (value) => {
		setDepositName(value);
		try { window.localStorage.setItem("ra_album_name", value); } catch (e) { /* mode privé */ }
	};

	const handleFilesSelected = (e) => {
		const files = Array.from(e.target.files);
		e.target.value = "";
		if (files.length > 0) {
			handleParallelUpload(files);
		}
	};

	const handleParallelUpload = async (files) => {
		if (!isMember && depositName.trim() === "") {
			setNameError(true);
			Toastr.toast("warning", "Indiquez d'abord votre nom.");
			return;
		}
		setNameError(false);

		const totalFiles = files.length;
		let completed = 0;
		let failed = 0;
		setUpload({ total: totalFiles, done: 0 });

		for (let i = 0; i < totalFiles; i += UPLOAD_BATCH_SIZE) {
			const batch = files.slice(i, i + UPLOAD_BATCH_SIZE);
			// eslint-disable-next-line no-await-in-loop
			await Promise.all(batch.map(async (file) => {
				const formData = new FormData();
				formData.append("file", file);
				formData.append("name", depositName.trim());
				formData.append("mtime", Math.floor(file.lastModified / 1000));
				try {
					await axios.post(`${base}/deposit`, formData);
					completed++;
				} catch (error) {
					failed++;
				}
				setUpload({ total: totalFiles, done: completed + failed });
			}));
		}

		if (failed > 0) {
			Toastr.toast("warning", `${completed} fichier(s) envoyé(s), ${failed} échec(s).`);
		} else {
			Toastr.toast("success", `${completed} fichier(s) envoyé(s). Merci !`);
		}

		setTimeout(() => {
			setUpload({ total: 0, done: 0 });
			fetchImages(1);
		}, 1000);
	};

	if (!isUnlocked) {
		return (
			<div className="max-w-md mx-auto mt-6 bg-white border rounded-xl shadow-xl p-6 sm:p-8">
				<h1 className="text-2xl font-bold text-gray-900">{randoName}</h1>
				<p className="text-sm text-gray-500 mt-1">
					Album privé. Saisissez le mot de passe qui vous a été communiqué pour voir les photos et en déposer.
				</p>
				<form onSubmit={handleUnlock} className="mt-6 flex flex-col gap-4">
					{unlockError && <Alert type="red">{unlockError}</Alert>}
					<div>
						<Input type="password" identifiant="password" valeur={password} autocomplete="off"
							   onChange={(e) => setPassword(e.currentTarget.value)}>
							Mot de passe
						</Input>
					</div>
					<Button type="blue" isSubmit={true} onClick={handleUnlock}>
						{unlocking ? "Vérification…" : "Accéder à l'album"}
					</Button>
				</form>
				{loginUrl && !isMember && (
					<p className="mt-4 text-center text-sm text-gray-500">
						Vous êtes membre&nbsp;?{" "}
						<a href={loginUrl} className="font-semibold text-indigo-600 hover:text-indigo-500">
							Se connecter
						</a>{" "}
						pour un accès direct.
					</p>
				)}
			</div>
		);
	}

	return (
		<div className="bg-white border rounded-xl shadow-xl p-4 sm:p-6">
			<div className="flex flex-wrap items-baseline justify-between gap-2">
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{randoName}</h1>
				<p className="text-sm text-gray-500">{total} élément{total > 1 ? "s" : ""}</p>
			</div>

			<div className="mt-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
				<p className="text-sm font-medium text-gray-700">Déposer vos photos et vidéos</p>
				{isMember && (
					<p className="mt-1 text-xs text-gray-500">Connecté en tant que <b>{memberName}</b>.</p>
				)}
				<div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
					{!isMember && (
						<div className="sm:w-64">
							<Input identifiant="depositName" valeur={depositName} autocomplete="name"
								   errors={nameError ? [{ name: "depositName", message: "Nom requis" }] : []}
								   onChange={(e) => rememberName(e.currentTarget.value)}>
								Votre nom
							</Input>
						</div>
					)}
					<div>
						<input ref={fileInputRef} type="file" multiple accept="image/*,video/*"
							   className="hidden" onChange={handleFilesSelected} />
						<Button type="blue" iconLeft="add" onClick={() => fileInputRef.current.click()}
								disabled={upload.total > 0}>
							{upload.total > 0
								? `Envoi ${upload.done}/${upload.total}…`
								: "Choisir des fichiers"}
						</Button>
					</div>
				</div>
			</div>

			{loadingImages && images.length === 0
				? <p className="text-sm text-gray-500 mt-6">Chargement…</p>
				: images.length === 0
					? <p className="text-sm text-gray-500 mt-6">Aucune photo pour le moment. Soyez le premier à en déposer !</p>
					: (
						<>
							<div className="grid grid-cols-2 gap-2 mt-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
								{images.map((img) => (
									<div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-gray-900 group">
										{img.type === 1
											? <video className="w-full h-full object-cover" controls preload="metadata">
												<source src={`${base}/file/${img.id}`} />
											</video>
											: <a href={`${base}/hd/${img.id}`} target="_blank" rel="noopener noreferrer">
												<img src={`${base}/thumbs/${img.id}`} alt="" loading="lazy"
													 className="w-full h-full object-cover" />
											</a>}
										{img.authorName && (
											<span className="absolute top-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
												{img.authorName}
											</span>
										)}
										<a href={`${base}/download/${img.id}`}
										   className="absolute bottom-1 right-1 rounded-full bg-black/70 hover:bg-black/90 px-2 py-1 text-[11px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
											Télécharger
										</a>
									</div>
								))}
							</div>

							{hasMore && (
								<div className="mt-6 flex justify-center">
									<Button type="default" onClick={() => fetchImages(page + 1)} disabled={loadingImages}>
										{loadingImages ? "Chargement…" : "Charger plus"}
									</Button>
								</div>
							)}
						</>
					)}
		</div>
	);
}

AventureAlbum.propTypes = {
	token: PropTypes.string.isRequired,
	randoName: PropTypes.string,
	unlocked: PropTypes.bool,
	isMember: PropTypes.bool,
	memberName: PropTypes.string,
	loginUrl: PropTypes.string,
};
