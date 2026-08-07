import React, { Component } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { Input, Radiobox } from "@tailwindComponents/Elements/Fields";
import { Alert } from "@tailwindComponents/Elements/Alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcnComponents/ui/sheet";

const URL_CREATE_ELEMENT = "intern_api_budget_categories_create";
const URL_UPDATE_ELEMENT = "intern_api_budget_categories_update";

export function CategoryFormulaire ({ context, element, open, onOpenChange, onSaved }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Sheet open={open} onOpenChange={onOpenChange}>
		<SheetContent className="flex flex-col p-0 sm:max-w-lg [&_label]:mb-1.5 [&_label]:mt-0">
			<SheetHeader>
				<SheetTitle>{context === "create" ? "Ajouter une catégorie" : "Modifier la catégorie"}</SheetTitle>
			</SheetHeader>

			<div className="flex-1 overflow-y-auto px-6 py-5">
				<Form
					key={element ? element.id : 0}
					context={context}
					url={url}

					type={element ? Formulaire.setValue(element.type) : 0}
					goal={element ? Formulaire.setValue(element.goal) : ""}
					name={element ? Formulaire.setValue(element.name) : ""}

					onClose={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			</div>
		</SheetContent>
	</Sheet>;
}

class Form extends Component {
	constructor (props) {
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

		if (name === "goal") {
			value = Inputs.textMoneyMinusInput(value, this.state[name]);
		}

		if (name === "type") {
			if (parseInt(value) === 2) {
				this.setState({ goal: this.state.goal ? this.state.goal : "" })
			}
		}

		this.setState({ [name]: value })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { context, url } = this.props;
		const { loadData, type, name, goal } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'type', value: type },
			{ type: "text", id: 'name', value: name },
		];

		if (parseInt(type) === 2 && goal) {
			paramsToValidate.push({ type: "text", id: 'goal', value: goal });
		}

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
						self.props.onSaved(response.data);
						self.props.onClose();
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
		const { context, onClose } = this.props;
		const { errors, loadData, type, goal, name } = this.state;

		let typeItems = [
			{ value: 0, label: 'Dépense', identifiant: 'it-depense' },
			{ value: 1, label: 'Revenu', identifiant: 'it-revenu' },
			{ value: 2, label: 'Économie', identifiant: 'it-economie' },
		]

		let typeDescriptions = [
			"Les catégories de dépenses vous permettent d'organiser vos sorties d'argent (alimentation, loisirs, transports, etc.)",
			"Les catégories de revenus vous aident à suivre vos différentes sources de gains (salaire, primes, revenus complémentaires, etc.)",
			"Les catégories d'économies vous permettent de définir des objectifs d'épargne avec un montant cible à atteindre"
		];

		let params = { errors: errors, onChange: this.handleChange };
		let paramsInput0 = { ...params, ...{ onChange: this.handleChange } }

		return <form onSubmit={this.handleSubmit}>
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-4 bg-muted/40 p-5 rounded-lg border">
					<Radiobox items={typeItems} identifiant="type" valeur={type} {...paramsInput0}
							  classItems="flex flex-wrap gap-2" styleType="fat">
						Type de catégorie
					</Radiobox>

					<Alert type={parseInt(type) === 0 ? "red" : (parseInt(type) === 1 ? "blue" : "yellow")} icon="question">
						<p className="text-sm">{typeDescriptions[parseInt(type)]}</p>
					</Alert>
				</div>

				<div className="flex flex-col gap-4 bg-muted/40 p-5 rounded-lg border">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<Input identifiant="name" valeur={name} {...paramsInput0} placeholder="Ex: Alimentation">
								Nom de la catégorie
							</Input>
						</div>
						{parseInt(type) === 2 && (
							<div>
								<Input identifiant="goal" valeur={goal} {...paramsInput0} placeholder="Ex: 5000.00">
									Objectif (€) <span className="text-gray-500 text-xs">(optionnel)</span>
								</Input>
							</div>
						)}
					</div>

					<div className="p-3 bg-background rounded-lg border text-xs text-muted-foreground space-y-1">
						<p className="font-medium text-foreground mb-1">Exemples de catégories</p>
						{parseInt(type) === 0 && (
							<>
								<p>Alimentation, Restaurants, Courses</p>
								<p>Transports, Essence, Parking</p>
								<p>Loisirs, Sorties, Abonnements</p>
							</>
						)}
						{parseInt(type) === 1 && (
							<>
								<p>Salaire mensuel</p>
								<p>Primes, 13ème mois</p>
								<p>Revenus complémentaires, Freelance</p>
							</>
						)}
						{parseInt(type) === 2 && (
							<>
								<p>Voyage (objectif : 3000€)</p>
								<p>Apport immobilier (objectif : 20000€)</p>
								<p>Fonds d'urgence (objectif : 5000€)</p>
							</>
						)}
					</div>
				</div>
			</div>

			<div className="mt-6 flex justify-end gap-2">
				{context === "update" && <Button type="default" onClick={onClose}>Annuler</Button>}
				<Button type="blue" isSubmit={true} iconLeft={loadData ? "chart-3" : ""}>
					{context === "create" ? "Créer la catégorie" : "Enregistrer les modifications"}
				</Button>
			</div>
		</form>
	}
}
