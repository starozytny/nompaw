import React, { Component } from 'react';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import moment from "moment/moment";
import 'moment/locale/fr';

import { Input, Radiobox, Checkbox } from "@commonComponents/Elements/Fields";
import { Button }           from "@commonComponents/Elements/Button";

import Formulaire           from "@commonFunctions/formulaire";
import Validateur           from "@commonFunctions/validateur";
import Inputs               from "@commonFunctions/inputs";

const URL_CREATE_ELEMENT    = "intern_api_budget_items_create";
const URL_UPDATE_ELEMENT    = "intern_api_budget_items_update";

export function BudgetFormulaire ({ context, element, year, month, onUpdateList })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}
        year={element ? Formulaire.setValue(element.year) : year}
        month={element ? Formulaire.setValue(element.month) : month}
        type={element ? Formulaire.setValue(element.type) : 0}
        price={element ? Formulaire.setValue(element.price) : ""}
        name={element ? Formulaire.setValue(element.name) : ""}
        isActive={element ? Formulaire.setValue(element.isActive) : false}
        dateAt={element ? Formulaire.setValue(element.dateAt) : moment(new Date()).format('DD/MM/Y')}

        onUpdateList={onUpdateList}
    />

    return <div className="formulaire">{form}</div>;
}

class Form extends Component {
    constructor(props) {
        super(props);

        this.state = {
            year: props.year,
            month: props.month,
            type: props.type,
            price: props.price,
            name: props.name,
            isActive: props.isActive ? [1] : [0],
            dateAt: props.dateAt,
            errors: [],
            load: false
        }
    }

    componentDidMount = () => { Inputs.initDateInput(this.handleChangeDate, this.handleChange, "") }

    handleChange = (e, picker) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "isActive"){
            value = (e.currentTarget.checked) ? [1] : [0];
        }

        if(name === "price"){
            value = Inputs.textNumericWithMinusInput(value, this.state.price);
        }

        if(name === "dateAt"){
            value = Inputs.dateInput(e, picker, this.state[name]);
        }

        this.setState({[name]: value})
    }

    handleChangeDate = (name, value) => { this.setState({ [name]: value }) }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { load, type, price, name, dateAt } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'type',   value: type},
            {type: "text",  id: 'price',  value: price},
            {type: "text",  id: 'name',   value: name},
            {type: "text",  id: 'dateAt', value: dateAt},
            {type: "date",  id: 'dateAt', value: dateAt},
        ];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            if(!load){
                this.setState({ load: true })
                Formulaire.loader(true);

                let self = this;
                axios({ method: context === "create" ? "POST" : "PUT", url: url, data: this.state })
                    .then(function (response) {
                        toastr.info('Données enregistrées.');
                        self.setState({ price: "", name: "" })

                        self.props.onUpdateList(response.data, context);
                    })
                    .catch(function (error) { Formulaire.displayErrors(self, error); })
                    .then(function () { Formulaire.loader(false); self.setState({ load: false }) })
                ;
            }
        }
    }

    render () {
        const { errors, load, type, price, name, isActive, dateAt } = this.state;

        let typeItems = [
            { value: 0,  label: 'Dépense',   identifiant: 'it-depense' },
            { value: 1,  label: 'Revenu',    identifiant: 'it-revenu' },
            { value: 2,  label: 'Economie',  identifiant: 'it-economie' },
        ]

        let activeItems = [ { value: 1, label: 'Oui', identifiant: 'oui-1' } ]

        let params  = { errors: errors, onChange: this.handleChange };

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line line-2">
                    <Radiobox items={typeItems} identifiant="type" valeur={type} {...params}>Type</Radiobox>
                    <Checkbox isSwitcher={true} items={activeItems} identifiant="isActive" valeur={isActive} {...params}>
                        Réel ?
                    </Checkbox>
                </div>
                <div className="line line-2">
                    <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
                    <Input identifiant="price" valeur={price} {...params}>Prix</Input>
                </div>
                <div className="line">
                    <Input type="js-date" identifiant="dateAt" valeur={dateAt} {...params}>Date</Input>
                </div>

                <div className="line-buttons">
                    <Button isSubmit={true} isLoader={load} type="primary">Enregistrer</Button>
                </div>
            </form>
        </>
    }
}
