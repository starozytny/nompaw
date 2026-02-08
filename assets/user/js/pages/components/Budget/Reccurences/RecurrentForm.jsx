import React, { Component } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Alert } from "@tailwindComponents/Elements/Alert";
import { Button } from "@tailwindComponents/Elements/Button";
import { Checkbox, Input, InputView, Radiobox, SelectCombobox } from "@tailwindComponents/Elements/Fields";

const URL_INDEX_ELEMENTS = "user_budget_recurrences_index";
const URL_CREATE_ELEMENT = "intern_api_budget_recurrences_create";
const URL_UPDATE_ELEMENT = "intern_api_budget_recurrences_update";

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
		}

		this.setState({ [name]: value })
	}

	handleSelect = (name, value) => {
		this.setState({ [name]: value });
	}

	handleSelectAllMonths = () => {
		this.setState({ months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] });
	}

	handleDeselectAllMonths = () => {
		this.setState({ months: [] });
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
						location.href = Routing.generate(URL_INDEX_ELEMENTS, { h: response.data.id });
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
			{ value: 12, label: 'Décembre', identifiant: 'Déc.' },
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
			{ value: 12, label: 'Décembre', identifiant: '2-Déc.' },
		];

		let typeItems = [
			{ value: 0, label: 'Dépense', identifiant: 'it-depense' },
			{ value: 1, label: 'Revenu', identifiant: 'it-revenu' },
			{ value: 2, label: 'Économie', identifiant: 'it-economie' },
		]

		let typeString = ['Dépense', 'Revenu', 'Économie'];

		let categoryItems = [{ value: "", label: "Aucun" }];
		categories.forEach(cat => {
			if (cat.type === parseInt(type)) {
				categoryItems.push({ value: cat.id, label: cat.name, })
			}
		})

		let params = { errors: errors, onChange: this.handleChange };
		let paramsInput0 = { ...params, ...{ onChange: this.handleChange } }
		let paramsInput1 = { ...params, ...{ onSelect: this.handleSelect } }

		const allMonthsSelected = months.length === 12;

		return <form onSubmit={this.handleSubmit}>
			<div className="flex flex-col gap-4 xl:gap-6">
				{/* Info récurrence */}
				<Alert type="blue" icon="refresh1">
					<div className="space-y-1">
						<p className="font-medium">Qu'est-ce qu'une récurrence ?</p>
						<p className="text-sm">
							Les récurrences vous permettent de planifier des opérations automatiques qui se répètent chaque mois.
							Par exemple : un loyer, un salaire, un abonnement mensuel.
						</p>
					</div>
				</Alert>

				{/* Type de récurrence */}
				<div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
					<div>
						<div className="font-medium text-lg">Type de récurrence</div>
						<p className="text-sm text-gray-600 mt-1">
							Définissez le type d'opération récurrente
						</p>
					</div>
					<div className="flex flex-col gap-4 bg-white p-6 rounded-lg ring-1 ring-inset ring-gray-200 shadow-sm xl:col-span-2">
						<div>
							{context === "create"
								? <Radiobox items={typeItems} identifiant="type" valeur={type} {...paramsInput0}
											classItems="flex gap-2" styleType="fat">
									Type
								</Radiobox>
								: <InputView valeur={typeString[type]} errors={errors}>Type</InputView>
							}
						</div>
						<div className="flex flex-col sm:flex-row gap-4">
							<div className="w-full">
								<Input identifiant="name" valeur={name} {...paramsInput0} placeholder="Ex: Loyer mensuel">
									Intitulé
								</Input>
							</div>
							<div className="w-full">
								<Input identifiant="price" valeur={price} {...paramsInput0} placeholder="Ex: 850.00">
									Montant (€)
								</Input>
							</div>
						</div>

						<div>
							<SelectCombobox identifiant="category" valeur={category} items={categoryItems}
											{...paramsInput1} toSort={true}>
								Catégorie <span className="text-gray-500 text-xs">(optionnel)</span>
							</SelectCombobox>
						</div>
					</div>
				</div>

				{/* Mois de récurrence */}
				<div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
					<div>
						<div className="font-medium text-lg">Périodicité</div>
						<p className="text-sm text-gray-600 mt-1">
							Sélectionnez les mois où cette opération se répète
						</p>
					</div>
					<div className="bg-white p-6 rounded-lg ring-1 ring-inset ring-gray-200 shadow-sm xl:col-span-2">
						{context === "create"
							? <div className="space-y-4">
								<div className="flex items-center justify-between">
									<label className="block text-sm font-medium text-gray-900">
										Mois concernés ({months.length}/12)
									</label>
									<div className="flex gap-2">
										<button
											type="button"
											onClick={this.handleSelectAllMonths}
											className="text-xs px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-md transition-colors"
											disabled={allMonthsSelected}
										>
											Tous
										</button>
										<button
											type="button"
											onClick={this.handleDeselectAllMonths}
											className="text-xs px-3 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
											disabled={months.length === 0}
										>
											Aucun
										</button>
									</div>
								</div>

								<Checkbox items={monthItems} identifiant="months" valeur={months} {...paramsInput0}
										  classItems="flex flex-wrap gap-2" styleType="fat">
								</Checkbox>

								{months.length === 0 && (
									<Alert type="red" icon="warning">
										Vous devez sélectionner au moins un mois
									</Alert>
								)}
							</div>
							: <InputView valeur={months.toString()} errors={errors}>Pour quel(s) mois ?</InputView>
						}
					</div>
				</div>

				{/* Début de la récurrence */}
				{context === "create" && (
					<div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
						<div>
							<div className="font-medium text-lg">Date de démarrage</div>
							<p className="text-sm text-gray-600 mt-1">
								Indiquez à partir de quand cette récurrence commence
							</p>
						</div>
						<div className="bg-white p-6 rounded-lg ring-1 ring-inset ring-gray-200 shadow-sm xl:col-span-2">
							<div className="space-y-4">
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div className="w-full">
										<Input identifiant="initYear" valeur={initYear} {...params} placeholder="2025">
											Année de démarrage
										</Input>
									</div>
									<div className="w-full">
										<Radiobox items={monthItems2} identifiant="initMonth" valeur={initMonth} {...params}
												  classItems="flex flex-wrap gap-2" styleType="fat">
											Mois de démarrage
										</Radiobox>
									</div>
								</div>

								<Alert type="gray" icon="calendar">
									<p className="text-sm">
										Cette récurrence débutera en <strong>{monthItems2.find(m => m.value === initMonth)?.label} {initYear}</strong>.
										Elle s'appliquera automatiquement chaque mois pour les mois sélectionnés ci-dessus.
									</p>
								</Alert>
							</div>
						</div>
					</div>
				)}

				{/* Avertissement modification */}
				{context === "update" && (
					<Alert type="orange" icon="warning">
						<div className="space-y-1">
							<p className="font-medium">Important</p>
							<p className="text-sm">
								Les récurrences <strong>non activées</strong> seront affectées par cette mise à jour.
								Les récurrences déjà activées ne seront pas modifiées.
							</p>
						</div>
					</Alert>
				)}
			</div>

			<div className="mt-6 flex justify-end gap-2">
				<Button type="blue" isSubmit={true} iconLeft={loadData ? "chart-3" : ""}>
					{context === "create" ? "Créer la récurrence" : "Enregistrer les modifications"}
				</Button>
			</div>
		</form>
	}
}
