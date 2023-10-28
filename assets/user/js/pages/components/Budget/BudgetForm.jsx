import React, { Component } from 'react';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import moment from "moment/moment";
import 'moment/locale/fr';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Inputs     from "@commonFunctions/inputs";
import Sort       from "@commonFunctions/sort";

import { Input, Radiobox, Checkbox, InputView, SelectCustom } from "@commonComponents/Elements/Fields";
import { Button }           from "@commonComponents/Elements/Button";

const URL_CREATE_ELEMENT    = "intern_api_budget_items_create";
const URL_UPDATE_ELEMENT    = "intern_api_budget_items_update";

export function BudgetFormulaire ({ context, categories, element, year, month, onCancel, onUpdateList })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'id': element.id});
    }

    let form = <Form
        context={context}
        categories={categories}
        url={url}

        year={element ? Formulaire.setValue(element.year) : year}
        month={element ? Formulaire.setValue(element.month) : month}
        type={element ? Formulaire.setValue(element.type) : 0}
        price={element ? Formulaire.setValue(element.price) : ""}
        name={element ? Formulaire.setValue(element.name) : ""}
        category={element && element.category ? Formulaire.setValue(element.category.id) : ""}
        isActive={element ? Formulaire.setValue(element.isActive) : false}
        dateAt={element ? Formulaire.setValueDate(element.dateAt) : moment(new Date()).format('DD/MM/Y')}
        recurrenceId={element ? Formulaire.setValue(element.recurrenceId) : ""}

        onCancel={onCancel}
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
            category: props.category,
            isActive: props.isActive ? [1] : [0],
            dateAt: props.dateAt,
            errors: [],
            load: false
        }

        this.select = React.createRef();
    }

    componentDidMount = () => { Inputs.initDateInput(this.handleChangeDate, this.handleChange, "") }

    handleChange = (e, picker) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "isActive"){
            value = (e.currentTarget.checked) ? [1] : [0];
        }

        if(name === "price"){
            value = Inputs.textMoneyMinusInput(value, this.state.price);
        }

        if(name === "dateAt"){
            value = Inputs.dateInput(e, picker, this.state[name]);
        }

        if(name === "type"){
            this.setState({ category: "" })
            this.select.current.handleClose(null, "")
        }

        this.setState({[name]: value})
    }

    handleChangeDate = (name, value) => { this.setState({ [name]: value }) }

    handleSelect = (name, value, displayValue) => {
        this.setState({ [name]: value });
        this.select.current.handleClose(null, displayValue);
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { load, type, price, name, dateAt, category } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'type',   value: type},
            {type: "text",  id: 'price',  value: price},
            {type: "text",  id: 'name',   value: name},
            {type: "text",  id: 'dateAt', value: dateAt},
            {type: "date",  id: 'dateAt', value: dateAt},
        ];

        if(parseInt(type) === 2){
            paramsToValidate = [...paramsToValidate, ...[{type: "text",  id: 'category', value: category},]]
        }

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
        const { context, categories, onCancel, recurrenceId } = this.props;
        const { errors, load, type, price, name, category, isActive, dateAt } = this.state;

        let typeItems = [
            { value: 0,  label: 'Dépense',   identifiant: 'it-depense' },
            { value: 1,  label: 'Revenu',    identifiant: 'it-revenu' },
            { value: 2,  label: 'Economie',  identifiant: 'it-economie' },
        ]

        let typeString = ["Dépense", "Revenu", "Economie"];

        let activeItems = [ { value: 1, label: 'Oui', identifiant: 'oui-1' } ]

        categories.sort(Sort.compareName);
        let categoryItems = [{ value: "", label: "Aucun", inputName: "", identifiant: "cat-empty"}], categoryName = "";
        categories.forEach(cat => {
            if(cat.type === parseInt(type)){
                if(cat.id === category){
                    categoryName = cat.name;
                }
                categoryItems.push({ value: cat.id, label: cat.name, inputName: cat.name, identifiant: "cat-" + cat.id})
            }
        })

        let params = { errors: errors, onChange: this.handleChange };
        let paramsInput0 = {...params, ...{ onChange: this.handleChange }}
        let paramsInput1 = {...params, ...{ onClick: this.handleSelect }}

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line line-2 line-real">
                    {recurrenceId ? <>
                            <InputView valeur={typeString[type]} errors={errors}>Type</InputView>
                            <InputView valeur="Actif" errors={isActive}>Actif</InputView>
                        </>
                        : <>
                            <Radiobox items={typeItems} identifiant="type" valeur={type} {...paramsInput0}>Type</Radiobox>
                            <Checkbox isSwitcher={true} items={activeItems} identifiant="isActive" valeur={isActive} {...paramsInput0}>
                                Réel ?
                            </Checkbox>
                        </>
                    }

                </div>
                <div className="line line-2">
                    <Input identifiant="name" valeur={name} {...paramsInput0}>Intitulé</Input>
                    <Input identifiant="price" valeur={price} {...paramsInput0}>Prix</Input>
                </div>
                <div className="line">
                    <Input type="js-date" identifiant="dateAt" valeur={dateAt} {...paramsInput0}>Date</Input>
                </div>
                <div className="line">
                    <SelectCustom ref={this.select} identifiant="category" inputValue={categoryName}
                                  items={categoryItems} {...paramsInput1}>
                        Catégorie
                    </SelectCustom>
                </div>

                <div className="line-buttons">
                    <Button isSubmit={true} isLoader={load} type="primary">Enregistrer</Button>
                    {context === "update" && <Button onClick={onCancel}>Annuler</Button>}
                </div>
            </form>
        </>
    }
}
