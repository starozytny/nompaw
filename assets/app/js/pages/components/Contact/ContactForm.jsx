import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { Alert } from "@tailwindComponents/Elements/Alert";
import { Input, TextArea } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_ELEMENT = "intern_api_contacts_create";

export function ContactFormulaire () {
	return <Form
		url={Routing.generate(URL_CREATE_ELEMENT)}
	/>
}

class Form extends Component {
	constructor (props) {
		super(props);

		this.state = {
			name: "",
			email: "",
			message: "",
			critere: "",
			errors: [],
			messageAxios: null,
		}
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { url } = this.props;
		const { name, email, message, critere } = this.state;

		if (critere !== "") {
			toastr.error("Veuillez rafraichir la page.")
		} else {
			this.setState({ errors: [], messageAxios: null });

			let paramsToValidate = [
				{ type: "text", id: 'name', value: name },
				{ type: "email", id: 'email', value: email },
				{ type: "text", id: 'message', value: message },
			];

			let validate = Validateur.validateur(paramsToValidate)
			if (!validate.code) {
				Formulaire.showErrors(this, validate);
			} else {
				Formulaire.loader(true);
				let self = this;

				axios({ method: "POST", url: url, data: this.state })
					.then(function (response) {
						self.setState({ name: "", email: "", message: "", messageAxios: { status: "blue", msg: "Message envoyé." } })
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
					})
					.then(function () {
						Formulaire.loader(false);
					})
				;
			}
		}
	}

	render () {
		const { errors, messageAxios, name, email, message, critere } = this.state;

		let params0 = { errors: errors, onChange: this.handleChange }

		return <form onSubmit={this.handleSubmit}>
			<div className="flex flex-col gap-4">
				{messageAxios && <div><Alert type={messageAxios.status} icon="check1">{messageAxios.msg}</Alert></div>}

				<div className="flex gap-2">
					<div className="w-full">
						<Input identifiant="name" valeur={name} {...params0}>Nom/Prénom</Input>
					</div>
					<div className="w-full">
						<Input identifiant="email" valeur={email} type="email" {...params0}>Adresse e-mail</Input>
					</div>
				</div>
				<div className="critere">
					<Input type="hidden" identifiant="critere" valeur={critere} {...params0}>Critère</Input>
				</div>
				<div>
					<TextArea identifiant="message" valeur={message} {...params0}>Message</TextArea>
				</div>
			</div>

			<div className="mt-4 flex justify-end gap-2">
				<Button type="blue" isSubmit={true} width="w-full">Discutons !</Button>
			</div>
		</form>
	}
	}

	Form.propTypes = {
		url: PropTypes.node.isRequired,
}
