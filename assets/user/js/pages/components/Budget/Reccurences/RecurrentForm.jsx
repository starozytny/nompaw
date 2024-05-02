import React, { Component } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Alert } from "@tailwindComponents/Elements/Alert";
import { Button } from "@tailwindComponents/Elements/Button";
import { Checkbox, Input, InputView, Radiobox, SelectCustom } from "@tailwindComponents/Elements/Fields";

const URL_INDEX_ELEMENTS = "user_budget_recurrences_index";
const URL_CREATE_ELEMENT = "intern_api_budget_recurrences_create";
const URL_UPDATE_ELEMENT = "intern_api_budget_recurrences_update";
const TEXT_CREATE = "Ajouter la récurrence";
const TEXT_UPDATE = "Enregistrer les modifications";

export function RecurrentFormulaire ({ context, categories, element }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	let today = new Date();

	return <Form
        context={context}
        categories={categories}
        url={url}

        type={element ? Formulaire.setValue(element.type) : 0}
        price={element ? Formulaire.setValue(element.price) : ""}
        name={element ? Formulaire.setValue(element.name) : ""}
        category={element && element.category ? Formulaire.setValue(element.category.id) : ""}
        months={element ? Formulaire.setValue(element.months) : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]}
        initYear={element ? Formulaire.setValue(element.initYear) : today.getFullYear()}
        initMonth={element ? Formulaire.setValue(element.initMonth) : today.getMonth() + 1}
    />
}

class Form extends Component {
	constructor (props) {
		super(props);

		this.state = {
			type: props.type,
			price: props.price,
			name: props.name,
			category: props.category,
			months: props.months,
			initYear: props.initYear,
			initMonth: props.initMonth,
			errors: [],
			loadData: false,
		}

		this.select = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "months") {
			value = Formulaire.updateValueCheckbox(e, this.state[name], parseInt(value));
		}

		if (name === "price") {
			value = Inputs.textMoneyMinusInput(value, this.state[name]);
		}

		if (name === "initYear") {
			value = Inputs.textNumericInput(value, this.state[name]);
		}

		if (name === "type") {
			this.setState({ category: "" })
			this.select.current.handleClose(null, "")
		}

		this.setState({ [name]: value })
	}

	handleSelect = (name, value, displayValue) => {
		this.setState({ [name]: value });
		this.select.current.handleClose(null, displayValue);
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { context, url } = this.props;
		const { loadData, type, price, name, months, initYear, initMonth } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'type', value: type },
			{ type: "text", id: 'price', value: price },
			{ type: "text", id: 'name', value: name },
			{ type: "array", id: 'months', value: months },
			{ type: "text", id: 'initYear', value: initYear },
			{ type: "text", id: 'initMonth', value: initMonth },
		];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let self = this;

			if (!loadData) {
				this.setState({ loadData: true })
				Formulaire.loader(true);

				axios({ method: context === "create" ? "POST" : "PUT", url: url, data: this.state })
					.then(function (response) {
						location.href = Routing.generate(URL_INDEX_ELEMENTS, { 'h': response.data.id });
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
						Formulaire.loader(false);
						self.setState({ loadData: false })
					})
				;
			}
		}
	}

	render () {
        const { context, categories } = this.props;
        const { errors, loadData, type, price, name, category, months, initYear, initMonth } = this.state;

        let monthItems = [
            { value: 1, label: 'Janvier', identifiant: 'Jan.' },
            { value: 2, label: 'Février', identifiant: 'Fev.' },
            { value: 3, label: 'Mars', identifiant: 'Mar.' },
            { value: 4, label: 'Avril', identifiant: 'Avr.' },
            { value: 5, label: 'Mai', identifiant: 'Mai.' },
            { value: 6, label: 'Juin', identifiant: 'Jui.' },
            { value: 7, label: 'Juillet', identifiant: 'Juil' },
            { value: 8, label: 'Août', identifiant: 'Aoû.' },
            { value: 9, label: 'Septembre', identifiant: 'Sep.' },
            { value: 10, label: 'Octobre', identifiant: 'Oct.' },
            { value: 11, label: 'Novembre', identifiant: 'Nov.' },
            { value: 12, label: 'Décembre', identifiant: 'Dèc.' },
        ];

        let monthItems2 = [
            { value: 1, label: 'Janvier', identifiant: '2-Jan.' },
            { value: 2, label: 'Février', identifiant: '2-Fev.' },
            { value: 3, label: 'Mars', identifiant: '2-Mar.' },
            { value: 4, label: 'Avril', identifiant: '2-Avr.' },
            { value: 5, label: 'Mai', identifiant: '2-Mai.' },
            { value: 6, label: 'Juin', identifiant: '2-Jui.' },
            { value: 7, label: 'Juillet', identifiant: '2-Juil' },
            { value: 8, label: 'Août', identifiant: '2-Aoû.' },
            { value: 9, label: 'Septembre', identifiant: '2-Sep.' },
            { value: 10, label: 'Octobre', identifiant: '2-Oct.' },
            { value: 11, label: 'Novembre', identifiant: '2-Nov.' },
            { value: 12, label: 'Décembre', identifiant: '2-Dèc.' },
        ];

        let typeItems = [
            { value: 0, label: 'Dépense', identifiant: 'it-depense' },
            { value: 1, label: 'Revenu', identifiant: 'it-revenu' },
            { value: 2, label: 'Économie', identifiant: 'it-economie' },
        ]

        let typeString = ['Dépense', 'Revenu', 'Économie'];

        let categoryItems = [{ value: "", label: "Aucun", inputName: "", identifiant: "cat-empty" }], categoryName = "";
        categories.forEach(cat => {
            if (cat.type === parseInt(type)) {
                if (cat.id === category) {
                    categoryName = cat.name;
                }
                categoryItems.push({ value: cat.id, label: cat.name, inputName: cat.name, identifiant: "cat-" + cat.id })
            }
        })

        let params = { errors: errors, onChange: this.handleChange };
        let paramsInput0 = { ...params, ...{ onChange: this.handleChange } }
        let paramsInput1 = { ...params, ...{ onClick: this.handleSelect } }

        return <form onSubmit={this.handleSubmit}>
            <div className="flex flex-col gap-4 xl:gap-6">
                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Quel type de récurrence</div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div>
                            {context === "create"
                                ? <Radiobox items={typeItems} identifiant="type" valeur={type} {...paramsInput0}
                                            classItems="flex gap-2" styleType="fat">
                                    Type
                            </Radiobox>
                                : <InputView valeur={typeString[type]} errors={errors}>Type</InputView>
                            }
                        </div>
                        <div className="flex gap-4">
                            <div className="w-full">
                                <Input identifiant="name" valeur={name} {...paramsInput0}>Intitulé</Input>
                            </div>
                            <div className="w-full">
                                <Input identifiant="price" valeur={price} {...paramsInput0}>Prix</Input>
                            </div>
                        </div>

                        <div>
                            <SelectCustom ref={this.select} identifiant="category" inputValue={categoryName}
                                          items={categoryItems} {...paramsInput1}>
                                Catégorie
                            </SelectCustom>
                        </div>

                        <div>
                            {context === "create"
                                ? <Checkbox items={monthItems} identifiant="months" valeur={months} {...paramsInput0}
											classItems="flex flex-wrap gap-2" styleType="fat">
                                    Pour quel(s) mois ?
                                </Checkbox>
                                : <InputView valeur={months.toString()} errors={errors}>Pour quel(s) mois ?</InputView>
                            }
                        </div>
                    </div>
                </div>

                {context === "create" && <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Début de la récurrence</div>
                        <div className="text-gray-600 text-sm">
                            La récurrence débute à quelle année et quel mois.
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-full">
                                <Input identifiant="initYear" valeur={initYear} {...params}>Année</Input>
                            </div>
                            <div className="w-full">
                                <Radiobox items={monthItems2} identifiant="initMonth" valeur={initMonth} {...params}
										  classItems="flex flex-wrap gap-2" styleType="fat">
									Mois
								</Radiobox>
                            </div>
                        </div>
                    </div>
                </div>}

                {context === "update" && <div>
                    <Alert type="red">Les récurrences <b>non activées</b> seront affectées par cette mise à jour.</Alert>
                </div>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <Button type="blue" isSubmit={true}>
                    {context === "create" ? "Enregistrer" : "Enregistrer les modifications"}
                </Button>
            </div>
        </form>
    }
}
