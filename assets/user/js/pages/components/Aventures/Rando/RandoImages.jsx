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
import { InputFile } from "@tailwindComponents/Elements/Fields";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

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
			files: "",
			allImages: [], // Toutes les images pour la lightbox
			currentImages: [], // Images affichées (pagination)
			selected: new Set(),
			errors: [],
			image: null,
			nbProgress: 0,
			nbTotal: 0,
			page: 1,
			hasMore: true,
			loading: false,
			rankPhoto: 1
		}

		this.files = React.createRef();
		this.formFiles = React.createRef();
		this.deleteImage = React.createRef();
		this.deleteFiles = React.createRef();
		this.deleteAllFiles = React.createRef();
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
	}

	componentWillUnmount() {
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
		modalForm(this);
		modalDeleteImage(this);
		modalDeleteImages(this);
		modalDeleteAllImages(this);
		this.setState({ image: image })
		this[identifiant].current.handleClick();
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { randoId } = this.props;
		const files = this.files.current.state.files;

		this.handleParallelUpload(files, randoId, 5);
	}

	async handleParallelUpload(files, randoId, batchSize) {
		const total = files.length;
		let completed = 0;

		this.setState({ nbTotal: total });

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
					this.setState({ nbProgress: completed, nbTotal: total });
				} catch (error) {
					console.error('Upload failed:', error);
				}
			}));
		}

		Toastr.toast('info', "Photos envoyées.");
		location.reload();
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

	handleDeleteAllImages = () => {
		const { allImages } = this.state;

		let ids = allImages.map(elem => elem.id);

		let self = this;
		Formulaire.loader(true);
		this.deleteAllFiles.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_IMAGES), data: { selected: ids } })
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

		this.lightbox.current.handleUpdateContent(<LightboxContent key={elem.rankPhoto} identifiant="lightbox" images={allImages} elem={elem} />);
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
		const { errors, files, allImages, currentImages, selected, nbProgress, nbTotal, loading, hasMore } = this.state;

		let params0 = { errors: errors, onChange: this.handleChange }

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

					<Button type="blue" iconLeft="add" onClick={() => this.handleModal('formFiles', null)}>
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

						{selected.size > 0 ? (
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
						) : (parseInt(userId) === parseInt(randoAuthor)
								? allImages.length > 0 && (
								<Button
									type="red"
									iconLeft="trash"
									onClick={() => this.handleModal('deleteAllFiles', null)}
								>
									Supprimer tout
								</Button>
							)
								: null
						)}
					</div>
				)}
			</div>

			<div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 pswp-gallery" id="gallery">
				<LazyLoadingGalleryWithPlaceholder currentImages={currentImages}
												   onModal={this.handleModal} onCover={this.handleCover}
												   onSelect={this.handleSelect} onLightbox={this.handleLightbox}
												   onVisibility={this.handleVisibility}
												   selected={selected} userId={userId} randoAuthor={randoAuthor} />
			</div>

			{/* Sentinel pour l'IntersectionObserver */}
			<div ref={this.sentinelRef} className="h-10"></div>

			{/* Loading et bouton */}
			<div className="mt-8">
				{loading && (
					<div className="text-center text-slate-600 text-sm py-4">
						<span className="icon-chart-3 animate-spin inline-block mr-2"></span>
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

			{nbProgress !== 0 && nbTotal !== 0
				? <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-gray-800/80 z-30">
					<div className="text-xl font-semibold text-white pt-24">{nbProgress} / {nbTotal}</div>
				</div>
				: null
			}

			{createPortal(<LightBox ref={this.lightbox} identifiant="lightbox" content={null} />
				, document.body
			)}

			{createPortal(<Modal ref={this.formFiles} identifiant="form-rando-images" maxWidth={1024} margin={1} title="Ajouter des photos"
								 content={<div>
									 <InputFile ref={this.files} type="multiple" identifiant="files" valeur={files} accept="video/*,image/*"
												max={500} maxSize={62914560} {...params0}>
										 Photos (500 maximum par envoi)
									 </InputFile>
								 </div>}
								 footer={null} closeTxt="Annuler" />
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

			{createPortal(<Modal ref={this.deleteAllFiles} identifiant='delete-all-files' maxWidth={414} title="Supprimer les photos"
								 content={<p>Êtes-vous sûr de vouloir supprimer <b>les photos</b> ?</p>}
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

function modalForm (self) {
	self.formFiles.current.handleUpdateFooter(<Button type="blue" onClick={self.handleSubmit}>Confirmer</Button>)
}

function modalDeleteImage (self) {
	self.deleteImage.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteImage}>Confirmer la suppression</Button>)
}

function modalDeleteImages (self) {
	self.deleteFiles.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteImages}>Confirmer la suppression</Button>)
}

function modalDeleteAllImages (self) {
	self.deleteAllFiles.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeleteAllImages}>Confirmer la suppression</Button>)
}

function LazyLoadingGalleryWithPlaceholder ({ currentImages, onModal, onCover, onSelect, onLightbox, onVisibility, selected, userId, randoAuthor }) {
	const [loaded, setLoaded] = useState(new Set());
	const [error, setError] = useState(new Set());
	const [hoveredImage, setHoveredImage] = useState(null);
	const imageRefs = useRef({});

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
		setHoveredImage(null);
		if (selected.size > 0) {
			onSelect(elem.id);
		} else {
			onLightbox(elem);
		}
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
						className={`relative cursor-pointer flex items-center justify-center bg-gray-900 min-h-[205px] md:min-h-[332px] group gallery-item overflow-hidden rounded-md ${
							isSelected ? 'border-8 border-blue-500' : ''
						}`}
						onClick={() => handleImageClick(elem)}
						onMouseEnter={() => setHoveredImage(elem.id)}
						onMouseLeave={() => setHoveredImage(null)}
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
							<ButtonIcon type="default" icon="download" tooltipWidth={80} onClick={(e) => { e.stopPropagation(); setHoveredImage(null); location.href = Routing.generate(URL_DOWNLOAD_IMAGE, { id: elem.id }); }} tooltipPosition="-bottom-7 right-0">
								Télécharger
							</ButtonIcon>
							{parseInt(userId) === parseInt(randoAuthor) && <>
								{elem.visibility === 1
									? <ButtonIcon type="default" icon="vision" tooltipWidth={90} onClick={(e) => { e.stopPropagation(); onVisibility(elem); }} tooltipPosition="-bottom-7 right-0">
										Rendre public
									</ButtonIcon>
									: <ButtonIcon type="yellow" icon="padlock" tooltipWidth={85} onClick={(e) => { e.stopPropagation(); onVisibility(elem); }} tooltipPosition="-bottom-7 right-0">
										Restreindre
									</ButtonIcon>
								}

								<ButtonIcon type="default" icon="image" tooltipWidth={132} onClick={(e) => { e.stopPropagation(); onCover(elem); }} tooltipPosition="-bottom-7 right-0">
									Image de couverture
								</ButtonIcon>
								<ButtonIcon type="red" icon="trash" onClick={(e) => { e.stopPropagation(); onModal('deleteImage', elem); }} tooltipPosition="-bottom-7 right-0">
									Supprimer
								</ButtonIcon>
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
					<video className="h-[205px] md:h-[332px]" controls>
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
				{elem.visibility === 1 && (
					<div className="absolute bottom-2 right-2 z-10">
						<div className="bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1">
							<span className="icon-group text-xs"></span>
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
		const { images } = this.props;
		const { actualRank, elem, currentTranslate } = this.state;

		if(!elem){
			return;
		}

		return <>
			<div className="fixed bg-gradient-to-t from-gray-800 to-black/30 bottom-0 md:bottom-auto md:top-0 md:bg-none left-0 w-full flex justify-between p-4 md:p-8 text-white z-20">
				<div className="text-gray-400">{elem.rankPhoto} / {images.length}</div>
				<div className="flex gap-4">
					<div>
						<a className="lightbox-action relative group" href={Routing.generate(URL_DOWNLOAD_IMAGE, { id: elem.id })} download>
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
							return <video key={image.id} className="max-h-dvh" controls>
								<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} type="video/mp4" />
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
					<span className="icon-right-chevron !text-2xl text-gray-400 group-hover:text-white"></span>
				</div>
			</div>
		</>
	}
}
