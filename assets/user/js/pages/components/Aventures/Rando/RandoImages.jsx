import React, { Component, useEffect, useState } from "react";
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
import { Button, ButtonIcon, ButtonIconA } from "@tailwindComponents/Elements/Button";

const URL_UPLOAD_IMAGES = "intern_api_aventures_images_upload_images";
const URL_DELETE_IMAGE = "intern_api_aventures_images_image_delete";
const URL_DELETE_IMAGES = "intern_api_aventures_images_delete";
const URL_DOWNLOAD_IMAGE = "intern_api_aventures_images_download";
const URL_COVER_IMAGE = "intern_api_aventures_randos_cover";
const URL_GET_FILE_SRC = "intern_api_aventures_images_file_src";
const URL_GET_THUMBS_SRC = "intern_api_aventures_images_thumbs_src";
const URL_READ_IMAGE_HD = "intern_api_aventures_images_file_hd_src";

export class RandoImages extends Component {
	constructor (props) {
		super(props);

		this.state = {
			files: "",
			data: JSON.parse(props.images),
			selected: [],
			errors: [],
			image: null,
			nbProgress: 0,
			nbTotal: 0
		}

		this.files = React.createRef();
		this.formFiles = React.createRef();
		this.deleteImage = React.createRef();
		this.deleteFiles = React.createRef();
		this.lightbox = React.createRef();
	}

	componentDidMount () {
		const { images } = this.props;

		let data = JSON.parse(images);

		let i = 1;
		data.forEach(item => {
			item.rankPhoto = i++;
		})

		this.setState({ data: data });
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleSelect = (id) => {
		const { selected } = this.state;

		let find = false;
		selected.forEach(s => {
			if (s === id) {
				find = true;
			}
		})

		let nSelected = [];
		if (find) {
			nSelected = selected.filter(s => s !== id);
		} else {
			nSelected = selected;
			nSelected.push(id);
		}

		this.setState({ selected: nSelected })
	}

	handleModal = (identifiant, image) => {
		modalForm(this);
		modalDeleteImage(this);
		modalDeleteImages(this);
		this.setState({ image: image })
		this[identifiant].current.handleClick();
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { randoId } = this.props;

		this.handleUploadChunk(this, randoId, 0, 20, 0);
	}

	handleUploadChunk (self, randoId, iStart, iEnd, iProceed) {
		let formData = new FormData();

		let max = 0;
		let postMaxSize = 524288000; // 500 MB

		let nIEnd = iEnd;

		let file = self.files.current, totalSize = 0;
		if (file.state.files.length > 0) {
			file.state.files.forEach((f, index) => {
				max++;
				if(index >= iStart && index < iEnd){
					totalSize += f.size;
					if(totalSize > postMaxSize){
						nIEnd--;
					}else{
						iProceed++;
						let lastMod = "" + f.lastModified
						formData.append("file-" + index, f);
						formData.append("file-" + index + '-time', lastMod.substring(0, lastMod.length - 3));
					}
				}
			})
		}

		this.setState({ nbTotal: max })

		formData.append("max", max);
		formData.append("iStart", iStart);
		formData.append("iEnd", nIEnd);
		formData.append("iProceed", iProceed);

		this.formFiles.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
		axios({ method: "POST", url: Routing.generate(URL_UPLOAD_IMAGES, { id: randoId }), data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
			.then(function (response) {
				if(response.data.continue){
					self.handleUploadChunk(self, randoId, response.data.iStart, response.data.iEnd, response.data.iProceed);
					self.setState({ nbProgress: response.data.iProceed })
				}else{
					self.setState({ nbProgress: max })
					Toastr.toast('info', "Photos envoyées.");
					location.reload();
				}
			})
			.catch(function (error) {
				modalForm(self);
				Formulaire.displayErrors(self, error);
			})
		;
	}

	handleDeleteImage = () => {
		const { image } = this.state;

		Formulaire.loader(true);
		let self = this;
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

		Formulaire.loader(true);
		let self = this;
		this.deleteFiles.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_IMAGES), data: { selected: selected } })
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

	handleCover = (image) => {
		const { randoId } = this.props;

		Formulaire.loader(true);
		let self = this;
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
		const { data } = this.state;

		this.lightbox.current.handleUpdateContent(<LightboxContent key={elem.rankPhoto} identifiant="lightbox" images={data} elem={elem} />);
		this.lightbox.current.handleClick();
	}

	render () {
		const { userId } = this.props;
		const { errors, files, data, selected, nbProgress, nbTotal } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		return <div className="flex flex-col gap-4">
			<div>
				<div className="flex gap-2">
					<Button type="blue" iconLeft="add" onClick={() => this.handleModal('formFiles', null)}>Ajouter des photos</Button>
					{selected.length !== 0
						? <>
							<Button type="red" onClick={() => this.handleModal('deleteFiles', null)}>Supprimer la sélection</Button>
						</>
						: null
					}
				</div>
			</div>

			<div className="text-xs text-gray-500">{data.length} image{data.length > 1 ? "s" : ""}</div>
			<div className="grid grid-cols-2 gap-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 pswp-gallery" id="gallery">
				<LazyLoadingGalleryWithPlaceholder currentImages={data}
												   onModal={this.handleModal} onCover={this.handleCover}
												   onSelect={this.handleSelect} onLightbox={this.handleLightbox}
												   selected={selected} userId={userId} />
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
												max={500} maxSize={62914560} {...params}>
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
		</div>
	}
}

RandoImages.propTypes = {
	userId: PropTypes.string.isRequired,
	randoId: PropTypes.string.isRequired,
	images: PropTypes.string.isRequired,
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

function LazyLoadingGalleryWithPlaceholder ({ currentImages, onModal, onCover, onSelect, onLightbox, selected, userId }) {
	const [loaded, setLoaded] = useState(Array(currentImages.length).fill(false));
	const [error, setError] = useState(Array(currentImages.length).fill(false));

	const handleImageLoad = (index) => {
		const updatedLoaded = [...loaded];
		updatedLoaded[index] = true;
		setLoaded(updatedLoaded);
	};

	const handleImageError = (index) => {
		const updatedError = [...error];
		updatedError[index] = true;
		setError(updatedError);
	};

	useEffect(() => {
		const timeoutId = currentImages.map((_, index) =>
			setTimeout(() => {
				if (!loaded[index]) {
					handleImageError(index);
				}
			}, 500)
		);

		return () => {
			// Nettoyer le timeout à la fin
			timeoutId.forEach((id) => clearTimeout(id));
		};
	}, [loaded]);

	return <>
		{currentImages.map((elem, index) => {
			return <div key={elem.id} className="relative cursor-pointer flex items-center justify-center bg-gray-900 min-h-[205px] md:min-h-[332px] group gallery-item overflow-hidden rounded-md">
				{elem.type !== 1
					? <div className={`w-full h-full bg-white flex items-center justify-center absolute top-0 left-0 ${!loaded[index] && (!error[index]) ? "opacity-100" : "opacity-0"}`}>
						<span className="icon-chart-3"></span>
					</div>
					: null
				}
				<div className={`image-rando absolute top-0 left-0 h-full w-full flex flex-col justify-between gap-2 transition-all ${selected.includes(elem.id) ? 'active' : ''}`}
					 style={elem.type === 1 ? { height: "87%" } : {}}
				>
					<div className="flex justify-between gap-2 p-2">
						<div className="group">
							<div className={`cursor-pointer w-6 h-6 border-2 rounded-md ring-1 flex items-center justify-center ${selected.includes(elem.id) ? "bg-blue-700 ring-blue-700" : "bg-white ring-gray-100 group-hover:bg-blue-100"}`}
								 onClick={() => onSelect(elem.id)}>
								<span className={`icon-check1 text-sm ${selected.includes(elem.id) ? "text-white" : "text-transparent"}`}></span>
							</div>
						</div>
						<div className="flex gap-1">
							<ButtonIcon type="default" icon="zoom-in" tooltipWidth={80} onClick={() => onLightbox(elem)} tooltipPosition="-bottom-7 right-0">
								Plein écran
							</ButtonIcon>
							{parseInt(userId) === elem.author.id && <>
								<ButtonIcon type="default" icon="image" tooltipWidth={132} onClick={() => onCover(elem)} tooltipPosition="-bottom-7 right-0">
									Image de couverture
								</ButtonIcon>
								<ButtonIcon type="red" icon="trash" onClick={() => onModal('deleteImage', elem)} tooltipPosition="-bottom-7 right-0">
									Supprimer
								</ButtonIcon>
							</>}
						</div>
					</div>
					<div className="absolute top-12 w-full h-[calc(100%-6rem)]" onClick={() => onLightbox(elem)}></div>
					<div className="flex justify-between gap-2 p-2">
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
						<div>
							<ButtonIconA type="default" icon="download"
										 onClick={Routing.generate(URL_DOWNLOAD_IMAGE, { id: elem.id })}>
								Télécharger
							</ButtonIconA>
						</div>
					</div>
				</div>
				{error[index]
					? <>
						{elem.type === 1
							? <video className="h-[205px] md:h-[332px]" controls>
								<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} type="video/mp4" />
							</video>
							: <img src={Routing.generate(URL_GET_THUMBS_SRC, { id: elem.id })} alt="error" key={elem.id + "error"} />
						}
					</>
					: <>
						{elem.type === 1
							? <video className="h-[205px] md:h-[332px]" controls>
								<source src={Routing.generate(URL_GET_FILE_SRC, { id: elem.id })} type="video/mp4" />
							</video>
							: <img src={Routing.generate(URL_GET_THUMBS_SRC, { id: elem.id })} alt="" key={elem.id}
								   loading="lazy"
								   onLoad={() => handleImageLoad(index)} // Appelé quand l'image est chargée
								   onError={() => handleImageError(index)} // En cas d'erreur de chargement
							/>
						}
					</>
				}
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
							<span className="tooltip bg-gray-300 text-black py-1 px-2 rounded absolute -top-7 right-0 text-xs hidden">Supprimer</span>
						</div>
					</div>
				</div>
			</div>
			<div className="flex justify-center items-center w-full h-full">
				<div className="cursor-pointer fixed group top-0 h-[calc(100%-65px)] md:top-[97px] md:h-full left-0 flex items-center justify-center p-4 md:p-8 z-20 text-white"
					 onClick={() => this.handlePrev(actualRank > 1 ? actualRank : (images.length + 1))}>
					<span className="icon-left-chevron !text-2xl text-gray-400 group-hover:text-white"></span>
				</div>
				<div ref={this.gallery} className="relative flex justify-center items-center w-full h-full"
					 onMouseDown={this.handleMouseDown}
					 onMouseMove={this.handleMouseMove}
					 onMouseUp={this.handleMouseUp}
					 onMouseLeave={this.handleMouseUp}
					 onTouchStart={this.handleTouchStart}
					 onTouchMove={this.handleTouchMove}
					 onTouchEnd={this.handleTouchEnd}
				>
					{images.map(image => {
						return <div key={image.id} className={`${elem.id === image.id ? "opacity-100" : "opacity-0"} transition-opacity absolute top-0 left-0 w-full h-full`}>
							<img src={Routing.generate(URL_READ_IMAGE_HD, { id: elem.id })} alt={`Photo ${image.id}`}
								 className="max-w-[1440px] mx-auto w-full h-full object-contain select-none outline-none transition-transform"
								 style={{ transform: `translateX(${currentTranslate}px)` }} />
						</div>
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
