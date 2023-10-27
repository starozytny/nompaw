import React, { Component } from 'react';

import axios   from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import {Checkbox, Input, InputView, Radiobox} from "@commonComponents/Elements/Fields";
import { Button } from "@commonComponents/Elements/Button";

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Inputs from "@commonFunctions/inputs";
import {Alert} from "@commonComponents/Elements/Alert";

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

    let today = new Date();

    let form = <Form
        context={context}
        url={url}
        type={element ? Formulaire.setValue(element.type) : 0}
        price={element ? Formulaire.setValue(element.price) : ""}
        name={element ? Formulaire.setValue(element.name) : ""}
        months={element ? Formulaire.setValue(element.months) : [1,2,3,4,5,6,7,8,9,10,11,12]}
        initYear={element ? Formulaire.setValue(element.initYear) : today.getFullYear()}
        initMonth={element ? Formulaire.setValue(element.initMonth) : today.getMonth() + 1}
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
            initYear: props.initYear,
            initMonth: props.initMonth,
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
            value = Inputs.textMoneyMinusInput(value, this.state[name]);
        }

        if(name === "initYear"){
            value = Inputs.textNumericInput(value, this.state[name]);
        }

        this.setState({[name]: value})
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { loadData, type, price, name, months, initYear, initMonth } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'type',      value: type},
            {type: "text",  id: 'price',     value: price},
            {type: "text",  id: 'name',      value: name},
            {type: "array", id: 'months',    value: months},
            {type: "text",  id: 'initYear',  value: initYear},
            {type: "text",  id: 'initMonth', value: initMonth},
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
        const { errors, loadData, type, price, name, months, initYear, initMonth } = this.state;

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

        let monthItems2 = [
            { value: 1, label: 'Janvier',        identifiant: '2-Jan.' },
            { value: 2, label: 'Février',        identifiant: '2-Fev.' },
            { value: 3, label: 'Mars',           identifiant: '2-Mar.' },
            { value: 4, label: 'Avril',          identifiant: '2-Avr.' },
            { value: 5, label: 'Mai',            identifiant: '2-Mai.' },
            { value: 6, label: 'Juin',           identifiant: '2-Jui.' },
            { value: 7, label: 'Juillet',        identifiant: '2-Juil' },
            { value: 8, label: 'Août',           identifiant: '2-Aoû.' },
            { value: 9, label: 'Septembre',      identifiant: '2-Sep.' },
            { value: 10, label: 'Octobre',       identifiant: '2-Oct.' },
            { value: 11, label: 'Novembre',      identifiant: '2-Nov.' },
            { value: 12, label: 'Décembre',      identifiant: '2-Dèc.' },
        ];

        let typeItems = [
            { value: 0,  label: 'Dépense',   identifiant: 'it-depense' },
            { value: 1,  label: 'Revenu',    identifiant: 'it-revenu' },
            { value: 2,  label: 'Economie',  identifiant: 'it-economie' },
        ]

        let typeString = ['Dépense', 'Revenu', 'Economie'];

        let params = { errors: errors, onChange: this.handleChange }

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Quel type de récurrence</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line">
                                {context === "create" ? <>
                                        <Radiobox items={typeItems} identifiant="type" valeur={type} {...params}>Type</Radiobox>
                                    </>
                                    : <>
                                        <InputView valeur={typeString[type]} errors={errors}>Type</InputView>
                                    </>
                                }
                            </div>

                            <div className="line line-2">
                                <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
                                <Input identifiant="price" valeur={price} {...params}>Prix</Input>
                            </div>

                            <div className="line">
                                <Checkbox items={monthItems} identifiant="months" valeur={months} {...params}>
                                    Pour quel(s) mois ?
                                </Checkbox>
                            </div>
                        </div>
                    </div>

                    {context === "create" && <div className="line">
                        <div className="line-col-1">
                            <div className="title">Début de la récurrence</div>
                            <div className="subtitle">La récurrence débute à quelle année et quel mois ?</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-2">
                                <Input identifiant="initYear" valeur={initYear} {...params}>Année</Input>
                                <Radiobox items={monthItems2} identifiant="initMonth" valeur={initMonth} {...params}>Mois</Radiobox>
                            </div>

                        </div>
                    </div>}

                    {context === "update" && <div className="line">
                        <Alert type="danger">Les récurrences <b>non activées</b> seront affectées par cette mise à jour.</Alert>
                    </div>}
                </div>

                <div className="line-buttons">
                    <Button isSubmit={true} isLoader={loadData} type="primary">{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
                </div>
            </form>
        </>
    }
}
