import React, { Component } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Input } from "@tailwindComponents/Elements/Fields";
import { Alert } from "@tailwindComponents/Elements/Alert";
import { Button } from "@tailwindComponents/Elements/Button";

const URL_INIT_BUDGET = "intern_api_budget_init_create";

export class InitForm extends Component {
	constructor (props) {
		super(props);

		this.state = {
			total: '',
			errors: [],
			load: false
		}
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "total") {
			value = Inputs.textMoneyMinusInput(value, this.state.total);
		}

		this.setState({ [name]: value })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { load, total } = this.state;

		this.setState({ errors: [] });

		let validate = Validateur.validateur([{ type: "text", id: 'total', value: total }])
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			if (!load) {
				this.setState({ load: true })
				Formulaire.loader(true);

				let self = this;
				axios({ method: "PUT", url: Routing.generate(URL_INIT_BUDGET), data: this.state })
					.then(function (response) {
						Toastr.toast('info', 'Données enregistrées.');
						location.reload();
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
						Formulaire.loader(false);
					})
					.then(function () {
						self.setState({ load: false })
					})
				;
			}
		}
	}

	render () {
		const { errors, load, total } = this.state;

		let params0 = { errors: errors, onChange: this.handleChange };

		return <div className="bg-white rounded-xl shadow py-24 flex items-center justify-center p-4">
			<div className="max-w-2xl w-full space-y-6">
				<div className="text-center">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full mb-4">
						<span className="icon-calculator text-3xl"></span>
					</div>
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Bienvenue dans votre planificateur budget
					</h1>
					<p className="text-gray-600">
						Commencez par renseigner votre solde initial pour démarrer
					</p>
				</div>

				<div className="bg-white border rounded-xl shadow-lg overflow-hidden">
					<div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600">
						<h2 className="text-xl font-semibold text-white flex items-center gap-2">
							<span className="icon-settings"></span>
							Configuration initiale
						</h2>
					</div>

					<div className="p-6 space-y-6">
						<Alert type="blue" icon="info">
							<div className="space-y-2">
								<p className="font-medium">Qu'est-ce que le solde initial ?</p>
								<p className="text-sm">
									Le solde initial correspond au montant disponible sur votre compte bancaire au moment où vous commencez à utiliser le planificateur.
									Ce montant servira de base pour calculer votre budget disponible chaque mois.
								</p>
							</div>
						</Alert>

						<form onSubmit={this.handleSubmit} className="space-y-6">
							<div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
								<Input identifiant="total" valeur={total}{...params0} placeholder="Ex: 1500.00">
									<div className="flex items-center gap-2">
										<span className="icon-wallet"></span>
										Solde initial (€)
									</div>
								</Input>

								{total && (
									<div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-700">Votre solde de départ :</span>
											<span className="text-2xl font-bold text-blue-600">
												{parseFloat(total).toLocaleString('fr-FR', {
													style: 'currency',
													currency: 'EUR'
												})}
											</span>
										</div>
									</div>
								)}
							</div>

							<Alert type="gray" icon="list">
								<div className="space-y-2">
									<p className="font-medium text-sm">Catégories créées automatiquement :</p>
									<div className="grid grid-cols-2 gap-2 text-xs">
										<div className="flex items-center gap-1">
											<span className="icon-minus text-red-500"></span>
											<span>Dépenses personnelles</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="icon-minus text-red-500"></span>
											<span>Alimentation</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="icon-minus text-red-500"></span>
											<span>Habitation</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="icon-add text-blue-500"></span>
											<span>Salaire</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="icon-time text-yellow-500"></span>
											<span>Voyage (objectif 15 000€)</span>
										</div>
									</div>
									<p className="text-xs text-gray-600 mt-2">
										Vous pourrez modifier ces catégories et en ajouter d'autres ensuite.
									</p>
								</div>
							</Alert>

							<div className="pt-4">
								<Button
									type="blue"
									isSubmit={true}
									iconLeft={load ? "chart-3" : "check1"}
									width="w-full"
									pa="py-6"
								>
									{load ? "Configuration en cours..." : "Démarrer mon planificateur"}
								</Button>
							</div>
						</form>
					</div>
				</div>
			</div>
		</div>
	}
}
