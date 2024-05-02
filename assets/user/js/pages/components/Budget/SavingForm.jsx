import React, { Component } from 'react';

import Inputs from "@commonFunctions/inputs";
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

	handleCloseModal = () => {
		let body = document.querySelector("body");
		let modal = document.getElementById(this.props.identifiant);

		body.style.overflow = "auto";
		modal.style.display = "none";
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
			this.props.onUseSaving(saving, total)
		}
	}

	render () {
		const { identifiant, saving } = this.props;
		const { errors, total } = this.state;

		let params = { errors: errors, onChange: this.handleChange };

		return <>
			<div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-4">
				<p className="mb-4">Combien souhaitez-vous utiliser depuis les économies de : <b>{saving ? saving.name : ""}</b> ?</p>
				<form onSubmit={this.handleSubmit}>
					<Input identifiant="total" valeur={total} {...params}>Solde à utiliser</Input>
				</form>
			</div>
			<div className="bg-gray-50 px-4 py-3 flex flex-row justify-end gap-2 sm:px-6 border-t">
				<CloseModalBtn identifiant={identifiant} />
				<Button type="blue" onClick={this.handleSubmit}>Confirmer</Button>
			</div>
		</>
	}
}
