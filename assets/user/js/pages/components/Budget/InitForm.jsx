import React, { Component } from 'react';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
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
						toastr.info('Données enregistrées.');
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

		let params = { errors: errors, onChange: this.handleChange };

		return <div className="max-w-screen-md flex flex-col gap-6">
            <div>
                <Alert type="gray" icon="question" title="Configurer le planificateur de budget">
                    Renseignez votre solde initial pour commencer à planifier votre vie financière.
                </Alert>
            </div>
            <form onSubmit={this.handleSubmit} className="bg-white border p-4 rounded-md">
                <Input identifiant="total" valeur={total} {...params}>Solde initial</Input>

                <div className="mt-4">
                    <Button type="blue" isSubmit={true} iconLeft={load ? "chart-3" : ""}>Valider le solde</Button>
                </div>
            </form>
        </div>
    }
}
