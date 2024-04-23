import React, { Component } from 'react';

import axios   from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Inputs from "@commonFunctions/inputs";

import { Input, Radiobox, } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";

const URL_INDEX_ELEMENTS    = "user_budget_categories_index";
const URL_CREATE_ELEMENT    = "intern_api_budget_categories_create";
const URL_UPDATE_ELEMENT    = "intern_api_budget_categories_update";
const TEXT_CREATE           = "Ajouter la catégorie";
const TEXT_UPDATE           = "Enregistrer les modifications";

export function CategoryFormulaire ({ context, element })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}

        type={element ? Formulaire.setValue(element.type) : 0}
        goal={element ? Formulaire.setValue(element.goal) : ""}
        name={element ? Formulaire.setValue(element.name) : ""}
    />

    return <div className="formulaire">{form}</div>;
}

class Form extends Component {
    constructor(props) {
        super(props);

        this.state = {
            type: props.type,
            goal: props.goal,
            name: props.name,
            errors: [],
            loadData: false,
        }
    }

    handleChange = (e) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "goal"){
            value = Inputs.textMoneyMinusInput(value, this.state[name]);
        }

        if(name === "type"){
            if(parseInt(value) === 2){
                this.setState({ goal: this.state.goal ? this.state.goal : "" })
            }
        }

        this.setState({[name]: value})
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { loadData, type, goal, name } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'type',      value: type},
            {type: "text",  id: 'name',      value: name},
        ];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let self = this;

            if(!loadData){
                this.setState({ loadData: true })
                Formulaire.loader(true);

                axios({ method: context === "create" ? "POST" : "PUT", url: url, data: this.state })
                    .then(function (response) {
                        location.href = Routing.generate(URL_INDEX_ELEMENTS, {'h': response.data.id});
                    })
                    .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); self.setState({ loadData: false }) })
                ;
            }
        }
    }

    render () {
        const { context } = this.props;
        const { errors, loadData, type, goal, name } = this.state;

        let typeItems = [
            { value: 0,  label: 'Dépense',   identifiant: 'it-depense' },
            { value: 1,  label: 'Revenu',    identifiant: 'it-revenu' },
            { value: 2,  label: 'Economie',  identifiant: 'it-economie' },
        ]

        let params = { errors: errors, onChange: this.handleChange };
        let paramsInput0 = {...params, ...{ onChange: this.handleChange }}

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Catégorie</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line">
                                <Radiobox items={typeItems} identifiant="type" valeur={type} {...paramsInput0}>Type</Radiobox>
                            </div>

                            <div className="line line-2">
                                <Input identifiant="name" valeur={name} {...paramsInput0}>Intitulé</Input>
                                {parseInt(type) === 2
                                    ? <Input identifiant="goal" valeur={goal} {...paramsInput0}>Objectif</Input>
                                    : <div className="form-group"></div>
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <div className="line-buttons">
                    <Button isSubmit={true} isLoader={loadData} type="primary">{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
                </div>
            </form>
        </>
    }
}
