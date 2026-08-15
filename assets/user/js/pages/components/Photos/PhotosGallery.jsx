import React, { Component, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import ModalFunctions from '@commonFunctions/modal';
import Sanitaze from '@commonFunctions/sanitaze';

import { Modal } from "@tailwindComponents/Elements/Modal";
import { LightBox } from "@tailwindComponents/Elements/LightBox";
import { Input, TextArea } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";
import {
	ChevronLeft, ChevronRight, Image, Download, Trash2, Plus, Check,
	CheckSquare, Square, Folder, Loader2, Play, Share2, X, HardDrive,
	Pencil, Calendar, MapPin,
} from "lucide-react";

const URL_FETCH_MEDIA = "intern_api_photos_media_fetch";
const URL_AUTHORS = "intern_api_photos_media_authors";
const URL_UPLOAD_MEDIA = "intern_api_photos_media_upload";
const URL_DELETE_MEDIUM = "intern_api_photos_media_delete";
const URL_ASSIGN_ALBUM = "intern_api_photos_media_assign_album";
const URL_DELETE_MEDIA = "intern_api_photos_media_deletes";
const URL_DOWNLOAD_MEDIUM = "intern_api_photos_media_download";
const URL_DOWNLOAD_SELECTED = "intern_api_photos_media_download_selected";
const URL_GET_FILE_SRC = "intern_api_photos_media_file_src";
const URL_GET_THUMBS_SRC = "intern_api_photos_media_thumbs_src";
const URL_READ_MEDIUM_HD = "intern_api_photos_media_file_hd_src";
const URL_ALBUM_LIST = "intern_api_photos_album_list";
const URL_ALBUM_CREATE = "intern_api_photos_album_create";
const URL_ALBUM_UPDATE = "intern_api_photos_album_update";
const URL_ALBUM_DELETE = "intern_api_photos_album_delete";
const URL_ALBUM_COVER = "intern_api_photos_album_cover";
const URL_ALBUM_SET_COVER = "intern_api_photos_album_set_cover";
const URL_MEDIA_STATS = "intern_api_photos_media_stats";

export class PhotosGallery extends Component {
	constructor (props) {
		super(props);

		this.state = {
			albumName: "",
			albumDescription: "",
			albumDate: "",
			albumLocation: "",
			editAlbumName: "",
			editAlbumDescription: "",
			editAlbumDate: "",
			editAlbumLocation: "",
			allMedia: [],
			currentMedia: [],
			selected: new Set(),
			errors: [],
			medium: null,
			nbProgress: 0,
			nbTotal: 0,
			page: 1,
			hasMore: true,
			loading: false,
			rankMedia: 1,
			authors: [],
			albums: [],
			authorFilter: null,
			albumFilter: null,
			view: "stream", // "stream" | "albums" | "albumDetail"
			selectedAlbum: null,
			albumsScope: "all", // "all" | "mine"
			coverBump: 0, // incrémenté à chaque changement de couverture pour casser le cache image
			totalSize: null, // taille totale de la photothèque en octets, admin uniquement
		}

		this.fileInputRef = React.createRef();
		this.formAlbum = React.createRef();
		this.editAlbum = React.createRef();
		this.deleteMedium = React.createRef();
		this.deleteFiles = React.createRef();
		this.deleteAlbum = React.createRef();
		this.lightbox = React.createRef();
		this.observer = null;
		this.observedNode = null;
		this.sentinelRef = React.createRef();
	}

	componentDidMount () {
		const body = document.querySelector('body');
		const dropzone = document.querySelector('.drive-dropzone');

		let timeoutHandle;

		function stopDrag () {
			if (dropzone) {
				dropzone.classList.remove('active');
			}
		}

		body.addEventListener('dragover', (e) => {
			e.preventDefault()

			if (dropzone) {
				if (!dropzone.classList.contains('active')) {
					dropzone.classList.add('active');
				}
			}
			window.clearTimeout(timeoutHandle);
			timeoutHandle = window.setTimeout(stopDrag, 200);
		});

		body.addEventListener('drop', (e) => {
			e.preventDefault();

			const filesArray = Array.from(e.dataTransfer.files);
			this.handleParallelUpload(filesArray, 5);

			if (dropzone) {
				dropzone.classList.remove('active');
			}
		})

		this.fetchMedia();
		this.fetchAuthors();
		this.fetchAlbums();

		if (this.props.isAdmin) {
			this.fetchStats();
		}

		this.observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && this.state.hasMore && !this.state.loading) {
					this.fetchMedia();
				}
			},
			{ threshold: 0.1 }
		);

		if (this.sentinelRef.current) {
			this.observedNode = this.sentinelRef.current;
			this.observer.observe(this.observedNode);
		}

		// Avertit avant de quitter la page tant qu'un envoi est en cours : ça ne protège pas
		// contre un changement d'appli sur mobile (l'OS peut suspendre la page sans prévenir),
		// seulement contre une navigation/fermeture d'onglet accidentelle dans le même navigateur.
		window.addEventListener('beforeunload', this.handleBeforeUnload);
	}

	componentDidUpdate () {
		// Le sentinel est démonté/remonté à chaque changement de vue (stream/albums/albumDetail),
		// ce qui crée un nouveau nœud DOM : l'observer doit se réattacher dessus, sinon il continue
		// de surveiller un nœud orphelin et le scroll infini s'arrête silencieusement.
		if (this.observer && this.sentinelRef.current && this.sentinelRef.current !== this.observedNode) {
			if (this.observedNode) {
				this.observer.unobserve(this.observedNode);
			}
			this.observedNode = this.sentinelRef.current;
			this.observer.observe(this.observedNode);
		}
	}

	componentWillUnmount() {
		window.removeEventListener('beforeunload', this.handleBeforeUnload);

		if (this.observer && this.observedNode) {
			this.observer.unobserve(this.observedNode);
		}
	}

	fetchAuthors = () => {
		axios({ method: "GET", url: Routing.generate(URL_AUTHORS) })
			.then((response) => this.setState({ authors: response.data.data }))
			.catch((error) => Formulaire.displayErrors(null, error))
		;
	}

	fetchAlbums = () => {
		axios({ method: "GET", url: Routing.generate(URL_ALBUM_LIST) })
			.then((response) => this.setState({ albums: response.data }))
			.catch((error) => Formulaire.displayErrors(null, error))
		;
	}

	fetchStats = () => {
		axios({ method: "GET", url: Routing.generate(URL_MEDIA_STATS) })
			.then((response) => this.setState({ totalSize: response.data.totalSize }))
			.catch(() => {})
		;
	}

	fetchMedia = () => {
		const { page, loading, hasMore, authorFilter, albumFilter } = this.state;

		if (loading || !hasMore) return;

		this.setState({ loading: true });

		axios({
			method: "GET",
			url: Routing.generate(URL_FETCH_MEDIA, { page: page, authorId: authorFilter, albumId: albumFilter }),
		})
			.then((response) => {
				let allData = response.data.media;
				let currentData = response.data.currentMedia;

				let i = 1;
				allData.forEach(item => {
					item.rankMedia = i++;
				});

				let j = this.state.rankMedia;
				currentData.forEach(item => {
					item.rankMedia = j++;
				});

				this.setState(prevState => ({
					allMedia: allData,
					currentMedia: [...prevState.currentMedia, ...currentData],
					rankMedia: prevState.rankMedia + currentData.length,
					hasMore: response.data.hasMore,
					page: prevState.page + 1,
					loading: false
				}));
			})
			.catch((error) => {
				Formulaire.displayErrors(null, error);
				this.setState({ loading: false });
			});
	}

	handleLoadMore = () => {
		this.fetchMedia();
	}

	handleFilter = (authorFilter, albumFilter) => {
		this.setState({
			authorFilter, albumFilter,
			allMedia: [], currentMedia: [], selected: new Set(),
			page: 1, hasMore: true, rankMedia: 1, loading: false
		}, () => this.fetchMedia());
	}

	handleShowAlbums = () => {
		this.setState({ view: "albums" });
	}

	handleShowStream = () => {
		this.setState({
			view: "stream", selectedAlbum: null, albumFilter: null,
			allMedia: [], currentMedia: [], selected: new Set(),
			page: 1, hasMore: true, rankMedia: 1, loading: false
		}, () => this.fetchMedia());
	}

	handleOpenAlbum = (album) => {
		this.setState({
			view: "albumDetail", selectedAlbum: album, albumFilter: album.id, authorFilter: null,
			allMedia: [], currentMedia: [], selected: new Set(),
			page: 1, hasMore: true, rankMedia: 1, loading: false
		}, () => this.fetchMedia());
	}

	handleBackToAlbums = () => {
		this.setState({ view: "albums", selectedAlbum: null, albumFilter: null });
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleSelect = (id) => {
		this.setState(prevState => {
			const newSelected = new Set(prevState.selected);
			if (newSelected.has(id)) {
				newSelected.delete(id);
			} else {
				newSelected.add(id);
			}
			return { selected: newSelected };
		});
	}

	handleSelectAll = () => {
		const { currentMedia } = this.state;
		this.setState(prevState => {
			if (prevState.selected.size === currentMedia.length) {
				return { selected: new Set() };
			} else {
				return { selected: new Set(currentMedia.map(m => m.id)) };
			}
		});
	}

	handleModal = (identifiant, medium) => {
		modalDeleteMedium(this);
		modalDeleteMedia(this);

		this.setState({ medium: medium })
		this[identifiant].current.handleClick();
	}

	handleBeforeUnload = (e) => {
		const { nbTotal, nbProgress } = this.state;

		if (nbTotal > 0 && nbProgress < nbTotal) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	handleUploadClick = () => {
		this.fileInputRef.current.click();
	}

	handleFilesSelected = (e) => {
		const files = Array.from(e.target.files);
		e.target.value = ''; // permet de resélectionner les mêmes fichiers plus tard

		if (files.length > 0) {
			this.handleParallelUpload(files, 5);
		}
	}

	async handleParallelUpload(files, batchSize) {
		const { view, selectedAlbum } = this.state;
		const albumId = (view === 'albumDetail' && selectedAlbum) ? selectedAlbum.id : null;

		const total = files.length;
		let completed = 0;
		let failed = 0;

		this.setState({ nbTotal: total, nbProgress: 0 });

		for (let i = 0; i < total; i += batchSize) {
			const batch = files.slice(i, i + batchSize);

			await Promise.all(batch.map(async (file) => {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('mtime', Math.floor(file.lastModified / 1000));
				if (albumId) {
					formData.append('albumId', albumId);
				}

				try {
					await axios.post(Routing.generate(URL_UPLOAD_MEDIA), formData);
					completed++;
				} catch (error) {
					failed++;
					console.error('Upload failed:', error);
				}
				this.setState({ nbProgress: completed + failed, nbTotal: total });
			}));
		}

		if (failed > 0) {
			// Le seul signal visible d'un échec partiel : la pastille de progression ne distingue
			// pas succès/échec dans son décompte, donc ce toast reste nécessaire dans ce cas précis.
			Toastr.toast('warning', `${completed} photo${completed > 1 ? 's' : ''} envoyée${completed > 1 ? 's' : ''}, ${failed} échec${failed > 1 ? 's' : ''}.`);
		}

		// Laisse voir le check "Envoi terminé" un court instant avant de faire disparaître la
		// pastille et de rafraîchir la grille en place (pas de rechargement de page : ça évite
		// aussi de déclencher nous-mêmes l'alerte de navigation pendant/juste après l'envoi).
		setTimeout(() => {
			this.setState({ nbTotal: 0, nbProgress: 0 });
			this.refreshAfterUpload();
		}, 1200);
	}

	refreshAfterUpload = () => {
		this.setState({
			allMedia: [], currentMedia: [], selected: new Set(),
			page: 1, hasMore: true, rankMedia: 1, loading: false
		}, () => this.fetchMedia());

		this.fetchAlbums();
		this.fetchAuthors();
	}

	handleDeleteMedium = () => {
		const { medium } = this.state;

		let self = this;
		Formulaire.loader(true);
		this.deleteMedium.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_MEDIUM, { id: medium.id }), data: {} })
			.then(function (response) {
				Toastr.toast('info', "Photo supprimée.");
				location.reload();
			})
			.catch(function (error) {
				modalDeleteMedium(self);
				Formulaire.displayErrors(self, error);
				Formulaire.loader(false);
			})
		;
	}

	handleDeleteMedia = () => {
		const { selected } = this.state;

		let self = this;
		Formulaire.loader(true);
		this.deleteFiles.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_MEDIA), data: { selected: Array.from(selected) } })
			.then(function (response) {
				Toastr.toast('info', "Photos supprimées.");
				location.reload();
			})
			.catch(function (error) {
				modalDeleteMedia(self);
				Formulaire.displayErrors(self, error);
				Formulaire.loader(false);
			})
		;
	}

	handleDownloadSelected = () => {
		const { selected } = this.state;

		if (selected.size === 0) return;

		Formulaire.loader(true);
		const mediaIds = Array.from(selected);

		if (mediaIds.length >= 5) {
			axios({
				method: "POST",
				url: Routing.generate(URL_DOWNLOAD_SELECTED),
				data: { mediaIds: mediaIds },
				responseType: 'blob'
			})
				.then(response => {
					const url = window.URL.createObjectURL(new Blob([response.data]));
					const link = document.createElement('a');
					link.href = url;
					link.setAttribute('download', `selection_photos_${mediaIds.length}.zip`);
					document.body.appendChild(link);
					link.click();
					link.remove();
					window.URL.revokeObjectURL(url);
					Formulaire.loader(false);
				})
				.catch(async error => {
					if (error.response && error.response.data instanceof Blob) {
						const text = await error.response.data.text();
						try {
							const errorData = JSON.parse(text);
							Toastr.toast('error', errorData.message || 'Erreur lors du téléchargement');
						} catch (e) {
							console.error('Erreur brute:', text);
						}
					} else {
						Formulaire.displayErrors(null, error);
					}
					Formulaire.loader(false);
				});
		} else {
			Promise.all(
				mediaIds.map(id =>
					axios({ method: "GET", url: Routing.generate(URL_DOWNLOAD_MEDIUM, { id }), responseType: 'blob' })
				)
			)
				.then(responses => {
					responses.forEach((response, index) => {
						const url = window.URL.createObjectURL(new Blob([response.data]));
						const link = document.createElement('a');
						link.href = url;
						link.setAttribute('download', `photo_${mediaIds[index]}.jpg`);
						document.body.appendChild(link);
						link.click();
						link.remove();
						window.URL.revokeObjectURL(url);
					});
					Formulaire.loader(false);
				})
				.catch(error => {
					Formulaire.displayErrors(null, error);
					Formulaire.loader(false);
				});
		}
	}

	handleLightbox = (elem) => {
		const { allMedia, albums, view, selectedAlbum } = this.state;
		const { userId, isAdmin } = this.props;

		const canSetCover = view === 'albumDetail' && selectedAlbum
			&& (String(selectedAlbum.author?.id) === String(userId) || isAdmin);

		this.lightbox.current.handleUpdateContent(
			<LightboxContent key={elem.rankMedia} identifiant="lightbox" images={allMedia} elem={elem}
							  userId={userId} isAdmin={isAdmin} albums={albums}
							  onAssignAlbum={this.handleAssignAlbum}
							  onSetCover={canSetCover ? (mediaId) => this.handleSetCover(selectedAlbum.id, mediaId) : null}
							  onDelete={(medium) => {
								  this.lightbox.current.handleClose();
								  this.handleModal('deleteMedium', medium);
							  }} />
		);
		this.lightbox.current.handleClick();
	}

	handleAssignAlbum = (mediumId, albumId) => {
		axios({ method: "PUT", url: Routing.generate(URL_ASSIGN_ALBUM, { id: mediumId }), data: { albumId } })
			.then(() => {
				Toastr.toast('info', albumId ? "Ajouté à l'album." : "Retiré de l'album.");
				this.fetchAlbums();
			})
			.catch((error) => Formulaire.displayErrors(null, error))
		;
	}

	handleSetCover = (albumId, mediaId) => {
		axios({ method: "PUT", url: Routing.generate(URL_ALBUM_SET_COVER, { id: albumId }), data: { mediaId } })
			.then(() => {
				Toastr.toast('info', "Photo de couverture modifiée.");
				this.setState(prev => ({ coverBump: prev.coverBump + 1 }));
				this.fetchAlbums();
			})
			.catch((error) => Formulaire.displayErrors(null, error))
		;
	}

	handleCreateAlbum = (e) => {
		e.preventDefault();

		const { albumName, albumDescription, albumDate, albumLocation } = this.state;

		let self = this;
		Formulaire.loader(true);

		let formData = new FormData();
		formData.append("data", JSON.stringify({ name: albumName, description: albumDescription, date: albumDate, location: albumLocation }));

		axios({ method: "POST", url: Routing.generate(URL_ALBUM_CREATE), data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
			.then(function () {
				Toastr.toast('info', "Album créé.");
				self.formAlbum.current.handleClose();
				self.setState({ albumName: "", albumDescription: "", albumDate: "", albumLocation: "" });
				self.fetchAlbums();
			})
			.catch(function (error) {
				Formulaire.displayErrors(self, error);
			})
			.then(function () {
				Formulaire.loader(false);
			})
		;
	}

	handleEditAlbum = (album) => {
		this.setState({
			editAlbumName: album.name || "",
			editAlbumDescription: album.description || "",
			editAlbumDate: album.date ? album.date.substring(0, 10) : "",
			editAlbumLocation: album.location || "",
			errors: [],
		});
		this.editAlbum.current.handleClick();
	}

	handleConfirmEditAlbum = (e) => {
		e.preventDefault();

		const { selectedAlbum, editAlbumName, editAlbumDescription, editAlbumDate, editAlbumLocation } = this.state;

		let self = this;
		Formulaire.loader(true);

		let formData = new FormData();
		formData.append("data", JSON.stringify({ name: editAlbumName, description: editAlbumDescription, date: editAlbumDate, location: editAlbumLocation }));

		axios({ method: "POST", url: Routing.generate(URL_ALBUM_UPDATE, { id: selectedAlbum.id }), data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
			.then(function (response) {
				Toastr.toast('info', "Album mis à jour.");
				self.editAlbum.current.handleClose();
				self.setState({ selectedAlbum: response.data });
				self.fetchAlbums();
			})
			.catch(function (error) {
				Formulaire.displayErrors(self, error);
			})
			.then(function () {
				Formulaire.loader(false);
			})
		;
	}

	render () {
		const { userId, isAdmin, homepageUrl } = this.props;
		const { errors, allMedia, currentMedia, selected, nbProgress, nbTotal, loading, hasMore,
			authors, albums, authorFilter, albumName, albumDescription, albumDate, albumLocation,
			editAlbumName, editAlbumDescription, editAlbumDate, editAlbumLocation,
			view, selectedAlbum, albumsScope, coverBump, totalSize } = this.state;

		return <div className="bg-gray-900 min-h-screen text-white">
			{/* Barre du haut façon Google Photos, contextuelle à la vue */}
			<div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-3 bg-gray-900/95 backdrop-blur">
				{view === "stream" && (
					<>
						<div className="flex items-center gap-2">
							{homepageUrl && (
								<a href={homepageUrl} className="w-9 h-9 rounded-full hover:bg-gray-800 flex items-center justify-center text-white flex-shrink-0" aria-label="Retour à Nompaw">
									<ChevronLeft size={20} />
								</a>
							)}
							<Image size={24} className="text-blue-400" />
							<span className="text-lg font-medium text-white">Photos</span>
						</div>
						<div className="flex items-center gap-3 text-sm text-gray-400">
							<span>
								<span className="font-medium text-gray-200">{allMedia.length}</span> photo{allMedia.length > 1 ? 's' : ''}
							</span>
							{isAdmin && totalSize !== null && (
								<span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-800 text-xs font-medium text-gray-300">
									<HardDrive size={12} className="text-blue-400" />
									{Sanitaze.toFormatBytesToSize(totalSize)}
								</span>
							)}
							<button
								className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white"
								onClick={this.handleUploadClick}
								aria-label="Ajouter des photos"
							>
								<Plus size={20} />
							</button>
						</div>
					</>
				)}

				{view === "albums" && (
					<>
						<div className="flex items-center gap-2">
							<button className="w-9 h-9 rounded-full hover:bg-gray-800 flex items-center justify-center text-white" onClick={this.handleShowStream} aria-label="Retour">
								<ChevronLeft size={20} />
							</button>
							<span className="text-lg font-medium text-white">Albums</span>
						</div>
						<button
							className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white"
							onClick={() => this.formAlbum.current.handleClick()}
							aria-label="Nouvel album"
						>
							<Plus size={20} />
						</button>
					</>
				)}

				{view === "albumDetail" && selectedAlbum && (
					<>
						<div className="flex items-center gap-2 min-w-0">
							<button className="w-9 h-9 rounded-full hover:bg-gray-800 flex items-center justify-center text-white flex-shrink-0" onClick={this.handleBackToAlbums} aria-label="Retour aux albums">
								<ChevronLeft size={20} />
							</button>
							<span className="text-lg font-medium text-white truncate">{selectedAlbum.name}</span>
						</div>
						<div className="flex items-center gap-2 flex-shrink-0">
							{(String(selectedAlbum.author?.id) === String(userId) || isAdmin) && (
								<button
									className="w-9 h-9 rounded-full hover:bg-gray-800 flex items-center justify-center text-white flex-shrink-0"
									onClick={() => this.handleEditAlbum(selectedAlbum)}
									aria-label="Modifier l'album"
								>
									<Pencil size={16} />
								</button>
							)}
							{(String(selectedAlbum.author?.id) === String(userId) || isAdmin) && (
								<button
									className="w-9 h-9 rounded-full hover:bg-gray-800 flex items-center justify-center text-red-400 flex-shrink-0"
									onClick={() => this.handleModal('deleteAlbum', selectedAlbum)}
									aria-label="Supprimer l'album"
								>
									<Trash2 size={18} />
								</button>
							)}
						</div>
					</>
				)}
			</div>

			{view === "stream" && (
				<div className="flex flex-col gap-3 px-4 pb-3">
					<div className="flex flex-wrap items-center gap-2">
						<button
							className={`px-3 py-1.5 rounded-full text-sm font-medium ${authorFilter === null ? "bg-white text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
							onClick={() => this.handleFilter(null, null)}
						>
							Tous
						</button>
						<button
							className={`px-3 py-1.5 rounded-full text-sm font-medium ${String(authorFilter) === String(userId) ? "bg-white text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
							onClick={() => this.handleFilter(userId, null)}
						>
							Mes photos
						</button>
						{authors.filter(a => String(a.id) !== String(userId)).map(author => (
							<button
								key={author.id}
								className={`px-3 py-1.5 rounded-full text-sm font-medium ${String(authorFilter) === String(author.id) ? "bg-white text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
								onClick={() => this.handleFilter(author.id, null)}
							>
								{author.displayName}
							</button>
						))}
						<button
							className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-300 hover:bg-gray-700 flex items-center gap-1"
							onClick={this.handleShowAlbums}
						>
							<Folder size={16} />
							Albums {albums.length > 0 && `(${albums.length})`}
						</button>
					</div>

					{(allMedia.length > 0 || selected.size > 0) && (
						<div className="flex flex-wrap items-center gap-2 p-3 bg-gray-800/80 rounded-full">
							{currentMedia.length > 0 && (
								<button
									className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 text-gray-200 hover:bg-gray-600"
									onClick={this.handleSelectAll}
								>
									{selected.size === currentMedia.length ? <CheckSquare size={16} className="mr-1" /> : <Square size={16} className="mr-1" />}
									{selected.size === currentMedia.length ? 'Tout désélectionner' : 'Tout sélectionner'}
								</button>
							)}

							{selected.size > 0 && (
								<>
									<span className="text-sm text-gray-300">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
									<button className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-700 text-gray-200 hover:bg-gray-600" onClick={this.handleDownloadSelected}>
										<Download size={16} className="mr-1" />Télécharger
									</button>
									<button className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-600/90 text-white hover:bg-red-600" onClick={() => this.handleModal('deleteFiles', null)}>
										<Trash2 size={16} className="mr-1" />Supprimer
									</button>
								</>
							)}

						</div>
					)}
				</div>
			)}

			{view === "albumDetail" && selectedAlbum && (
				<>
					<div className="relative w-full h-56 sm:h-72 overflow-hidden bg-gray-800">
						{selectedAlbum.mediaCount > 0 && (
							<img src={Routing.generate(URL_ALBUM_COVER, { id: selectedAlbum.id, v: coverBump })} alt={selectedAlbum.name}
								 className="absolute inset-0 w-full h-full object-cover"
								 onError={(e) => { e.target.style.display = 'none'; }} />
						)}
						<div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-gray-900/10"></div>
						<div className="absolute bottom-0 left-0 p-4">
							<h2 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-wide text-white drop-shadow">{selectedAlbum.name}</h2>
							<p className="flex items-center flex-wrap gap-x-1 text-sm text-gray-300 mt-1">
								<span>{selectedAlbum.mediaCount} élément{selectedAlbum.mediaCount > 1 ? 's' : ''}</span>
								{selectedAlbum.author?.displayName && <span>• par {selectedAlbum.author.displayName}</span>}
								{selectedAlbum.date && <span className="inline-flex items-center gap-1">• <Calendar size={12} />{Sanitaze.toFormatDate(selectedAlbum.date, 'D MMMM YYYY')}</span>}
								{selectedAlbum.location && <span className="inline-flex items-center gap-1">• <MapPin size={12} />{selectedAlbum.location}</span>}
								{isAdmin && (
									<span className="inline-flex items-center gap-1 ml-1 px-2 py-0.5 rounded-full bg-white/10 text-xs font-medium text-gray-200">
										<HardDrive size={11} className="text-blue-300" />
										{Sanitaze.toFormatBytesToSize(selectedAlbum.totalSize || 0)}
									</span>
								)}
							</p>
						</div>
					</div>

					{selectedAlbum.description && (
						<p className="px-4 pt-3 text-sm text-gray-300 leading-relaxed whitespace-pre-line">{selectedAlbum.description}</p>
					)}

					<div className="flex flex-wrap items-center gap-2 px-4 py-3">
						<button className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-white text-black hover:bg-gray-200" onClick={this.handleUploadClick}>
							<Plus size={16} className="mr-1" />Ajouter des photos
						</button>

						{(allMedia.length > 0 || selected.size > 0) && currentMedia.length > 0 && (
							<button
								className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-200 hover:bg-gray-700"
								onClick={this.handleSelectAll}
							>
								{selected.size === currentMedia.length ? <CheckSquare size={16} className="mr-1" /> : <Square size={16} className="mr-1" />}
								{selected.size === currentMedia.length ? 'Tout désélectionner' : 'Tout sélectionner'}
							</button>
						)}

						{selected.size > 0 && (
							<>
								<span className="text-sm text-gray-300">{selected.size} sélectionnée{selected.size > 1 ? 's' : ''}</span>
								<button className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-800 text-gray-200 hover:bg-gray-700" onClick={this.handleDownloadSelected}>
									<Download size={16} className="mr-1" />Télécharger
								</button>
								<button className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-600/90 text-white hover:bg-red-600" onClick={() => this.handleModal('deleteFiles', null)}>
									<Trash2 size={16} className="mr-1" />Supprimer
								</button>
							</>
						)}
					</div>
				</>
			)}

			{view === "albums" ? (
				<AlbumsGrid albums={albums} userId={userId} isAdmin={isAdmin} scope={albumsScope} coverBump={coverBump}
							onScopeChange={(scope) => this.setState({ albumsScope: scope })}
							onOpenAlbum={this.handleOpenAlbum}
							onDeleteAlbum={(album) => this.handleModal('deleteAlbum', album)}
							onCreateAlbum={() => this.formAlbum.current.handleClick()} />
			) : (
				<>
					<div className="grid grid-cols-3 gap-1 px-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 pswp-gallery" id="gallery">
						{loading && currentMedia.length === 0 ? (
							<GridSkeleton />
						) : (
							<LazyLoadingGalleryWithPlaceholder currentMedia={currentMedia}
															   onModal={this.handleModal}
															   onSelect={this.handleSelect} onLightbox={this.handleLightbox}
															   selected={selected} userId={userId} isAdmin={isAdmin}
															   showCoverAction={view === 'albumDetail' && selectedAlbum
																   && (String(selectedAlbum.author?.id) === String(userId) || isAdmin)}
															   onSetCover={(medium) => this.handleSetCover(selectedAlbum.id, medium.id)} />
						)}
					</div>

					<div ref={this.sentinelRef} className="h-10"></div>

					<div className="pb-8">
						{loading && currentMedia.length > 0 && (
							<div className="text-center text-gray-400 text-sm py-4">
								<Loader2 size={16} className="animate-spin mr-2" />
								Chargement...
							</div>
						)}
						{!hasMore && currentMedia.length > 0 && (
							<div className="text-center text-gray-500 text-sm">Toutes les photos sont affichées.</div>
						)}
						{hasMore && !loading && currentMedia.length > 0 && (
							<div className="flex items-center justify-center pt-4">
								<button className="px-4 py-2 rounded-full text-sm font-medium bg-gray-800 text-gray-200 hover:bg-gray-700" onClick={this.handleLoadMore}>
									Afficher plus
								</button>
							</div>
						)}
						{!loading && currentMedia.length === 0 && (
							<div className="text-center text-gray-500 text-sm py-8">
								{view === "albumDetail" ? "Aucune photo dans cet album." : "Aucune photo pour ce filtre."}
							</div>
						)}
					</div>
				</>
			)}

			<input ref={this.fileInputRef} type="file" multiple
				   accept="video/*,image/*,.heic,.heif,.dng,.cr2,.cr3,.nef,.arw,.raf,.orf,.rw2,.3gp,.mkv"
				   className="hidden" onChange={this.handleFilesSelected} />

			{nbTotal > 0 && (
				<div className="fixed bottom-4 left-4 z-40 bg-gray-800 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[220px]">
					{nbProgress < nbTotal ? (
						<Loader2 size={20} className="animate-spin text-blue-400" />
					) : (
						<span className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
							<Check size={14} className="text-white" />
						</span>
					)}
					<div className="text-sm">
						<div className="font-medium">
							{nbProgress < nbTotal ? `Envoi de ${nbTotal} photo${nbTotal > 1 ? 's' : ''}...` : "Envoi terminé"}
						</div>
						<div className="text-gray-400 text-xs">{nbProgress} / {nbTotal}</div>
					</div>
				</div>
			)}

			{createPortal(<LightBox ref={this.lightbox} identifiant="lightbox" content={null} />
				, document.body
			)}

			{createPortal(<Modal ref={this.formAlbum} identifiant="form-new-album" maxWidth={480} title="Nouvel album"
								 content={<form onSubmit={this.handleCreateAlbum} className="flex flex-col gap-4">
									 <Input identifiant="albumName" valeur={albumName} onChange={(e) => this.setState({ albumName: e.target.value })} errors={errors}>
										 Nom de l'album
									 </Input>
									 <TextArea identifiant="albumDescription" valeur={albumDescription} onChange={(e) => this.setState({ albumDescription: e.target.value })} errors={errors}>
										 Description (optionnel)
									 </TextArea>
									 <Input type="date" identifiant="albumDate" valeur={albumDate} onChange={(e) => this.setState({ albumDate: e.target.value })} errors={errors}>
										 Date (optionnel)
									 </Input>
									 <Input identifiant="albumLocation" valeur={albumLocation} onChange={(e) => this.setState({ albumLocation: e.target.value })} errors={errors}>
										 Emplacement (optionnel)
									 </Input>
								 </form>}
								 footer={<Button type="blue" onClick={this.handleCreateAlbum}>Créer</Button>} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(<Modal ref={this.editAlbum} identifiant="edit-album" maxWidth={480} title="Modifier l'album"
								 content={<form onSubmit={this.handleConfirmEditAlbum} className="flex flex-col gap-4">
									 <Input identifiant="editAlbumName" valeur={editAlbumName} onChange={(e) => this.setState({ editAlbumName: e.target.value })} errors={errors}>
										 Nom de l'album
									 </Input>
									 <TextArea identifiant="editAlbumDescription" valeur={editAlbumDescription} onChange={(e) => this.setState({ editAlbumDescription: e.target.value })} errors={errors}>
										 Description (optionnel)
									 </TextArea>
									 <Input type="date" identifiant="editAlbumDate" valeur={editAlbumDate} onChange={(e) => this.setState({ editAlbumDate: e.target.value })} errors={errors}>
										 Date (optionnel)
									 </Input>
									 <Input identifiant="editAlbumLocation" valeur={editAlbumLocation} onChange={(e) => this.setState({ editAlbumLocation: e.target.value })} errors={errors}>
										 Emplacement (optionnel)
									 </Input>
								 </form>}
								 footer={<Button type="blue" onClick={this.handleConfirmEditAlbum}>Enregistrer</Button>} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(<Modal ref={this.deleteAlbum} identifiant='delete-album' maxWidth={414} title="Supprimer cet album"
								 content={<p>Les photos ne seront pas supprimées, seul l'album disparaîtra. Confirmer ?</p>}
								 footer={<Button type="red" onClick={() => {
									 const { medium: album } = this.state;
									 Formulaire.loader(true);
									 axios({ method: "DELETE", url: Routing.generate(URL_ALBUM_DELETE, { id: album.id }) })
										 .then(() => { Toastr.toast('info', "Album supprimé."); location.reload(); })
										 .catch((error) => { Formulaire.displayErrors(null, error); Formulaire.loader(false); })
									 ;
								 }}>Confirmer la suppression</Button>} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(<Modal ref={this.deleteMedium} identifiant='delete-medium' maxWidth={414} title="Supprimer cette photo"
								 content={<p>Êtes-vous sûr de vouloir supprimer cette photo ?</p>}
								 footer={null} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(<Modal ref={this.deleteFiles} identifiant='delete-files' maxWidth={414} title="Supprimer la sélection"
								 content={<p>Êtes-vous sûr de vouloir supprimer <b>la sélection</b> ?</p>}
								 footer={null} closeTxt="Annuler" />
				, document.body
			)}

		</div>
	}
}

PhotosGallery.propTypes = {
	userId: PropTypes.string.isRequired,
	isAdmin: PropTypes.bool,
	homepageUrl: PropTypes.string,
}

function modalDeleteMedium (self) {
	self.deleteMedium.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteMedium}>Confirmer la suppression</Button>)
}

function modalDeleteMedia (self) {
	self.deleteFiles.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteMedia}>Confirmer la suppression</Button>)
}

function AlbumsGrid ({ albums, userId, isAdmin, scope, coverBump, onScopeChange, onOpenAlbum, onDeleteAlbum, onCreateAlbum }) {
	const visibleAlbums = scope === "mine"
		? albums.filter(album => String(album.author?.id) === String(userId))
		: albums;

	return <div className="px-4 pb-8">
		<div className="flex flex-wrap items-center gap-2 mb-4">
			<button
				className={`px-3 py-1.5 rounded-full text-sm font-medium ${scope === "all" ? "bg-white text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
				onClick={() => onScopeChange("all")}
			>
				Tous
			</button>
			<button
				className={`px-3 py-1.5 rounded-full text-sm font-medium ${scope === "mine" ? "bg-white text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
				onClick={() => onScopeChange("mine")}
			>
				Mes albums
			</button>
		</div>

		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
			<div
				className="aspect-square rounded-2xl border-2 border-dashed border-gray-700 hover:border-gray-500 flex items-center justify-center cursor-pointer text-gray-500 hover:text-gray-300"
				onClick={onCreateAlbum}
			>
				<Plus size={32} />
			</div>

			{visibleAlbums.map(album => (
				<div key={album.id} className="flex flex-col gap-1">
					<div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-900 cursor-pointer group" onClick={() => onOpenAlbum(album)}>
						{album.mediaCount > 0 ? (
							<img src={Routing.generate(URL_ALBUM_COVER, { id: album.id, v: coverBump })} alt={album.name}
								 className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
						) : (
							<div className="absolute inset-0 flex items-center justify-center">
								<Folder size={40} className="text-gray-600" />
							</div>
						)}

						{(String(album.author?.id) === String(userId) || isAdmin) && (
							<button
								className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600/90 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
								onClick={(e) => { e.stopPropagation(); onDeleteAlbum(album); }}
								aria-label="Supprimer l'album"
							>
								<Trash2 size={14} />
							</button>
						)}
					</div>
					<div className="px-0.5">
						<div className="text-sm font-medium text-white truncate">{album.name}</div>
						<div className="flex items-center gap-1 text-xs text-gray-500">
							<span>{album.mediaCount} élément{album.mediaCount > 1 ? 's' : ''}</span>
							{isAdmin && album.mediaCount > 0 && (
								<>
									<span>·</span>
									<span className="flex items-center gap-0.5">
										<HardDrive size={10} />
										{Sanitaze.toFormatBytesToSize(album.totalSize || 0)}
									</span>
								</>
							)}
						</div>
					</div>
				</div>
			))}
		</div>

		{visibleAlbums.length === 0 && (
			<div className="text-center text-gray-500 text-sm py-8">
				{scope === "mine" ? "Vous n'avez pas encore créé d'album." : "Aucun album pour le moment."}
			</div>
		)}
	</div>
}

function GridSkeleton ({ count = 24 }) {
	return <>
		{Array.from({ length: count }).map((_, i) => (
			<div key={i} className="aspect-square rounded-md bg-gray-800 animate-pulse"></div>
		))}
	</>
}

const LONG_PRESS_DURATION = 450;

function LazyLoadingGalleryWithPlaceholder ({ currentMedia, onModal, onSelect, onLightbox, selected, userId, isAdmin, showCoverAction, onSetCover }) {
	const [loaded, setLoaded] = useState(new Set());
	const [error, setError] = useState(new Set());
	const [hoveredMedium, setHoveredMedium] = useState(null);
	const imageRefs = useRef({});
	const pressTimerRef = useRef(null);
	const longPressIdRef = useRef(null);

	useEffect(() => {
		currentMedia.forEach(medium => {
			const imgElement = imageRefs.current[medium.id];
			if (imgElement && imgElement.complete && imgElement.naturalHeight !== 0) {
				handleImageLoad(medium.id);
			}
		});
	}, [currentMedia]);

	const handleImageLoad = (id) => {
		setLoaded(prev => new Set(prev).add(id));
	};

	const handleImageError = (id) => {
		setError(prev => new Set(prev).add(id));
	};

	const handleCheckboxClick = (e, id) => {
		e.stopPropagation();
		onSelect(id);
	};

	const handleMediumClick = (elem) => {
		// Un appui long vient de sélectionner cet élément : on avale le click qui suit
		// (touchend/mouseup déclenchent aussi un click natif) pour ne pas le désélectionner aussitôt.
		if (longPressIdRef.current === elem.id) {
			longPressIdRef.current = null;
			return;
		}

		setHoveredMedium(null);
		if (selected.size > 0) {
			onSelect(elem.id);
		} else {
			onLightbox(elem);
		}
	};

	const handlePressStart = (elem) => {
		clearTimeout(pressTimerRef.current);
		pressTimerRef.current = setTimeout(() => {
			longPressIdRef.current = elem.id;
			onSelect(elem.id);
			if (navigator.vibrate) navigator.vibrate(30);
		}, LONG_PRESS_DURATION);
	};

	const handlePressEnd = () => {
		clearTimeout(pressTimerRef.current);
	};

	return <>
		{currentMedia.map((elem) => {
			const isSelected = selected.has(elem.id);
			const hasSelection = selected.size > 0;
			const isHovered = hoveredMedium === elem.id;
			const isLoaded = loaded.has(elem.id);
			const hasError = error.has(elem.id);
			const showPlaceholder = !isLoaded && !hasError;
			const canDelete = String(elem.author.id) === String(userId) || isAdmin;

			return <div key={elem.id}
						className={`relative cursor-pointer flex items-center justify-center aspect-square group gallery-item overflow-hidden rounded-md select-none transition-colors ${
							isSelected ? 'bg-gray-600' : 'bg-gray-800/80'
						}`}
						style={{ WebkitTouchCallout: 'none' }}
						onClick={() => handleMediumClick(elem)}
						onContextMenu={(e) => e.preventDefault()}
						onMouseEnter={() => setHoveredMedium(elem.id)}
						onMouseLeave={() => { setHoveredMedium(null); handlePressEnd(); }}
						onMouseDown={() => handlePressStart(elem)}
						onMouseUp={handlePressEnd}
						onTouchStart={() => handlePressStart(elem)}
						onTouchEnd={handlePressEnd}
						onTouchMove={handlePressEnd}
						onTouchCancel={handlePressEnd}
			>
				{elem.type !== 1 && showPlaceholder && (
					<div className="w-full h-full bg-gray-800 flex items-center justify-center absolute top-0 left-0 z-10">
						<Loader2 size={16} className="text-gray-500 animate-spin" />
					</div>
				)}

				{/* Case à cocher : positionnée à part, ne dépend pas du survol pour rester visible
				    dès qu'un élément est sélectionné, et ne plaque pas de voile sombre sur la vignette. */}
				<div className={`absolute top-2 left-2 z-30 transition-opacity ${hasSelection || isHovered ? 'opacity-100' : 'opacity-0'}`}>
					<div onClick={(e) => handleCheckboxClick(e, elem.id)}
						 className={`cursor-pointer w-6 h-6 rounded-full flex items-center justify-center ${
							 isSelected
								 ? "bg-blue-600 ring-1 ring-white"
								 : "bg-transparent ring-1 ring-white hover:bg-white/20"
						 	 }`}
					>
						<Check size={14} className={isSelected ? "text-white" : "text-transparent"} />
					</div>
				</div>

				<div className={`absolute top-0 left-0 h-full w-full flex flex-col justify-between gap-2 transition-opacity ${
					isHovered ? 'opacity-100 z-20' : 'opacity-0 pointer-events-none'
				} bg-gradient-to-b from-black/10 via-black/20 to-black/50`}>
					<div className="flex justify-end gap-2 p-2">
						<div className={`flex gap-1.5 transition-opacity ${hasSelection ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
							<button
								className="relative w-7 h-7 rounded-full bg-black/60 hover:bg-white text-white hover:text-black flex items-center justify-center transition-colors"
								onClick={(e) => { e.stopPropagation(); setHoveredMedium(null); location.href = Routing.generate(URL_DOWNLOAD_MEDIUM, { id: elem.id }); }}
								aria-label="Télécharger"
							>
								<Download size={14} />
								<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -bottom-7 right-0 text-xs hidden whitespace-nowrap">Télécharger</span>
							</button>
							{showCoverAction && (
								<button
									className="relative w-7 h-7 rounded-full bg-black/60 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
									onClick={(e) => { e.stopPropagation(); onSetCover(elem); }}
									aria-label="Définir comme couverture"
								>
									<Image size={14} />
									<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -bottom-7 right-0 text-xs hidden whitespace-nowrap">Couverture de l'album</span>
								</button>
							)}
							{canDelete && (
								<button
									className="relative w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
									onClick={(e) => { e.stopPropagation(); onModal('deleteMedium', elem); }}
									aria-label="Supprimer"
								>
									<Trash2 size={14} />
									<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -bottom-7 right-0 text-xs hidden whitespace-nowrap">Supprimer</span>
								</button>
							)}
						</div>
					</div>
					<div className={`flex justify-between gap-2 p-2 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
						<div className="flex items-center gap-2">
							<div className="w-8 h-8 rounded-full shadow">
								{elem.author.avatarFile
									? <img src={elem.author.avatarFile} alt={`avatar de ${elem.author.username}`} className="w-8 h-8 object-cover rounded-full" />
									: <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center font-semibold text-slate-50">
										{elem.author.lastname.slice(0, 1) + elem.author.firstname.slice(0, 1)}
									</div>
								}
							</div>
							<div className="font-medium text-sm text-slate-50">{elem.author.displayName}</div>
						</div>
					</div>
				</div>

				{elem.type === 1 ? (
					<>
						<video className={`w-full h-full object-cover pointer-events-none transition-transform duration-150 ${isSelected ? 'scale-[0.92] rounded-lg' : ''}`} preload="metadata" muted>
							<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} />
						</video>
						<Play size={20} className="absolute bottom-2 left-2 text-white drop-shadow z-10" fill="white" />
					</>
				) : (
					<img
						ref={el => imageRefs.current[elem.id] = el}
						src={Routing.generate(URL_GET_THUMBS_SRC, { id: elem.id })}
						alt=""
						key={elem.id}
						className={`pointer-events-none w-full h-full object-cover transition-all duration-150 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isSelected ? 'scale-[0.92] rounded-lg' : ''}`}
						loading="lazy"
						onLoad={(e) => {
							if (e.target.complete && e.target.naturalHeight !== 0) {
								handleImageLoad(elem.id);
							}
						}}
						onError={() => handleImageError(elem.id)}
					/>
				)}
			</div>
		})}
	</>
}

class LightboxContent extends Component {
	constructor (props) {
		super(props);

		this.state = {
			elem: props.elem ? props.elem : null,
			actualRank: props.elem ? props.elem.rankMedia : 1,
			currentIndex: 0,
			isDragging: false,
			startX: 0,
			currentTranslate: 0,
			showAlbumPicker: false,
		}

		this.gallery = React.createRef();
	}

	handleCloseModal = (e) => {
		e.preventDefault();

		const { identifiant } = this.props;

		let [body, modal, modalContent, btns] = ModalFunctions.getElements(identifiant);

		ModalFunctions.closeM(body, modal, modalContent);
	}

	handleMouseDown = (e) => {
		this.setState({ isDragging: true, startX: e.clientX })
		this.gallery.current.style.cursor = 'grabbing';
	};

	handleTouchStart = (e) => {
		this.setState({ isDragging: true, startX: e.targetTouches[0].clientX })
	};

	handleMouseMove = (e) => {
		const { isDragging, startX } = this.state;

		if (!isDragging) return;
		this.setState({ currentTranslate: e.clientX - startX })
	};

	handleTouchMove = (e) => {
		const { isDragging, startX } = this.state;

		if (!isDragging) return;
		this.setState({ currentTranslate: e.touches[0].clientX - startX })
	};

	handleMouseUp = () => {
		this.setState({ isDragging: false })
		this.gallery.current.style.cursor = 'grab';
		this.handleSwipeEnd();
	};

	handleTouchEnd = () => {
		this.setState({ isDragging: false })
		this.handleSwipeEnd();
	};

	handleShare = async () => {
		const { elem } = this.state;
		const absoluteUrl = window.location.origin + Routing.generate(URL_DOWNLOAD_MEDIUM, { id: elem.id });

		if (navigator.share) {
			try {
				await navigator.share({ url: absoluteUrl, title: 'Photo Nompaw' });
			} catch (e) {
				// annulé par l'utilisateur, rien à faire
			}
		} else if (navigator.clipboard) {
			await navigator.clipboard.writeText(absoluteUrl);
			Toastr.toast('info', 'Lien copié.');
		}
	}

	toggleAlbumPicker = () => {
		this.setState(prev => ({ showAlbumPicker: !prev.showAlbumPicker }));
	}

	handleAssignAlbum = (albumId) => {
		const { onAssignAlbum, albums = [] } = this.props;
		const { elem } = this.state;

		onAssignAlbum(elem.id, albumId);

		const album = albumId ? albums.find(a => String(a.id) === String(albumId)) : null;
		this.setState({ elem: { ...elem, album }, showAlbumPicker: false });
	}

	handleDelete = () => {
		const { onDelete } = this.props;
		const { elem } = this.state;

		onDelete(elem);
	}

	handleSwipeEnd = () => {
		const { actualRank, currentTranslate } = this.state;

		if (currentTranslate > 50) {
			this.handlePrev(actualRank);
		} else if (currentTranslate < -50) {
			this.handleNext(actualRank);
		}
		this.setState({ currentTranslate: 0 })
	};

	handleNext = (rankMedia) => {
		const { images } = this.props;
		const { elem } = this.state;

		let nRank = rankMedia + 1;

		if (nRank > images.length) {
			nRank = rankMedia;
		}

		let nElem = elem;
		images.forEach(image => {
			if (image.rankMedia === nRank) {
				nElem = image;
			}
		})

		this.setState({ actualRank: nRank, elem: nElem })
	}

	handlePrev = (rankMedia) => {
		const { images } = this.props;
		const { elem } = this.state;

		let nRank = rankMedia - 1;

		if (nRank < 1) {
			nRank = rankMedia;
		}

		let nElem = elem;
		images.forEach(image => {
			if (image.rankMedia === nRank) {
				nElem = image;
			}
		})

		this.setState({ actualRank: nRank, elem: nElem })
	}

	render () {
		const { images, userId, isAdmin, albums = [], onDelete, onSetCover } = this.props;
		const { actualRank, elem, currentTranslate, showAlbumPicker } = this.state;

		if(!elem){
			return;
		}

		const canDelete = onDelete && (String(elem.author?.id) === String(userId) || isAdmin);

		return <div className="w-full h-full"
					onMouseDown={this.handleMouseDown}
					onMouseMove={this.handleMouseMove}
					onMouseUp={this.handleMouseUp}
					onMouseLeave={this.handleMouseUp}
					onTouchStart={this.handleTouchStart}
					onTouchMove={this.handleTouchMove}
					onTouchEnd={this.handleTouchEnd}
		>
			<div className="fixed z-50 bg-gradient-to-t from-gray-800 to-black/30 top-0 md:bg-none left-0 w-full flex justify-between items-start p-4 md:p-8 text-white">
				<div>
					<div className="text-gray-400 text-sm">{elem.rankMedia} / {images.length}</div>
					{elem.takenAt && <div className="text-gray-500 text-xs mt-0.5">{new Date(elem.takenAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>}
				</div>
				<div>
					<div className="lightbox-action relative group close-modal cursor-pointer" onClick={this.handleCloseModal}>
						<X size={24} className="text-gray-400 group-hover:text-white" />
						<span className="tooltip bg-gray-300 text-black py-1 px-2 rounded absolute -top-7 right-0 text-xs hidden">Fermer</span>
					</div>
				</div>
			</div>

			<div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-6 px-4 z-20 flex justify-center gap-8 text-white">
				<button className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-white" onClick={this.handleShare}>
					<Share2 size={20} />
					Partager
				</button>
				<a className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-white" href={Routing.generate(URL_DOWNLOAD_MEDIUM, { id: elem.id })} download>
					<Download size={20} />
					Télécharger
				</a>
				<div className="relative">
					<button className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-white" onClick={this.toggleAlbumPicker}>
						<Plus size={20} />
						Album
					</button>
					{showAlbumPicker && (
						<div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg py-2 w-56 max-h-64 overflow-y-auto text-left z-30">
							<button className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700" onClick={() => this.handleAssignAlbum(null)}>
								Aucun album
							</button>
							{albums.length === 0 && (
								<div className="px-4 py-2 text-xs text-gray-500">Aucun album créé pour l'instant.</div>
							)}
							{albums.map(album => (
								<button key={album.id}
										className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${elem.album && String(elem.album.id) === String(album.id) ? "text-blue-400" : "text-gray-200"}`}
										onClick={() => this.handleAssignAlbum(album.id)}>
									{album.name}
								</button>
							))}
						</div>
					)}
				</div>
				{onSetCover && (
					<button className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-white" onClick={() => onSetCover(elem.id)}>
						<Image size={20} />
						Couverture
					</button>
				)}
				{canDelete && (
					<button className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-red-400" onClick={this.handleDelete}>
						<Trash2 size={20} />
						Supprimer
					</button>
				)}
			</div>

			<div className="flex justify-center items-center w-full h-full">
				<div className="cursor-pointer fixed group top-0 h-[calc(100%-65px)] md:top-[97px] md:h-full left-0 flex items-center justify-center p-4 md:p-8 z-20 text-white"
					 onClick={() => this.handlePrev(actualRank > 1 ? actualRank : (images.length + 1))}>
					<ChevronLeft size={28} className="text-gray-400 group-hover:text-white" />
				</div>
				<div ref={this.gallery} className="relative flex justify-center items-center w-full h-full cursor-grab">
					{images.map(image => {
						if(image.type === 1){
							return <video key={image.id} className="max-h-dvh" preload="metadata" controls>
								<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} />
							</video>
						}else{
							return <div key={image.id} className={`${elem.id === image.id ? "opacity-100" : "opacity-0"} transition-opacity absolute top-0 left-0 w-full h-full`}>
								<img src={Routing.generate(URL_READ_MEDIUM_HD, { id: elem.id })} alt={`Photo ${elem.file || image.id}`}
									 className="max-w-[1024px] mx-auto w-full h-full pointer-events-none object-contain select-none outline-none transition-transform"
									 style={{ transform: `translateX(${currentTranslate}px)` }} />
							</div>
						}
					})}
				</div>
				<div className="cursor-pointer fixed group top-0 h-[calc(100%-65px)] md:top-[97px] md:h-full right-0 flex items-center justify-center p-4 md:p-8 z-20 text-white"
					 onClick={() => this.handleNext(actualRank < images.length ? actualRank : 1)}>
					<ChevronRight size={28} className="text-gray-400 group-hover:text-white" />
				</div>
			</div>
		</div>
	}
}
