import React, { Component, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import ModalFunctions from '@commonFunctions/modal';

import { Modal } from "@tailwindComponents/Elements/Modal";
import { LightBox } from "@tailwindComponents/Elements/LightBox";
import { InputFile, Input, TextArea } from "@tailwindComponents/Elements/Fields";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_FETCH_MEDIA = "intern_api_photos_media_fetch";
const URL_AUTHORS = "intern_api_photos_media_authors";
const URL_UPLOAD_MEDIA = "intern_api_photos_media_upload";
const URL_DELETE_MEDIUM = "intern_api_photos_media_delete";
const URL_DELETE_MEDIA = "intern_api_photos_media_deletes";
const URL_DOWNLOAD_MEDIUM = "intern_api_photos_media_download";
const URL_DOWNLOAD_SELECTED = "intern_api_photos_media_download_selected";
const URL_GET_FILE_SRC = "intern_api_photos_media_file_src";
const URL_GET_THUMBS_SRC = "intern_api_photos_media_thumbs_src";
const URL_READ_MEDIUM_HD = "intern_api_photos_media_file_hd_src";
const URL_ALBUM_LIST = "intern_api_photos_album_list";
const URL_ALBUM_CREATE = "intern_api_photos_album_create";
const URL_ALBUM_DELETE = "intern_api_photos_album_delete";

export class PhotosGallery extends Component {
	constructor (props) {
		super(props);

		this.state = {
			files: "",
			albumIdUpload: "",
			albumName: "",
			albumDescription: "",
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
		}

		this.files = React.createRef();
		this.formFiles = React.createRef();
		this.formAlbum = React.createRef();
		this.deleteMedium = React.createRef();
		this.deleteFiles = React.createRef();
		this.deleteAllFiles = React.createRef();
		this.deleteAlbum = React.createRef();
		this.lightbox = React.createRef();
		this.observer = null;
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

		this.observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && this.state.hasMore && !this.state.loading) {
					this.fetchMedia();
				}
			},
			{ threshold: 0.1 }
		);

		if (this.sentinelRef.current) {
			this.observer.observe(this.sentinelRef.current);
		}
	}

	componentWillUnmount() {
		if (this.observer && this.sentinelRef.current) {
			this.observer.unobserve(this.sentinelRef.current);
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
		modalDeleteAllMedia(this);
		this.setState({ medium: medium })
		this[identifiant].current.handleClick();
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const files = this.files.current.state.files;

		this.handleParallelUpload(files, 5);
	}

	async handleParallelUpload(files, batchSize) {
		const { albumIdUpload } = this.state;
		const total = files.length;
		let completed = 0;

		this.setState({ nbTotal: total });

		for (let i = 0; i < total; i += batchSize) {
			const batch = files.slice(i, i + batchSize);

			await Promise.all(batch.map(async (file) => {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('mtime', Math.floor(file.lastModified / 1000));
				if (albumIdUpload) {
					formData.append('albumId', albumIdUpload);
				}

				try {
					await axios.post(Routing.generate(URL_UPLOAD_MEDIA), formData);
					completed++;
					this.setState({ nbProgress: completed, nbTotal: total });
				} catch (error) {
					console.error('Upload failed:', error);
				}
			}));
		}

		Toastr.toast('info', "Photos envoyées.");
		location.reload();
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

	handleDeleteAllMedia = () => {
		const { allMedia } = this.state;

		let ids = allMedia.map(elem => elem.id);

		let self = this;
		Formulaire.loader(true);
		this.deleteAllFiles.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_MEDIA), data: { selected: ids } })
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
		const { allMedia } = this.state;

		this.lightbox.current.handleUpdateContent(<LightboxContent key={elem.rankMedia} identifiant="lightbox" images={allMedia} elem={elem} />);
		this.lightbox.current.handleClick();
	}

	handleCreateAlbum = (e) => {
		e.preventDefault();

		const { albumName, albumDescription } = this.state;

		let self = this;
		Formulaire.loader(true);

		let formData = new FormData();
		formData.append("data", JSON.stringify({ name: albumName, description: albumDescription }));

		axios({ method: "POST", url: Routing.generate(URL_ALBUM_CREATE), data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
			.then(function () {
				Toastr.toast('info', "Album créé.");
				self.formAlbum.current.handleClose();
				self.setState({ albumName: "", albumDescription: "" });
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
		const { userId, isAdmin } = this.props;
		const { errors, files, allMedia, currentMedia, selected, nbProgress, nbTotal, loading, hasMore,
			authors, albums, authorFilter, albumFilter, albumIdUpload, albumName, albumDescription } = this.state;

		let params0 = { errors: errors, onChange: this.handleChange }

		return <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
			<div className="flex flex-col gap-4 mb-6">
				<div className="flex items-center justify-between flex-wrap gap-2">
					<div>
						<h3 className="text-2xl font-bold text-slate-900">Photos</h3>
						<p className="text-sm text-slate-600 mt-1">
							<span className="font-medium">{allMedia.length}</span> photo{allMedia.length > 1 ? 's' : ''}
							{selected.size > 0 && (
								<>
									<span className="mx-2">•</span>
									<span className="font-medium text-blue-600">{selected.size}</span> sélectionnée{selected.size > 1 ? 's' : ''}
								</>
							)}
						</p>
					</div>

					<Button type="blue" iconLeft="add" onClick={() => this.handleModal('formFiles', null)}>
						Ajouter
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<button
						className={`px-3 py-1.5 rounded-md text-sm font-medium ${authorFilter === null ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
						onClick={() => this.handleFilter(null, albumFilter)}
					>
						Tous
					</button>
					<button
						className={`px-3 py-1.5 rounded-md text-sm font-medium ${String(authorFilter) === String(userId) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
						onClick={() => this.handleFilter(userId, albumFilter)}
					>
						Mes photos
					</button>
					{authors.filter(a => String(a.id) !== String(userId)).map(author => (
						<button
							key={author.id}
							className={`px-3 py-1.5 rounded-md text-sm font-medium ${String(authorFilter) === String(author.id) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
							onClick={() => this.handleFilter(author.id, albumFilter)}
						>
							{author.displayName}
						</button>
					))}
				</div>

				<div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
					<button
						className={`px-3 py-1.5 rounded-md text-sm font-medium ${albumFilter === null ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
						onClick={() => this.handleFilter(authorFilter, null)}
					>
						Tous les albums
					</button>
					{albums.map(album => (
						<div key={album.id} className="flex items-center gap-1">
							<button
								className={`px-3 py-1.5 rounded-md text-sm font-medium ${String(albumFilter) === String(album.id) ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700 hover:bg-blue-100"}`}
								onClick={() => this.handleFilter(authorFilter, album.id)}
							>
								{album.name} <span className="opacity-70">({album.mediaCount})</span>
							</button>
							{(String(album.author.id) === String(userId) || isAdmin) && (
								<ButtonIcon type="red" icon="trash" onClick={() => this.handleModal('deleteAlbum', album)} tooltipPosition="-bottom-7 right-0">
									Supprimer l'album
								</ButtonIcon>
							)}
						</div>
					))}
					<Button type="default" iconLeft="add" onClick={() => this.formAlbum.current.handleClick()}>
						Nouvel album
					</Button>
				</div>

				{(allMedia.length > 0 || selected.size > 0) && (
					<div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
						{currentMedia.length > 0 && (
							<Button
								type="default"
								iconLeft={selected.size === currentMedia.length ? "check-square" : "square"}
								onClick={this.handleSelectAll}
							>
								{selected.size === currentMedia.length ? 'Tout désélectionner' : 'Tout sélectionner'}
							</Button>
						)}

						{selected.size > 0 && currentMedia.length > 0 && (
							<div className="h-6 w-px bg-slate-300"></div>
						)}

						{selected.size > 0 ? (
							<>
								<Button type="default" iconLeft="download" onClick={this.handleDownloadSelected}>
									Télécharger ({selected.size})
								</Button>
								<Button type="red" iconLeft="trash" onClick={() => this.handleModal('deleteFiles', null)}>
									Supprimer ({selected.size})
								</Button>
							</>
						) : (
							isAdmin && allMedia.length > 0 && (
								<Button type="red" iconLeft="trash" onClick={() => this.handleModal('deleteAllFiles', null)}>
									Supprimer tout
								</Button>
							)
						)}
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 pswp-gallery" id="gallery">
				<LazyLoadingGalleryWithPlaceholder currentMedia={currentMedia}
												   onModal={this.handleModal}
												   onSelect={this.handleSelect} onLightbox={this.handleLightbox}
												   selected={selected} userId={userId} isAdmin={isAdmin} />
			</div>

			<div ref={this.sentinelRef} className="h-10"></div>

			<div className="mt-8">
				{loading && (
					<div className="text-center text-slate-600 text-sm py-4">
						<span className="icon-chart-3 animate-spin inline-block mr-2"></span>
						Chargement...
					</div>
				)}
				{!hasMore && currentMedia.length > 0 && (
					<div className="text-center text-slate-600 text-sm">Toutes les photos sont affichées.</div>
				)}
				{hasMore && !loading && currentMedia.length > 0 && (
					<div className="flex items-center justify-center">
						<Button type="blue" onClick={this.handleLoadMore}>Afficher plus</Button>
					</div>
				)}
				{!loading && currentMedia.length === 0 && (
					<div className="text-center text-slate-600 text-sm py-8">Aucune photo pour ce filtre.</div>
				)}
			</div>

			{nbProgress !== 0 && nbTotal !== 0
				? <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800/80 z-30">
					<div className="text-xl font-semibold text-white pt-24">{nbProgress} / {nbTotal}</div>
				</div>
				: null
			}

			{createPortal(<LightBox ref={this.lightbox} identifiant="lightbox" content={null} />
				, document.body
			)}

			{createPortal(<Modal ref={this.formFiles} identifiant="form-photos-media" maxWidth={1024} margin={1} title="Ajouter des photos"
								 content={<div className="flex flex-col gap-4">
									 <InputFile ref={this.files} type="multiple" identifiant="files" valeur={files} accept="video/*,image/*"
												max={500} maxSize={62914560} {...params0}>
										 Photos et vidéos (500 maximum par envoi)
									 </InputFile>
									 {albums.length > 0 && (
										 <div>
											 <label className="block text-sm font-medium leading-6 text-gray-800">Ajouter à un album (optionnel)</label>
											 <select
												 className="mt-1 block w-full rounded-md shadow-sm border-0 py-2 px-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300"
												 value={albumIdUpload}
												 onChange={(e) => this.setState({ albumIdUpload: e.target.value })}
											 >
												 <option value="">Aucun album</option>
												 {albums.map(album => <option key={album.id} value={album.id}>{album.name}</option>)}
											 </select>
										 </div>
									 )}
								 </div>}
								 footer={<Button type="blue" onClick={this.handleSubmit}>Confirmer</Button>} closeTxt="Annuler" />
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
								 </form>}
								 footer={<Button type="blue" onClick={this.handleCreateAlbum}>Créer</Button>} closeTxt="Annuler" />
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

			{createPortal(<Modal ref={this.deleteAllFiles} identifiant='delete-all-files' maxWidth={414} title="Supprimer les photos"
								 content={<p>Êtes-vous sûr de vouloir supprimer <b>les photos</b> ?</p>}
								 footer={null} closeTxt="Annuler" />
				, document.body
			)}
		</div>
	}
}

PhotosGallery.propTypes = {
	userId: PropTypes.string.isRequired,
	isAdmin: PropTypes.bool,
}

function modalDeleteMedium (self) {
	self.deleteMedium.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteMedium}>Confirmer la suppression</Button>)
}

function modalDeleteMedia (self) {
	self.deleteFiles.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteMedia}>Confirmer la suppression</Button>)
}

function modalDeleteAllMedia (self) {
	self.deleteAllFiles.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteAllMedia}>Confirmer la suppression</Button>)
}

function LazyLoadingGalleryWithPlaceholder ({ currentMedia, onModal, onSelect, onLightbox, selected, userId, isAdmin }) {
	const [loaded, setLoaded] = useState(new Set());
	const [error, setError] = useState(new Set());
	const [hoveredMedium, setHoveredMedium] = useState(null);
	const imageRefs = useRef({});

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
		setHoveredMedium(null);
		if (selected.size > 0) {
			onSelect(elem.id);
		} else {
			onLightbox(elem);
		}
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
						className={`relative cursor-pointer flex items-center justify-center bg-gray-900 min-h-[205px] md:min-h-[332px] group gallery-item overflow-hidden rounded-md ${
							isSelected ? 'border-8 border-blue-500' : ''
						}`}
						onClick={() => handleMediumClick(elem)}
						onMouseEnter={() => setHoveredMedium(elem.id)}
						onMouseLeave={() => setHoveredMedium(null)}
			>
				{elem.type !== 1 && showPlaceholder && (
					<div className="w-full h-full bg-white flex items-center justify-center absolute top-0 left-0 z-10">
						<span className="icon-chart-3 text-gray-400 animate-spin"></span>
					</div>
				)}

				<div className={`absolute top-0 left-0 h-full w-full flex flex-col justify-between gap-2 transition-opacity ${
					isSelected || isHovered ? 'opacity-100 z-20' : 'opacity-0'
				} bg-gradient-to-b from-black/10 via-black/20 to-black/50`}>
					<div className="flex justify-between gap-2 p-2">
						<div>
							<div onClick={(e) => handleCheckboxClick(e, elem.id)}
								 className={`cursor-pointer w-6 h-6 border-2 rounded-md ring-1 flex items-center justify-center transition-opacity ${
									 isSelected
										 ? "bg-blue-700 ring-blue-700"
										 : "bg-white ring-gray-100 hover:bg-blue-100"
								 	 } ${hasSelection || isHovered ? 'opacity-100' : 'opacity-0'}`
								 }
							>
								<span className={`icon-check1 text-sm ${isSelected ? "text-white" : "text-transparent"}`}></span>
							</div>
						</div>
						<div className={`flex gap-1 transition-opacity ${hasSelection || !isHovered ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
							<ButtonIcon type="default" icon="download" tooltipWidth={80} onClick={(e) => { e.stopPropagation(); setHoveredMedium(null); location.href = Routing.generate(URL_DOWNLOAD_MEDIUM, { id: elem.id }); }} tooltipPosition="-bottom-7 right-0">
								Télécharger
							</ButtonIcon>
							{canDelete && (
								<ButtonIcon type="red" icon="trash" onClick={(e) => { e.stopPropagation(); onModal('deleteMedium', elem); }} tooltipPosition="-bottom-7 right-0">
									Supprimer
								</ButtonIcon>
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
					<video className="h-[205px] md:h-[332px]" preload="metadata" controls>
						<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} type="video/mp4" />
					</video>
				) : (
					<img
						ref={el => imageRefs.current[elem.id] = el}
						src={Routing.generate(URL_GET_THUMBS_SRC, { id: elem.id })}
						alt=""
						key={elem.id}
						className={`pointer-events-none w-full h-auto transition-opacity ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
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
		const { images } = this.props;
		const { actualRank, elem, currentTranslate } = this.state;

		if(!elem){
			return;
		}

		return <>
			<div className="fixed bg-gradient-to-t from-gray-800 to-black/30 bottom-0 md:bottom-auto md:top-0 md:bg-none left-0 w-full flex justify-between p-4 md:p-8 text-white z-20">
				<div className="text-gray-400">{elem.rankMedia} / {images.length}</div>
				<div className="flex gap-4">
					<div>
						<a className="lightbox-action relative group" href={Routing.generate(URL_DOWNLOAD_MEDIUM, { id: elem.id })} download>
							<span className="icon-download !text-2xl text-gray-400 group-hover:text-white" />
							<span className="tooltip bg-gray-300 text-black py-1 px-2 rounded absolute -top-10 right-0 text-xs hidden">Télécharger</span>
						</a>
					</div>
					<div>
						<div className="lightbox-action relative group close-modal cursor-pointer" onClick={this.handleCloseModal}>
							<span className="icon-close !text-2xl text-gray-400 group-hover:text-white" />
							<span className="tooltip bg-gray-300 text-black py-1 px-2 rounded absolute -top-7 right-0 text-xs hidden">Fermer</span>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-center items-center w-full h-full">
				<div className="cursor-pointer fixed group top-0 h-[calc(100%-65px)] md:top-[97px] md:h-full left-0 flex items-center justify-center p-4 md:p-8 z-20 text-white"
					 onClick={() => this.handlePrev(actualRank > 1 ? actualRank : (images.length + 1))}>
					<span className="icon-left-chevron !text-2xl text-gray-400 group-hover:text-white"></span>
				</div>
				<div ref={this.gallery} className="relative flex justify-center items-center w-full h-full cursor-grab"
					 onMouseDown={this.handleMouseDown}
					 onMouseMove={this.handleMouseMove}
					 onMouseUp={this.handleMouseUp}
					 onMouseLeave={this.handleMouseUp}
					 onTouchStart={this.handleTouchStart}
					 onTouchMove={this.handleTouchMove}
					 onTouchEnd={this.handleTouchEnd}
				>
					{images.map(image => {
						if(image.type === 1){
							return <video key={image.id} className="max-h-dvh" preload="metadata" controls>
								<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} type="video/mp4" />
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
					<span className="icon-right-chevron !text-2xl text-gray-400 group-hover:text-white"></span>
				</div>
			</div>
		</>
	}
}
