import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Masonry, { ResponsiveMasonry } from "react-responsive-masonry"

import Formulaire from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { InputFile } from "@commonComponents/Elements/Fields";
import { Modal } from "@commonComponents/Elements/Modal";
import { Alert } from "@commonComponents/Elements/Alert";

const URL_UPLOAD_IMAGES  = "intern_api_aventures_images_upload_images";
const URL_DELETE_IMAGE   = "intern_api_aventures_images_delete";
const URL_DOWNLOAD_IMAGE = "intern_api_aventures_images_download";
const URL_COVER_IMAGE    = "intern_api_aventures_randos_cover";

export class RandoImages extends Component{
    constructor(props) {
        super(props);

        this.state = {
            files: "",
            data: JSON.parse(props.images),
            errors: [],
            image: null
        }

        this.files = React.createRef();
        this.formFiles = React.createRef();
        this.deleteImage = React.createRef();
    }

    handleChange = (e) => { this.setState({[e.currentTarget.name]: e.currentTarget.value}) }

    handleModal = (identifiant, image) => {
        modalForm(this);
        modalDeleteImage(this);
        this.setState({ image: image })
        this[identifiant].current.handleClick();
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { randoId } = this.props;

        Formulaire.loader(true);
        let self = this;

        let formData = new FormData();

        let file = this.files.current;
        if(file.state.files.length > 0) {
            file.state.files.forEach((f, index) => {
                formData.append("file-" + index, f);
            })
        }

        this.formFiles.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
        axios({ method: "POST", url: Routing.generate(URL_UPLOAD_IMAGES, {'id': randoId}), data: formData, headers: {'Content-Type': 'multipart/form-data'} })
            .then(function (response) {
                toastr.info("Photos envoyées."); location.reload();
            })
            .catch(function (error) { modalForm(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    handleDeleteImage = () => {
        const { image } = this.state;

        Formulaire.loader(true);
        let self = this;
        this.deleteImage.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer la suppression</Button>);
        axios({ method: "DELETE", url: Routing.generate(URL_DELETE_IMAGE, {'id': image.id}), data: {} })
            .then(function (response) {
                toastr.info('Photo supprimée.');
                location.reload();
            })
            .catch(function (error) { modalDeleteImage(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    handleCover = (image) => {
        const { randoId } = this.props;

        Formulaire.loader(true);
        let self = this;
        axios({ method: "PUT", url: Routing.generate(URL_COVER_IMAGE, {'id': randoId}), data: {image: image.thumbs} })
            .then(function (response) {
                toastr.info('Photo de couverture modifiée.');
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); })
            .then(function() { Formulaire.loader(false); })
        ;
    }

    render () {
        const { userId } = this.props;
        const { errors, files, data } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div>
            <Button type="warning" outline={true} onClick={() => this.handleModal('formFiles', null)}>Ajouter des photos</Button>

            <div style={{ marginTop: "12px" }}>
                <Alert type="warning">
                    Pour un tirage des photos, s'il existe, rendez-vous sur le Google Photos.
                </Alert>
            </div>

            <div className="rando-images">
                <ResponsiveMasonry
                    columnsCountBreakPoints={{320: 2, 768: 2, 900: 3}}
                >
                    <Masonry gutter={'1.2rem'}>
                        {data.map((elem, index) => {
                            return <div className="rando-image" key={index}>
                                <div className="image-data">
                                    <div className="action-top">
                                        {parseInt(userId) === elem.author.id && <>
                                            <ButtonIcon icon="image" tooltipWidth={132} onClick={() => this.handleCover(elem)}>
                                                Image de couverture
                                            </ButtonIcon>
                                            <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal('deleteImage', elem)}>
                                                Supprimer
                                            </ButtonIcon>
                                        </>}
                                    </div>
                                    <div className="action-bottom">
                                        <div className="image-author">
                                            <div className="avatar">
                                                {elem.author.avatarFile
                                                    ? <img src={elem.author.avatarFile} alt={`avatar de ${elem.author.username}`}/>
                                                    : <div className="avatar-letter">{elem.author.lastname.slice(0,1) + elem.author.firstname.slice(0,1)}</div>
                                                }
                                            </div>
                                            <div className="username">{elem.author.displayName}</div>
                                        </div>
                                        <div className="image-download">
                                            <ButtonIcon icon="download" element="a" download={true}
                                                        onClick={Routing.generate(URL_DOWNLOAD_IMAGE, {'id': elem.id})}>
                                                Télécharger
                                            </ButtonIcon>
                                        </div>
                                    </div>
                                </div>
                                <img src={elem.thumbsFile} alt=""/>
                            </div>
                        })}
                    </Masonry>
                </ResponsiveMasonry>
            </div>

            <Modal ref={this.formFiles} identifiant="form-rando-images" maxWidth={1024} title="Ajouter des photos"
                   content={<>
                       <div className="line">
                           <div className="form-group">
                               <Alert type="info" title="Traitement des photos">
                                   Les photos seront automatiquement redimensionnées s'ils sont trop grandes/lourdes.
                               </Alert>
                           </div>
                       </div>
                       <div className="line">
                           <InputFile ref={this.files} type="multi" identifiant="files" valeur={files} accept="/*" max={20}
                                      placeholder="Glissez et déposer des photos (20 max par envoi)" {...params}>
                               Pièces jointes (20 fichiers maximums)
                           </InputFile>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deleteImage} identifiant='delete-image' maxWidth={414} title="Supprimer cette photo"
                   content={<p>Etes-vous sûr de vouloir supprimer cette image ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

RandoImages.propTypes = {
    userId: PropTypes.string.isRequired,
    randoId: PropTypes.string.isRequired,
    images: PropTypes.string.isRequired,
}

function modalForm (self) {
    self.formFiles.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmit}>Confirmer</Button>)
}
function modalDeleteImage (self) {
    self.deleteImage.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeleteImage}>Confirmer la suppression</Button>)
}
