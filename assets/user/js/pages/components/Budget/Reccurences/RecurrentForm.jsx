import React, { Component } from 'react';

import axios   from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Checkbox, Input, Radiobox } from "@commonComponents/Elements/Fields";
import { Button } from "@commonComponents/Elements/Button";

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Inputs from "@commonFunctions/inputs";

const URL_INDEX_ELEMENTS    = "user_budget_recurrences_index";
const URL_CREATE_ELEMENT    = "intern_api_recurrences_create";
const URL_UPDATE_ELEMENT    = "intern_api_recurrences_update";
const TEXT_CREATE           = "Ajouter la récurrence";
const TEXT_UPDATE           = "Enregistrer les modifications";

export function RecurrentFormulaire ({ context, element })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}
        type={element ? Formulaire.setValue(element.type) : 0}
        price={element ? Formulaire.setValue(element.price) : ""}
        name={element ? Formulaire.setValue(element.name) : ""}
        months={element ? Formulaire.setValue(element.months) : [1,2,3,4,5,6,7,8,9,10,11,12]}
    />

    return <div className="formulaire">{form}</div>;
}

class Form extends Component {
    constructor(props) {
        super(props);

        this.state = {
            type: props.type,
            price: props.price,
            name: props.name,
            months: props.months,
            errors: [],
            loadData: false,
        }
    }

    handleChange = (e) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "months"){
            value = Formulaire.updateValueCheckbox(e, this.state[name], parseInt(value));
        }

        if(name === "price"){
            value = Inputs.textMoneyMinusInput(value, this.state.price);
        }

        this.setState({[name]: value})
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { loadData, type, price, name, months } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'type',    value: type},
            {type: "text",  id: 'price',   value: price},
            {type: "text",  id: 'name',    value: name},
            {type: "array",  id: 'months', value: months},
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
                    .catch(function (error) { Formulaire.displayErrors(self, error); })
                    .then(function () { Formulaire.loader(false); self.setState({ loadData: false }) })
                ;
            }
        }
    }

    render () {
        const { context } = this.props;
        const { errors, loadData, type, price, name, months } = this.state;

        let monthItems = [
            { value: 1, label: 'Janvier',        identifiant: 'Jan.' },
            { value: 2, label: 'Février',        identifiant: 'Fev.' },
            { value: 3, label: 'Mars',           identifiant: 'Mar.' },
            { value: 4, label: 'Avril',          identifiant: 'Avr.' },
            { value: 5, label: 'Mai',            identifiant: 'Mai.' },
            { value: 6, label: 'Juin',           identifiant: 'Jui.' },
            { value: 7, label: 'Juillet',        identifiant: 'Juil' },
            { value: 8, label: 'Août',           identifiant: 'Aoû.' },
            { value: 9, label: 'Septembre',      identifiant: 'Sep.' },
            { value: 10, label: 'Octobre',       identifiant: 'Oct.' },
            { value: 11, label: 'Novembre',      identifiant: 'Nov.' },
            { value: 12, label: 'Décembre',      identifiant: 'Dèc.' },
        ];

        let typeItems = [
            { value: 0,  label: 'Dépense',   identifiant: 'it-depense' },
            { value: 1,  label: 'Revenu',    identifiant: 'it-revenu' },
            { value: 2,  label: 'Economie',  identifiant: 'it-economie' },
        ]

        let params = { errors: errors, onChange: this.handleChange }

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Identifiants</div>
                            <div className="subtitle">Les deux informations peuvent être utilisées pour se connecter.</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line">
                                <Radiobox items={typeItems} identifiant="type" valeur={type} {...params}>Type</Radiobox>
                            </div>

                            <div className="line line-2">
                                <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
                                <Input identifiant="price" valeur={price} {...params}>Prix</Input>
                            </div>
                            <div className="line">
                                <Checkbox items={monthItems} identifiant="months" valeur={months} {...params}>
                                    Mois
                                </Checkbox>
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
