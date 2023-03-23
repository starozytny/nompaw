import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { Button } from "@commonComponents/Elements/Button";
import { InputFile } from "@commonComponents/Elements/Fields";
import { Modal } from "@commonComponents/Elements/Modal";

const URL_UPLOAD_IMAGES = "api_randos_rando_upload_images";

export class RandoImages extends Component{
    constructor(props) {
        super(props);

        this.state = {
            files: "",
            data: JSON.parse(props.images),
            errors: []
        }

        this.files = React.createRef();
        this.formFiles = React.createRef();
    }

    handleChange = (e) => { this.setState({[e.currentTarget.name]: e.currentTarget.value}) }

    handleModal = () => {
        modalForm(this);
        this.formFiles.current.handleClick();
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

    render () {
        const { errors, files, data } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div>
            <Button type="primary" onClick={this.handleModal}>Ajouter des photos</Button>

            <div className="rando-images">
                {data.map((elem, index) => {
                    return <div className="image" key={index}>
                        <img src={elem.thumbsFile} alt=""/>
                    </div>
                })}
            </div>

            <Modal ref={this.formFiles} identifiant="form-rando-images" maxWidth={1024} title="Ajouter des photos"
                   content={<>
                       <div className="line">
                           <InputFile ref={this.files} type="multi" identifiant="files" valeur={files} accept="/*" max={20}
                                      placeholder="Glissez et déposer des photos ou" {...params}>
                               Pièces jointes (20 fichiers maximums)
                           </InputFile>
                       </div>
                   </>}
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