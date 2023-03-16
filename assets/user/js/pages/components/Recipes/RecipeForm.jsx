import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Input, InputFile, Radiobox } from "@commonComponents/Elements/Fields";
import { TinyMCE }          from "@commonComponents/Elements/TinyMCE";
import { Button }           from "@commonComponents/Elements/Button";

import Formulaire           from "@commonFunctions/formulaire";
import Validateur           from "@commonFunctions/validateur";
import Inputs               from "@commonFunctions/inputs";


const URL_INDEX_PAGE        = "user_recipes_read";
const URL_CREATE_ELEMENT    = "api_recipes_create";
const URL_UPDATE_ELEMENT    = "api_recipes_update";
const TEXT_CREATE           = "Ajouter le produit";
const TEXT_UPDATE           = "Enregistrer les modifications";

export function RecipeFormulaire ({ context, element })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        content={element ? Formulaire.setValue(element.content) : ""}
        durationPrepare={element ? Formulaire.setValueTime(element.durationPrepare) : ""}
        durationCooking={element ? Formulaire.setValueTime(element.durationCooking) : ""}
        difficulty={element ? Formulaire.setValue(element.difficulty) : 0}
        status={element ? Formulaire.setValue(element.status) : 0}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}
    />

    return <div className="formulaire">{form}</div>;
}

RecipeFormulaire.propTypes = {
    context: PropTypes.string.isRequired,
    element: PropTypes.object,
    steps: PropTypes.array,
}

class Form extends Component {
    constructor(props) {
        super(props);

        let content = props.content ? props.content : "";

        this.state = {
            name: props.name,
            durationPrepare: props.durationPrepare,
            durationCooking: props.durationCooking,
            difficulty: props.difficulty,
            status: props.status,
            content: { value: content, html: content },
            errors: [],
        }

        this.file = React.createRef();
    }

    handleChange = (e) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === 'durationPrepare' || name === 'durationCooking'){
            value = Inputs.timeInput(e, this.state[name]);
        }

        this.setState({ [name]: value })
    }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleSubmit = (e, stay = false) => {
        e.preventDefault();

        const { url } = this.props;
        const { name, status, durationPrepare, durationCooking, difficulty, content } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'name', value: name},
            {type: "text",  id: 'difficulty', value: difficulty},
            {type: "text",  id: 'status', value: status},
            {type: "text",  id: 'content', value: content.html},
        ];

        if(durationPrepare !== ""){
            paramsToValidate = [...paramsToValidate, ...[ {type: "time", id: 'durationPrepare', value: durationPrepare} ]];
        }

        if(durationCooking !== ""){
            paramsToValidate = [...paramsToValidate, ...[ {type: "time", id: 'durationCooking', value: durationCooking} ]];
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
                    if(!stay){
                        location.href = Routing.generate(URL_INDEX_PAGE, {'slug': response.data.slug});
                    }else{
                        toastr.info('Données enregistrées.');

                        if(context === "create"){
                            location.href = Routing.generate(URL_INDEX_PAGE, {'slug': response.data.slug});
                        }else{
                            Formulaire.loader(false);
                        }
                    }
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    render () {
        const { context, imageFile } = this.props;
        const { errors,  name, status, durationPrepare, durationCooking,  difficulty, content } = this.state;

        let params  = { errors: errors, onChange: this.handleChange };

        let typesItems = [
            { value: 0, label: 'Facile',     identifiant: 'type-0' },
            { value: 1, label: 'Moyen',      identifiant: 'type-1' },
            { value: 2, label: 'Difficile',  identifiant: 'type-2' },
        ]

        let statusItems = [
            { value: 0, label: 'Hors ligne', identifiant: 'status-0' },
            { value: 1, label: 'En ligne',   identifiant: 'status-1' },
        ]

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Informations générales</div>
                            <div className="subtitle">
                                La content doit être très courte pour décrire rapidement à quoi sert cette documentation
                            </div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-fat-box">
                                <Radiobox items={statusItems} identifiant="status" valeur={status} {...params}>
                                    Visibilité *
                                </Radiobox>
                            </div>
                            <div className="line line-fat-box">
                                <Radiobox items={typesItems} identifiant="difficulty" valeur={difficulty} {...params}>
                                    Difficulté
                                </Radiobox>
                            </div>
                            <div className="line">
                                <Input identifiant="name" valeur={name} {...params}>Intitulé *</Input>
                            </div>
                            <div className="line line-2">
                                <Input identifiant="durationPrepare" valeur={durationPrepare} placeholder="00h00" {...params}>Durée de préparation</Input>
                                <Input identifiant="durationCooking" valeur={durationCooking} placeholder="00h00" {...params}>Durée de cuisson</Input>
                            </div>
                            <div className="line">
                                <TinyMCE type={4} identifiant='content' valeur={content.value}
                                         errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                    Courte description *
                                </TinyMCE>
                            </div>
                            <div className="line">
                                <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                           placeholder="Glissez et déposer une image" {...params}>
                                    Illustration
                                </InputFile>
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
    content: PropTypes.string.isRequired,
    durationPrepare: PropTypes.string.isRequired,
    durationCooking: PropTypes.string.isRequired,
    difficulty: PropTypes.number.isRequired,
    status: PropTypes.number.isRequired,
    imageFile: PropTypes.string.isRequired,
}
