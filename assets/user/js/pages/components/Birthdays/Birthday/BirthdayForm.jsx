import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Input, InputFile } from "@commonComponents/Elements/Fields";
import { Button }           from "@commonComponents/Elements/Button";
import { TinyMCE }          from "@commonComponents/Elements/TinyMCE";

import Formulaire           from "@commonFunctions/formulaire";
import Validateur           from "@commonFunctions/validateur";
import Inputs               from "@commonFunctions/inputs";

const URL_INDEX_PAGE        = "user_birthdays_read";
const URL_CREATE_ELEMENT    = "api_birthdays_create";
const URL_UPDATE_ELEMENT    = "api_birthdays_update";
const TEXT_CREATE           = "Ajouter l'anniversaire";
const TEXT_UPDATE           = "Enregistrer les modifications";

export function BirthdayFormulaire ({ context, element })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        description={element ? Formulaire.setValue(element.description) : ""}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}
        startAt={element ? Formulaire.setValueDate(element.startAt) : ""}
        timeAt={element ? Formulaire.setValueTime(element.timeAt) : ""}
        iframeRoute={element ? Formulaire.setValue(element.iframeRoute) : ""}
    />

    return <div className="formulaire">{form}</div>;
}

BirthdayFormulaire.propTypes = {
    context: PropTypes.string.isRequired,
    element: PropTypes.object,
}

class Form extends Component {
    constructor(props) {
        super(props);

        let description = props.description ? props.description : "";

        this.state = {
            name: props.name,
            description: { value: description, html: description },
            startAt: props.startAt,
            timeAt: props.timeAt,
            iframeRoute: props.iframeRoute,
            errors: [],
        }

        this.file = React.createRef();
    }

    componentDidMount = () => { Inputs.initDateInput(this.handleChangeDate, this.handleChange, new Date()) }

    handleChange = (e, picker) => {
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "startAt"){
            value = Inputs.dateInput(e, picker, this.state[name]);
        }

        if(name === "timeAt"){
            value = Inputs.timeInput(e, this.state[name]);
        }

        this.setState({[name]: value})
    }

    handleChangeDate = (name, value) => { this.setState({ [name]: value }) }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { url } = this.props;
        const { name, startAt, timeAt } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [ {type: "text",  id: 'name', value: name} ];

        if(startAt !== ""){
            paramsToValidate = [...paramsToValidate, ...[{type: "date", id: 'startAt', value: startAt}]];
        }

        if(timeAt !== ""){
            paramsToValidate = [...paramsToValidate, ...[{type: "time", id: 'timeAt', value: timeAt}]];
        }

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            Formulaire.loader(true);
            let self = this;

            let formData = new FormData();
            formData.append("data", JSON.stringify(this.state));

            let file = this.file.current;
            if(file.state.files.length > 0){
                formData.append("image", file.state.files[0]);
            }

            axios({ method: "POST", url: url, data: formData, headers: {'Content-Type': 'multipart/form-data'} })
                .then(function (response) {
                    toastr.info('Données enregistrées.');
                    location.href = Routing.generate(URL_INDEX_PAGE, {'slug': response.data.slug});
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    render () {
        const { context, imageFile } = this.props;
        const { errors, name, description, startAt, timeAt, iframeRoute } = this.state;

        let params  = { errors: errors, onChange: this.handleChange };

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Informations générales</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-2">
                                <Input identifiant="name" valeur={name} {...params}>Nom *</Input>
                                <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                           placeholder="Glissez et déposer une image" {...params}>
                                    Illustration
                                </InputFile>
                            </div>
                            <div className="line line-2">
                                <Input type="js-date" identifiant="startAt" valeur={startAt} {...params}>Début le</Input>
                                <Input identifiant="timeAt" valeur={timeAt} placeholder="00h00" {...params}>A quelle heure</Input>
                            </div>
                            <div className="line">
                                <TinyMCE type={6} identifiant='description' valeur={description.value}
                                         errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                    Description
                                </TinyMCE>
                            </div>
                            <div className="line">
                                <Input identifiant="iframeRoute" valeur={iframeRoute} {...params}>Iframe carte</Input>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="line-buttons">
                    <Button isSubmit={true} type="primary">{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
                </div>
            </form>
        </>
    }
}

Form.propTypes = {
    context: PropTypes.string.isRequired,
    url: PropTypes.node.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    imageFile: PropTypes.string.isRequired,
}
