import React, { Component } from 'react';

import Inputs from "@commonFunctions/inputs";
import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";
import { CloseModalBtn } from "@tailwindComponents/Elements/Modal";

export class SavingForm extends Component {
	constructor (props) {
		super(props);

		this.state = {
			total: '',
			errors: [],
		}
	}

	componentDidMount = () => {
		if (!!this.props.saving) {
			let body = document.querySelector("body");
			let modal = document.getElementById(this.props.identifiant);
			let btns = document.querySelectorAll(".close-modal");

			btns.forEach(btn => {
				btn.addEventListener('click', () => {
					body.style.overflow = "auto";
					modal.style.display = "none";
				})
			})
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

		const { saving } = this.props;
		const { total } = this.state;

		this.setState({ errors: [] });

		let validate = Validateur.validateur([{ type: "text", id: 'total', value: total }])
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			const available = saving.total - saving.used;
			if (parseFloat(total) > available) {
				Formulaire.showErrors(this, {
					code: false,
					errors: [{ name: "total", message: `Le montant ne peut pas dépasser ${Sanitaze.toFormatCurrency(available)}` }]
				});
				return;
			}

			this.props.onUseSaving(saving, total)
		}
	}

	render () {
		const { identifiant, saving } = this.props;
		const { errors, total } = this.state;

		if (!saving) return null;

		let params0 = { errors: errors, onChange: this.handleChange };

		const available = saving.total - saving.used;

		return <>
			<div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-4">
				{/* Info économie */}
				<div className="mb-6 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
					<div className="flex items-start justify-between">
						<div>
							<h4 className="font-semibold text-gray-900 mb-1">{saving.name}</h4>
							<p className="text-sm text-gray-600">Objectif : {Sanitaze.toFormatCurrency(saving.goal)}</p>
						</div>
						<div className="text-right">
							<div className="text-2xl font-bold text-yellow-700">
								{Sanitaze.toFormatCurrency(available)}
							</div>
							<div className="text-xs text-gray-600">disponible</div>
						</div>
					</div>
				</div>

				<form onSubmit={this.handleSubmit}>
					<p className="text-sm text-gray-600 mb-4">
						Combien souhaitez-vous utiliser de cette économie : <b>{saving ? saving.name : ""}</b> ?
					</p>

					<Input identifiant="total" valeur={total} {...params0} placeholder={`max : ${Sanitaze.toFormatCurrency(available)}`}>
						Solde à utiliser (€)
					</Input>

					<div className="mt-3 flex flex-wrap gap-2">
						<button
							type="button"
							className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
							onClick={() => this.setState({ total: (available * 0.25).toFixed(2) })}
						>
							25%
						</button>
						<button
							type="button"
							className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
							onClick={() => this.setState({ total: (available * 0.5).toFixed(2) })}
						>
							50%
						</button>
						<button
							type="button"
							className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
							onClick={() => this.setState({ total: (available * 0.75).toFixed(2) })}
						>
							75%
						</button>
						<button
							type="button"
							className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
							onClick={() => this.setState({ total: available.toFixed(2) })}
						>
							Tout
						</button>
					</div>
				</form>
			</div>
			<div className="bg-gray-50 px-4 py-3 flex flex-row justify-end gap-2 sm:px-6 border-t">
				<CloseModalBtn identifiant={identifiant} />
				<Button type="blue" onClick={this.handleSubmit}>Confirmer l'utilisation</Button>
			</div>
		</>
	}
}
