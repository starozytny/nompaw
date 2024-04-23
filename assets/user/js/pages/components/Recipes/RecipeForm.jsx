import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Input, InputFile, Radiobox } from "@tailwindComponents/Elements/Fields";
import { Button }           from "@tailwindComponents/Elements/Button";

import Formulaire           from "@commonFunctions/formulaire";
import Validateur           from "@commonFunctions/validateur";

const URL_INDEX_PAGE        = "user_recipes_read";
const URL_CREATE_ELEMENT    = "intern_api_cook_recipes_create";
const URL_UPDATE_ELEMENT    = "intern_api_cook_recipes_update";
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
        status={element ? Formulaire.setValue(element.status) : 0}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}
    />

    return <div className="formulaire">{form}</div>;
}

RecipeFormulaire.propTypes = {
    context: PropTypes.string.isRequired,
    element: PropTypes.object
}

class Form extends Component {
    constructor(props) {
        super(props);

        this.state = {
            name: props.name,
            status: props.status,
            errors: [],
        }

        this.file = React.createRef();
    }

    handleChange = (e) => { this.setState({ [e.currentTarget.name]: e.currentTarget.value }) }

    handleSubmit = (e, stay = false) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { name, status } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'name', value: name},
            {type: "text",  id: 'status', value: status},
        ];

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
        const { errors,  name, status } = this.state;

        let params  = { errors: errors, onChange: this.handleChange };

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
                                Le contenu de la recette sera rempli dans la prochaine étape.
                            </div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-fat-box">
                                <Radiobox items={statusItems} identifiant="status" valeur={status} {...params}>
                                    Visibilité *
                                </Radiobox>
                            </div>
                            <div className="line">
                                <Input identifiant="name" valeur={name} {...params}>Intitulé *</Input>
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
    status: PropTypes.number.isRequired,
    imageFile: PropTypes.string.isRequired,
}
