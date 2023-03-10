import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { LoaderTxt }  from "@commonComponents/Elements/Loader";
import { ButtonIcon } from "@commonComponents/Elements/Button";
import { TinyMCE }    from "@commonComponents/Elements/TinyMCE";

import Formulaire   from "@commonFunctions/formulaire";

export function StepFormulaire ({ step, content, onUpdateData, onRemoveStep })
{
    return <Form
        step={step}
        onUpdateData={onUpdateData}
        onRemoveStep={onRemoveStep}
        content={content ? Formulaire.setValue(content) : ""}
    />
}

StepFormulaire.propTypes = {
    step: PropTypes.number.isRequired,
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
    }

    render () {
        const { step } = this.props;
        const { errors, loadData } = this.state;

        return <div className="line line-tuto-step">
            {loadData
                ? <LoaderTxt />
                : <TinyMCE type={4} identifiant={`content-${step}`} valeur={this.state['content-' + step].value}
                         errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                    <span>Etape {step}</span>
                    <ButtonIcon icon="close" type="danger" onClick={this.handleRemove}>Enlever</ButtonIcon>
                </TinyMCE>
            }
        </div>
    }
}

Form.propTypes = {
    step: PropTypes.number.isRequired,
    content: PropTypes.string.isRequired,
    onUpdateData: PropTypes.func.isRequired,
    onRemoveStep: PropTypes.func.isRequired,
}
