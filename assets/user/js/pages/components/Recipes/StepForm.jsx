import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { LoaderTxt }  from "@commonComponents/Elements/Loader";
import { TinyMCE }    from "@commonComponents/Elements/TinyMCE";
import { Modal }      from "@commonComponents/Elements/Modal";

import Formulaire   from "@commonFunctions/formulaire";

export function StepFormulaire ({ step, recipe, content, onUpdateData, onRemoveStep })
{
    return <Form
        step={step}
        recipe={recipe}
        onUpdateData={onUpdateData}
        onRemoveStep={onRemoveStep}
        content={content ? Formulaire.setValue(content) : ""}
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
        }

        this.delete = React.createRef();
    }

    componentDidMount = () => {
        const { step, content } = this.props;

        let nContent = content ? content : "";
        let name = 'content-' + step;
        this.setState({ [name]: { value: nContent, html: nContent }, loadData: false })
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
        const { step, recipe } = this.props;
        const { errors, loadData } = this.state;

        return <div className="line line-tuto-step">
            {loadData
                ? <LoaderTxt />
                : <TinyMCE type={4} identifiant={`content-${step}`} valeur={this.state['content-' + step].value} params={{'id': recipe.id}}
                         errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                    <span>Etape {step}</span>
                    <ButtonIcon icon="trash" type="danger" onClick={this.handleDelete}>Enlever</ButtonIcon>
                </TinyMCE>
            }

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
