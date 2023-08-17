import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { LoaderTxt }  from "@commonComponents/Elements/Loader";
import { TinyMCE }    from "@commonComponents/Elements/TinyMCE";
import { Modal }      from "@commonComponents/Elements/Modal";
import { InputFile }  from "@commonComponents/Elements/Fields";

import Formulaire   from "@commonFunctions/formulaire";

export function StepFormulaire ({ step, recipe, element, onUpdateData, onRemoveStep })
{
    console.log(element)

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
            openImage1: !!props.image1File,
            openImage2: !!props.image2File,
        }

        this.delete = React.createRef();
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

    handleDelete = () => {
        this.delete.current.handleClick();
    }

    render () {
        const { step, recipe, image0File, image1File, image2File } = this.props;
        const { errors, loadData, openImage1, openImage2 } = this.state;

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
                <InputFile ref={this.file0} type="simple" identifiant={"image0File-" + step} valeur={image0File}
                           placeholder="Glissez et déposer une image" {...params}>
                    Illustration 1
                </InputFile>
                {openImage1
                    ? <InputFile ref={this.file1} type="simple" identifiant={"image1File-" + step} valeur={image1File}
                                 placeholder="Glissez et déposer une image" {...params}>
                        Illustration 2
                    </InputFile>
                    : null
                }
                {openImage2
                    ? <InputFile ref={this.file2} type="simple" identifiant={"image2File-" + step} valeur={image2File}
                                 placeholder="Glissez et déposer une image" {...params}>
                        Illustration 3
                    </InputFile>
                    : null
                }
            </div>

            <Modal ref={this.delete} identifiant={`delete-content-${step}`} maxWidth={414} title={`Supprimer l'étape ${step}`}
                   content={<p>Etes-vous sûr de vouloir supprimer cette étape ? <br/><br/> <b className="txt-primary">Valider les modifications</b> pour que la suppression soit prise en compte. </p>}
                   footer={<>
                       <Button onClick={this.handleRemove} type="danger">Confirmer la suppression</Button>
                   </>} />
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
