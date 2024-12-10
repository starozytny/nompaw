import React, { Component } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import moment from "moment/moment";
import 'moment/locale/fr';

import Sort from "@commonFunctions/sort";
import Inputs from "@commonFunctions/inputs";
import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { Input, Radiobox, InputView, SelectCustom, Switcher } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_ELEMENT = "intern_api_budget_items_create";
const URL_UPDATE_ELEMENT = "intern_api_budget_items_update";

export function BudgetFormulaire ({ context, categories, element, year, month, onCancel, onUpdateList }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Form
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
		dateAt={element ? Formulaire.setValueDate(element.dateAt) : moment(new Date()).format('YYYY-MM-DD')}
		dateTime={element ? Formulaire.setValueTime(element.dateAt) : ""}
		recurrenceId={element ? Formulaire.setValue(element.recurrenceId) : ""}

		onCancel={onCancel}
		onUpdateList={onUpdateList}
	/>
}

class Form extends Component {
	constructor (props) {
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
			dateTime: props.dateTime,
			errors: [],
			load: false
		}

		this.select = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "isActive") {
			value = (e.currentTarget.checked) ? [1] : [0];
		}

		if (name === "price") {
			value = Inputs.textMoneyMinusInput(value, this.state.price);
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
		const { load, type, price, name, dateAt, dateTime, category } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'type', value: type },
			{ type: "text", id: 'price', value: price },
			{ type: "text", id: 'name', value: name },
			{ type: "text", id: 'dateAt', value: dateAt },
			{ type: "date", id: 'dateAt', value: dateAt },
		];

		if (parseInt(type) === 2) {
			paramsToValidate = [...paramsToValidate, ...[{ type: "text", id: 'category', value: category },]]
		}

		if(dateTime !== ""){
			paramsToValidate = [...paramsToValidate, ...[{ type: "time", id: 'dateTime', value: dateTime }]]
		}

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			if (!load) {
				this.setState({ load: true })
				Formulaire.loader(true);

				let self = this;
				axios({ method: context === "create" ? "POST" : "PUT", url: url, data: this.state })
					.then(function (response) {
						Toastr.toast('info', 'Données enregistrées.');
						self.setState({ price: "", name: "" })

						self.props.onUpdateList(response.data, context);
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
					})
					.then(function () {
						Formulaire.loader(false);
						self.setState({ load: false })
					})
				;
			}
		}
	}

	render () {
		const { context, categories, onCancel, recurrenceId } = this.props;
		const { errors, load, type, price, name, category, isActive, dateAt, dateTime } = this.state;

		let typeItems = [
			{ value: 0, label: 'Dépense', identifiant: 'it-depense' },
			{ value: 1, label: 'Revenu', identifiant: 'it-revenu' },
			{ value: 2, label: 'Économie', identifiant: 'it-economie' },
		]

		let typeString = ["Dépense", "Revenu", "Économie"];

		let activeItems = [{ value: 1, label: 'Oui', identifiant: 'oui-1' }]

		categories.sort(Sort.compareName);
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

		return <div>
			<div className="flex flex-col gap-4">
				<div className="flex gap-4">
					<div className="w-full">
						{recurrenceId
							? <InputView valeur={typeString[type]} errors={errors}>Type</InputView>
							: <Radiobox items={typeItems} identifiant="type" valeur={type} {...paramsInput0}
										classItems="flex flex-wrap gap-2" styleType="fat">
								Type
							</Radiobox>
						}
					</div>
					<div className="w-full max-w-20">
						<Switcher valeur={isActive} identifiant="isActive" items={activeItems} {...paramsInput0}>
							Réel ?
						</Switcher>
					</div>
				</div>

				<div className="flex gap-4">
					<div className="w-full">
						<Input identifiant="name" valeur={name} {...paramsInput0}>Intitulé</Input>
					</div>
					<div className="w-full">
						<Input identifiant="price" valeur={price} {...paramsInput0}>Prix</Input>
					</div>
				</div>

				<div className="flex gap-4">
					<div className="w-full">
						<Input type="date" identifiant="dateAt" valeur={dateAt} {...paramsInput0}>Date</Input>
					</div>
					<div className="w-full">
						<SelectCustom ref={this.select} identifiant="category" inputValue={categoryName}
									  items={categoryItems} {...paramsInput1}>
							Catégorie
						</SelectCustom>
					</div>
				</div>

				<div className="flex gap-4">
					<div className="w-full">
						<Input type="time" identifiant="dateTime" valeur={dateTime} {...params}>Heure</Input>
					</div>
					<div className="w-full"></div>
				</div>
			</div>

			<div className="mt-4 flex justify-end gap-2">
				{context === "update" && <Button type="default" onClick={onCancel}>Annuler</Button>}
				<Button type="blue" isSubmit={true} iconLeft={load ? "chart-3" : ""}
						onClick={this.handleSubmit} width="w-full">Enregistrer</Button>
			</div>
		</div>
	}
}
