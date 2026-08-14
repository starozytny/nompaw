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
import { Button } from "@tailwindComponents/Elements/Button";
import {
	ChevronLeft, ChevronRight, Image, Download, Trash2, Check, Loader2,
	Share2, X, Eye, Lock, Users,
} from "lucide-react";

const URL_UPLOAD_IMAGES = "intern_api_aventures_images_upload_images";
const URL_DELETE_IMAGE = "intern_api_aventures_images_image_delete";
const URL_DELETE_IMAGES = "intern_api_aventures_images_delete";
const URL_DOWNLOAD_IMAGE = "intern_api_aventures_images_download";
const URL_DOWNLOAD_SELECTED = "intern_api_aventures_images_download_selected";
const URL_COVER_IMAGE = "intern_api_aventures_randos_cover";
const URL_GET_FILE_SRC = "intern_api_aventures_images_file_src";
const URL_GET_THUMBS_SRC = "intern_api_aventures_images_thumbs_src";
const URL_READ_IMAGE_HD = "intern_api_aventures_images_file_hd_src";
const URL_FETCH_IMAGES = "intern_api_aventures_images_fetch_images";
const URL_VISIBILITY_IMAGE = "intern_api_aventures_images_visibility";

export class RandoImages extends Component {
	constructor (props) {
		super(props);

		this.state = {
			allImages: [], // Toutes les images pour la lightbox
			currentImages: [], // Images affichées (pagination)
			selected: new Set(),
			image: null,
			nbProgress: 0,
			nbTotal: 0,
			page: 1,
			hasMore: true,
			loading: false,
			rankPhoto: 1
		}

		this.fileInputRef = React.createRef();
		this.deleteImage = React.createRef();
		this.deleteFiles = React.createRef();
		this.lightbox = React.createRef();
		this.observer = null;
		this.sentinelRef = React.createRef();
	}

	componentDidMount () {
		const { randoId } = this.props;

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
			this.handleParallelUpload(filesArray, randoId, 5);

			if (dropzone) {
				dropzone.classList.remove('active');
			}
		})

		this.fetchImages();

		this.observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && this.state.hasMore && !this.state.loading) {
					this.fetchImages();
				}
			},
			{ threshold: 0.1 }
		);

		if (this.sentinelRef.current) {
			this.observer.observe(this.sentinelRef.current);
		}

		window.addEventListener('beforeunload', this.handleBeforeUnload);
	}

	componentWillUnmount() {
		window.removeEventListener('beforeunload', this.handleBeforeUnload);

		if (this.observer && this.sentinelRef.current) {
			this.observer.unobserve(this.sentinelRef.current);
		}
	}

	fetchImages = () => {
		const { randoId } = this.props;
		const { page, loading, hasMore } = this.state;

		if (loading || !hasMore) return;

		this.setState({ loading: true });

		axios({
			method: "GET",
			url: Routing.generate(URL_FETCH_IMAGES, { id: randoId, page: page }),
			data: {}
		})
			.then((response) => {
				let allData = JSON.parse(response.data.images);
				let currentData = JSON.parse(response.data.currentImages);

				let i = 1;
				allData.forEach(item => {
					item.rankPhoto = i++;
				});

				let j = this.state.rankPhoto;
				currentData.forEach(item => {
					item.rankPhoto = j++;
				});

				this.setState(prevState => ({
					allImages: allData,
					currentImages: [...prevState.currentImages, ...currentData],
					rankPhoto: prevState.rankPhoto + currentData.length,
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
		this.fetchImages();
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
		const { currentImages } = this.state;
		this.setState(prevState => {
			if (prevState.selected.size === currentImages.length) {
				return { selected: new Set() };
			} else {
				return { selected: new Set(currentImages.map(img => img.id)) };
			}
		});
	}

	handleModal = (identifiant, image) => {
		modalDeleteImage(this);
		modalDeleteImages(this);
		this.setState({ image: image })
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
		e.target.value = '';

		if (files.length > 0) {
			this.handleParallelUpload(files, this.props.randoId, 5);
		}
	}

	async handleParallelUpload(files, randoId, batchSize) {
		const total = files.length;
		let completed = 0;
		let failed = 0;

		this.setState({ nbTotal: total, nbProgress: 0 });

		for (let i = 0; i < total; i += batchSize) {
			const batch = files.slice(i, i + batchSize);

			await Promise.all(batch.map(async (file, index) => {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('mtime', Math.floor(file.lastModified / 1000));

				try {
					await axios.post(
						Routing.generate(URL_UPLOAD_IMAGES, { id: randoId }),
						formData
					);
					completed++;
				} catch (error) {
					failed++;
					console.error('Upload failed:', error);
				}
				this.setState({ nbProgress: completed + failed, nbTotal: total });
			}));
		}

		if (failed > 0) {
			Toastr.toast('warning', `${completed} photo${completed > 1 ? 's' : ''} envoyée${completed > 1 ? 's' : ''}, ${failed} échec${failed > 1 ? 's' : ''}.`);
		}

		setTimeout(() => {
			this.setState({ nbTotal: 0, nbProgress: 0 });
			this.refreshAfterUpload();
		}, 1200);
	}

	refreshAfterUpload = () => {
		this.setState({
			allImages: [], currentImages: [], selected: new Set(),
			page: 1, hasMore: true, rankPhoto: 1, loading: false
		}, () => this.fetchImages());
	}

	handleDeleteImage = () => {
		const { image } = this.state;

		let self = this;
		Formulaire.loader(true);
		this.deleteImage.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_IMAGE, { id: image.id }), data: {} })
			.then(function (response) {
				Toastr.toast('info', "Photos supprimée.");
				location.reload();
			})
			.catch(function (error) {
				modalDeleteImage(self);
				Formulaire.displayErrors(self, error);
				Formulaire.loader(false);
			})
		;
	}

	handleDeleteImages = () => {
		const { selected } = this.state;

		let self = this;
		Formulaire.loader(true);
		this.deleteFiles.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_IMAGES), data: { selected: Array.from(selected) } })
			.then(function (response) {
				Toastr.toast('info', "Photos supprimée.");
				location.reload();
			})
			.catch(function (error) {
				modalDeleteImages(self);
				Formulaire.displayErrors(self, error);
				Formulaire.loader(false);
			})
		;
	}

	handleDownloadSelected = () => {
		const { selected } = this.state;

		if (selected.size === 0) return;

		Formulaire.loader(true);
		const imageIds = Array.from(selected);

		if (imageIds.length >= 5) {
			axios({
				method: "POST",
				url: Routing.generate(URL_DOWNLOAD_SELECTED),
				data: { imageIds: imageIds },
				responseType: 'blob'
			})
				.then(response => {
					const url = window.URL.createObjectURL(new Blob([response.data]));
					const link = document.createElement('a');
					link.href = url;
					link.setAttribute('download', `selection_photos_${imageIds.length}.zip`);
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
							console.error('Erreur serveur:', errorData);
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
				imageIds.map(imageId =>
					axios({
						method: "GET",
						url: Routing.generate(URL_DOWNLOAD_IMAGE, { id: imageId }),
						responseType: 'blob'
					})
				)
			)
				.then(responses => {
					responses.forEach((response, index) => {
						const url = window.URL.createObjectURL(new Blob([response.data]));
						const link = document.createElement('a');
						link.href = url;
						link.setAttribute('download', `photo_${imageIds[index]}.jpg`);
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

	handleCover = (image) => {
		const { randoId } = this.props;

		let self = this;
		Formulaire.loader(true);
		axios({ method: "PUT", url: Routing.generate(URL_COVER_IMAGE, { id: randoId }), data: { image: image.file } })
			.then(function (response) {
				Toastr.toast('info', "Photo de couverture modifiée.");
			})
			.catch(function (error) {
				Formulaire.displayErrors(self, error);
			})
			.then(function () {
				Formulaire.loader(false);
			})
		;
	}

	handleLightbox = (elem) => {
		const { allImages } = this.state;
		const { userId, randoAuthor } = this.props;

		this.lightbox.current.handleUpdateContent(
			<LightboxContent key={elem.rankPhoto} identifiant="lightbox" images={allImages} elem={elem}
							  userId={userId} randoAuthor={randoAuthor}
							  onVisibility={this.handleVisibility}
							  onCover={this.handleCover}
							  onDelete={(image) => {
								  this.lightbox.current.handleClose();
								  this.handleModal('deleteImage', image);
							  }} />
		);
		this.lightbox.current.handleClick();
	}

	handleVisibility = (image) => {
		const { allImages, currentImages } = this.state;

		let self = this;
		Formulaire.loader(true);
		axios({ method: "PUT", url: Routing.generate(URL_VISIBILITY_IMAGE, { id: image.id }), data: {} })
			.then(function (response) {
				Toastr.toast('info', "Visibilité modifiée.");

				let nAllImages = allImages.map(el => {
					if (el.id === image.id) {
						return { ...el, ...response.data };
					} else {
						return el;
					}
				});

				let nCurrentImages = currentImages.map(el => {
					if (el.id === image.id) {
						return { ...el, ...response.data };
					} else {
						return el;
					}
				});

				self.setState({ allImages: nAllImages, currentImages: nCurrentImages });
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
		const { userId, randoAuthor } = this.props;
		const { allImages, currentImages, selected, nbProgress, nbTotal, loading, hasMore } = this.state;

		return <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
			<div className="flex flex-col gap-4 mb-6">
				<div className="flex items-center justify-between">
					<div>
						<h3 className="text-2xl font-bold text-slate-900">Photos</h3>
						<p className="text-sm text-slate-600 mt-1">
							Les photos sont redimensionnées automatiquement, pour une utilisation avec les réseaux sociaux.
							Pour avoir les originaux, adressez vous au propriétaire.
							<br/>
							<span className="font-medium">{allImages.length}</span> photo{allImages.length > 1 ? 's' : ''}
							{selected.size > 0 && (
								<>
									<span className="mx-2">•</span>
									<span className="font-medium text-blue-600">{selected.size}</span> sélectionnée{selected.size > 1 ? 's' : ''}
								</>
							)}
						</p>
					</div>

					<Button type="blue" iconLeft="add" onClick={this.handleUploadClick}>
						Ajouter
					</Button>
				</div>

				{(allImages.length > 0 || selected.size > 0) && (
					<div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">

						{currentImages.length > 0 && (
							<Button
								type="default"
								iconLeft={selected.size === currentImages.length ? "check-square" : "square"}
								onClick={this.handleSelectAll}
							>
								{selected.size === currentImages.length ? 'Tout désélectionner' : 'Tout sélectionner'}
							</Button>
						)}

						{selected.size > 0 && currentImages.length > 0 && (
							<div className="h-6 w-px bg-slate-300"></div>
						)}

						{selected.size > 0 && (
							<>
								<Button
									type="default"
									iconLeft="download"
									onClick={this.handleDownloadSelected}
								>
									Télécharger ({selected.size})
								</Button>
								{parseInt(userId) === parseInt(randoAuthor)
									? <Button
										type="red"
										iconLeft="trash"
										onClick={() => this.handleModal('deleteFiles', null)}
									>
										Supprimer ({selected.size})
									</Button>
									: null
								}
							</>
						)}
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 pswp-gallery" id="gallery">
				{loading && currentImages.length === 0 ? (
					<GridSkeleton />
				) : (
					<LazyLoadingGalleryWithPlaceholder currentImages={currentImages}
													   onModal={this.handleModal} onCover={this.handleCover}
													   onSelect={this.handleSelect} onLightbox={this.handleLightbox}
													   onVisibility={this.handleVisibility}
													   selected={selected} userId={userId} randoAuthor={randoAuthor} />
				)}
			</div>

			{/* Sentinel pour l'IntersectionObserver */}
			<div ref={this.sentinelRef} className="h-10"></div>

			{/* Loading et bouton */}
			<div className="mt-8">
				{loading && currentImages.length > 0 && (
					<div className="flex items-center justify-center text-slate-600 text-sm py-4">
						<Loader2 size={16} className="animate-spin mr-2" />
						Chargement...
					</div>
				)}
				{!hasMore && currentImages.length > 0 && (
					<div className="text-center text-slate-600 text-sm">Toutes les photos sont affichées.</div>
				)}
				{hasMore && !loading && currentImages.length > 0 && (
					<div className="flex items-center justify-center">
						<Button type="blue" onClick={this.handleLoadMore}>Afficher plus</Button>
					</div>
				)}
			</div>

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

			{createPortal(<Modal ref={this.deleteImage} identifiant='delete-image' maxWidth={414} title="Supprimer cette photo"
								 content={<p>Êtes-vous sûr de vouloir supprimer cette image ?</p>}
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

RandoImages.propTypes = {
	userId: PropTypes.string.isRequired,
	randoId: PropTypes.string.isRequired,
	randoAuthor: PropTypes.string,
}

function modalDeleteImage (self) {
	self.deleteImage.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteImage}>Confirmer la suppression</Button>)
}

function modalDeleteImages (self) {
	self.deleteFiles.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteImages}>Confirmer la suppression</Button>)
}

function GridSkeleton ({ count = 24 }) {
	return <>
		{Array.from({ length: count }).map((_, i) => (
			<div key={i} className="min-h-[205px] md:min-h-[332px] rounded-md bg-slate-200 animate-pulse"></div>
		))}
	</>
}

const LONG_PRESS_DURATION = 450;

function LazyLoadingGalleryWithPlaceholder ({ currentImages, onModal, onCover, onSelect, onLightbox, onVisibility, selected, userId, randoAuthor }) {
	const [loaded, setLoaded] = useState(new Set());
	const [error, setError] = useState(new Set());
	const [hoveredImage, setHoveredImage] = useState(null);
	const imageRefs = useRef({});
	const pressTimerRef = useRef(null);
	const longPressIdRef = useRef(null);

	useEffect(() => {
		// Vérifier les images déjà chargées (en cache)
		currentImages.forEach(image => {
			const imgElement = imageRefs.current[image.id];
			if (imgElement && imgElement.complete && imgElement.naturalHeight !== 0) {
				handleImageLoad(image.id);
			}
		});
	}, [currentImages]);

	const handleImageLoad = (imageId) => {
		setLoaded(prev => {
			const newSet = new Set(prev);
			newSet.add(imageId);
			return newSet;
		});
	};

	const handleImageError = (imageId) => {
		setError(prev => {
			const newSet = new Set(prev);
			newSet.add(imageId);
			return newSet;
		});
	};

	const handleCheckboxClick = (e, imageId) => {
		e.stopPropagation();
		onSelect(imageId);
	};

	const handleImageClick = (elem) => {
		if (longPressIdRef.current === elem.id) {
			longPressIdRef.current = null;
			return;
		}

		setHoveredImage(null);
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
		{currentImages.map((elem, index) => {
			const isSelected = selected.has(elem.id);
			const hasSelection = selected.size > 0;
			const isHovered = hoveredImage === elem.id;
			const isLoaded = loaded.has(elem.id);
			const hasError = error.has(elem.id);
			const showPlaceholder = !isLoaded && !hasError;

			return <div key={elem.id}
						className={`relative cursor-pointer flex items-center justify-center min-h-[205px] md:min-h-[332px] group gallery-item overflow-hidden rounded-md select-none transition-colors ${
							isSelected ? 'bg-gray-600' : 'bg-gray-900'
						}`}
						style={{ WebkitTouchCallout: 'none' }}
						onClick={() => handleImageClick(elem)}
						onContextMenu={(e) => e.preventDefault()}
						onMouseEnter={() => setHoveredImage(elem.id)}
						onMouseLeave={() => { setHoveredImage(null); handlePressEnd(); }}
						onMouseDown={() => handlePressStart(elem)}
						onMouseUp={handlePressEnd}
						onTouchStart={() => handlePressStart(elem)}
						onTouchEnd={handlePressEnd}
						onTouchMove={handlePressEnd}
						onTouchCancel={handlePressEnd}
			>
				{elem.type !== 1 && showPlaceholder && (
					<div className="w-full h-full bg-white flex items-center justify-center absolute top-0 left-0 z-10">
						<Loader2 size={16} className="text-gray-400 animate-spin" />
					</div>
				)}

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
								onClick={(e) => { e.stopPropagation(); setHoveredImage(null); location.href = Routing.generate(URL_DOWNLOAD_IMAGE, { id: elem.id }); }}
								aria-label="Télécharger"
							>
								<Download size={14} />
								<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -bottom-7 right-0 text-xs hidden whitespace-nowrap">Télécharger</span>
							</button>
							{parseInt(userId) === parseInt(randoAuthor) && <>
								<button
									className={`relative w-7 h-7 rounded-full flex items-center justify-center transition-colors ${elem.visibility === 1 ? "bg-black/60 hover:bg-white text-white hover:text-black" : "bg-yellow-500 hover:bg-yellow-400 text-white"}`}
									onClick={(e) => { e.stopPropagation(); onVisibility(elem); }}
									aria-label={elem.visibility === 1 ? "Rendre public" : "Restreindre"}
								>
									{elem.visibility === 1 ? <Eye size={14} /> : <Lock size={14} />}
									<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -bottom-7 right-0 text-xs hidden whitespace-nowrap">{elem.visibility === 1 ? "Rendre public" : "Restreindre"}</span>
								</button>

								<button
									className="relative w-7 h-7 rounded-full bg-black/60 hover:bg-blue-600 text-white flex items-center justify-center transition-colors"
									onClick={(e) => { e.stopPropagation(); onCover(elem); }}
									aria-label="Image de couverture"
								>
									<Image size={14} />
									<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -bottom-7 right-0 text-xs hidden whitespace-nowrap">Image de couverture</span>
								</button>
								<button
									className="relative w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
									onClick={(e) => { e.stopPropagation(); onModal('deleteImage', elem); }}
									aria-label="Supprimer"
								>
									<Trash2 size={14} />
									<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -bottom-7 right-0 text-xs hidden whitespace-nowrap">Supprimer</span>
								</button>
							</>}
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
					<video className={`h-[205px] md:h-[332px] transition-transform duration-150 ${isSelected ? 'scale-[0.82] rounded-lg' : ''}`} controls>
						<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} />
					</video>
				) : (
					<img
						ref={el => imageRefs.current[elem.id] = el}
						src={Routing.generate(URL_GET_THUMBS_SRC, { id: elem.id })}
						alt=""
						key={elem.id}
						className={`pointer-events-none w-full h-auto transition-all duration-150 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${isSelected ? 'scale-[0.92] rounded-lg' : ''}`}
						loading="lazy"
						onLoad={(e) => {
							if (e.target.complete && e.target.naturalHeight !== 0) {
								handleImageLoad(elem.id);
							}
						}}
						onError={() => handleImageError(elem.id)}
					/>
				)}
				{elem.visibility === 1 && (
					<div className="absolute bottom-2 right-2 z-10">
						<div className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
							<Users size={14} />
							Participants
						</div>
					</div>
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
			actualRank: props.elem ? props.elem.rankPhoto : 1,
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

	handleShare = async () => {
		const { elem } = this.state;
		const absoluteUrl = window.location.origin + Routing.generate(URL_DOWNLOAD_IMAGE, { id: elem.id });

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

	handleVisibilityToggle = () => {
		const { onVisibility } = this.props;
		const { elem } = this.state;

		onVisibility(elem);
		this.setState({ elem: { ...elem, visibility: elem.visibility === 1 ? 0 : 1 } });
	}

	handleCoverClick = () => {
		const { onCover } = this.props;
		const { elem } = this.state;

		onCover(elem);
	}

	handleDeleteClick = () => {
		const { onDelete } = this.props;
		const { elem } = this.state;

		onDelete(elem);
	}

	handleMouseDown = (e) => {
		this.setState({
			isDragging: true,
			startX: e.clientX,
		})
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

	handleNext = (rankPhoto) => {
		const { images } = this.props;
		const { elem } = this.state;

		let nRank = rankPhoto + 1;

		if (nRank > images.length) {
			nRank = rankPhoto;
		}

		let nElem = elem;
		images.forEach(image => {
			if (image.rankPhoto === nRank) {
				nElem = image;
			}
		})

		this.setState({ actualRank: nRank, elem: nElem })
	}

	handlePrev = (rankPhoto) => {
		const { images } = this.props;
		const { elem } = this.state;

		let nRank = rankPhoto - 1;

		if (nRank < 1) {
			nRank = rankPhoto;
		}

		let nElem = elem;
		images.forEach(image => {
			if (image.rankPhoto === nRank) {
				nElem = image;
			}
		})

		this.setState({ actualRank: nRank, elem: nElem })
	}

	render () {
		const { images, userId, randoAuthor } = this.props;
		const { actualRank, elem, currentTranslate } = this.state;

		if(!elem){
			return;
		}

		const isOwner = parseInt(userId) === parseInt(randoAuthor);

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
				<div className="text-gray-400">{elem.rankPhoto} / {images.length}</div>
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
				<a className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-white" href={Routing.generate(URL_DOWNLOAD_IMAGE, { id: elem.id })} download>
					<Download size={20} />
					Télécharger
				</a>
				{isOwner && (
					<>
						<button className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-white" onClick={this.handleVisibilityToggle}>
							{elem.visibility === 1 ? <Eye size={20} /> : <Lock size={20} />}
							{elem.visibility === 1 ? "Rendre public" : "Restreindre"}
						</button>
						<button className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-white" onClick={this.handleCoverClick}>
							<Image size={20} />
							Couverture
						</button>
						<button className="flex flex-col items-center gap-1 text-xs text-gray-300 hover:text-red-400" onClick={this.handleDeleteClick}>
							<Trash2 size={20} />
							Supprimer
						</button>
					</>
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
							return <video key={image.id} className="max-h-dvh" controls>
								<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} />
							</video>
						}else{
							return <div key={image.id} className={`${elem.id === image.id ? "opacity-100" : "opacity-0"} transition-opacity absolute top-0 left-0 w-full h-full`}>
								<img src={Routing.generate(URL_READ_IMAGE_HD, { id: elem.id })} alt={`Photo ${elem.file || image.id}`}
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
