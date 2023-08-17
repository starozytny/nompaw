import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { LoaderTxt }  from "@commonComponents/Elements/Loader";
import { TinyMCE }    from "@commonComponents/Elements/TinyMCE";
import { Modal }      from "@commonComponents/Elements/Modal";
import { InputFile }  from "@commonComponents/Elements/Fields";

import Formulaire   from "@commonFunctions/formulaire";

const URL_DELETE_IMAGE = "api_cook_instructions_delete_image";

export function StepFormulaire ({ step, recipe, element, onUpdateData, onRemoveStep })
{
    return <Form
        step={step}
        recipe={recipe}
        onUpdateData={onUpdateData}
        onRemoveStep={onRemoveStep}
        content={element ? Formulaire.setValue(element.value) : ""}
        image0File={element ? Formulaire.setValue(element.image0) : ""}
        image1File={element ? Formulaire.setValue(element.image1) : ""}
        image2File={element ? Formulaire.setValue(element.image2) : ""}
    />
}

StepFormulaire.propTypes = {
    step: PropTypes.number.isRequired,
    recipe: PropTypes.object.isRequired,
    onUpdateData: PropTypes.func.isRequired,
    onRemoveStep: PropTypes.func.isRequired,
    content: PropTypes.string,
}

class Form extends Component {
    constructor(props) {
        super(props);

        this.state = {
            errors: [],
            loadData: true,
            loadDelete: false,
            openImage1: !!props.image1File,
            openImage2: !!props.image2File,
            image0File: props.image0File,
            image1File: props.image1File,
            image2File: props.image2File,
            imageToDelete: null
        }

        this.delete = React.createRef();
        this.deleteFile = React.createRef();
        this.file0 = React.createRef();
        this.file1 = React.createRef();
        this.file2 = React.createRef();
    }

    componentDidMount = () => {
        const { step, content } = this.props;

        let nContent = content ? content : "";
        let name = 'content-' + step;
        this.setState({ [name]: { value: nContent, html: nContent }, loadData: false })
    }

    handleFile = (identifiant, files) => {
        const { step } = this.props;

        if(identifiant === ("image0File-" + step) && files.length > 0){
            this.setState({ openImage1: true })
        }
        if(identifiant === ("image1File-" + step) && files.length > 0){
            this.setState({ openImage2: true })
        }
    }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
        this.props.onUpdateData(this.props.step, html);
    }

    handleRemove = () => {
        this.props.onRemoveStep(this.props.step);
        this.delete.current.handleClose();
    }

    handleRemoveFile = () => {
        const { step, recipe } = this.props;
        const { imageToDelete, loadDelete } = this.state;

        if(!loadDelete){
            this.setState({ loadDelete: true })

            let self = this;
            axios({ method: "DELETE", url: Routing.generate(URL_DELETE_IMAGE, {'recipe': recipe.id, 'position': step, 'nb': imageToDelete}), data: {} })
                .then(function (response) {
                    toastr.info('Illustration supprimée.');

                    let name = 'image' + imageToDelete + 'File';
                    self.setState({ [name]: null })

                    self.deleteFile.current.handleClose();
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
                .then(function () { self.setState({ loadDelete: false }) })
            ;
        }

    }

    handleDelete = () => {
        this.delete.current.handleClick();
    }

    handleDeleteFile = (nb) => {
        this.setState({ imageToDelete: nb })
        this.deleteFile.current.handleClick();
    }

    render () {
        const { step, recipe } = this.props;
        const { errors, loadData, loadDelete, openImage1, openImage2, image0File, image1File, image2File } = this.state;

        let params  = { errors: errors, onCustomAction: this.handleFile };

        return <div className="step-form">
            <div className="line line-tuto-step">
                {loadData
                    ? <LoaderTxt />
                    : <TinyMCE type={4} identifiant={`content-${step}`} valeur={this.state['content-' + step].value} params={{'id': recipe.id}}
                               errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                        <span>Etape {step}</span>
                        <ButtonIcon icon="trash" type="danger" onClick={this.handleDelete}>Enlever</ButtonIcon>
                    </TinyMCE>
                }
            </div>

            <div className="line line-3">
                <div className="form-group">
                    <InputFile ref={this.file0} type="simple" identifiant={"image0File-" + step} valeur={image0File}
                               placeholder="Glissez et déposer une image" {...params}>
                        Illustration 1
                    </InputFile>
                    {image0File
                        ? <Button type="danger" onClick={() => this.handleDeleteFile(0)} isLoader={loadDelete}>Supprimer l'illustration 1</Button>
                        : null
                    }
                </div>
                {openImage1
                    ? <div className="form-group">
                        <InputFile ref={this.file1} type="simple" identifiant={"image1File-" + step} valeur={image1File}
                                   placeholder="Glissez et déposer une image" {...params}>
                            Illustration 2
                        </InputFile>
                        {image1File
                            ? <Button type="danger" onClick={() => this.handleDeleteFile(1)} isLoader={loadDelete}>Supprimer l'illustration 2</Button>
                            : null
                        }
                    </div>
                    : null
                }
                {openImage2
                    ? <div className="form-group">
                        <InputFile ref={this.file2} type="simple" identifiant={"image2File-" + step} valeur={image2File}
                                   placeholder="Glissez et déposer une image" {...params}>
                            Illustration 3
                        </InputFile>
                        {image2File
                            ? <Button type="danger" onClick={() => this.handleDeleteFile(2)} isLoader={loadDelete}>Supprimer l'illustration 3</Button>
                            : null
                        }
                    </div>
                    : null
                }
            </div>

            <Modal ref={this.delete} identifiant={`delete-content-${step}`} maxWidth={414} title={`Supprimer l'étape ${step}`}
                   content={<p>Etes-vous sûr de vouloir supprimer cette étape ? <br/><br/> <b className="txt-primary">Valider les modifications</b> pour que la suppression soit prise en compte. </p>}
                   footer={<Button onClick={this.handleRemove} type="danger">Confirmer la suppression</Button>} />

            <Modal ref={this.deleteFile} identifiant={`delete-file-${step}`} maxWidth={568} title={`Supprimer l'illustration ${step}`}
                   content={<p>Etes-vous sûr de vouloir supprimer cette illustration ? <br/><br/> Elle sera supprimé <b>directement après avoir </b><b className="txt-danger">Confirmé la suppression</b>.</p>}
                   footer={<Button onClick={this.handleRemoveFile} type="danger">Confirmer la suppression</Button>} />
        </div>
    }
}

Form.propTypes = {
    step: PropTypes.number.isRequired,
    recipe: PropTypes.object.isRequired,
    content: PropTypes.string.isRequired,
    onUpdateData: PropTypes.func.isRequired,
    onRemoveStep: PropTypes.func.isRequired,
}
