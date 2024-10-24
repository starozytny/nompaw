import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur"

import { Input } from "@tailwindComponents/Elements/Fields";
import { Password } from "@tailwindComponents/Modules/User/Password";
import { Button, ButtonA } from "@tailwindComponents/Elements/Button";

const URL_LOGIN_PAGE = "app_login";
const URL_CREATE_ELEMENT = "intern_api_users_create";

export function UserFormulaire () {
	return <Form
		url={Routing.generate(URL_CREATE_ELEMENT)}
		username=""
		firstname=""
		lastname=""
		displayName=""
		email=""
	/>;
}

class Form extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: "registration",
			username: props.username,
			firstname: props.firstname,
			lastname: props.lastname,
			displayName: props.displayName,
			email: props.email,
			password: '',
			password2: '',
			critere: '',
			errors: [],
		}
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { url } = this.props;
		const { username, firstname, lastname, displayName, password, password2, email, critere } = this.state;

		this.setState({ errors: [] });

		if (critere !== "") {
			Toastr.toast('error', "Une erreur est survenue. Veuillez rafraichir la page.");
		} else {
			let paramsToValidate = [
				{ type: "text", id: 'username', value: username },
				{ type: "text", id: 'firstname', value: firstname },
				{ type: "text", id: 'lastname', value: lastname },
				{ type: "text", id: 'displayName', value: displayName },
				{ type: "email", id: 'email', value: email },
				{ type: "password", id: 'password', value: password, idCheck: 'password2', valueCheck: password2 }
			];

			let validate = Validateur.validateur(paramsToValidate);
			if (!validate.code) {
				Formulaire.showErrors(this, validate);
			} else {
				Formulaire.loader(true);
				let self = this;

				let formData = new FormData();
				formData.append("data", JSON.stringify(this.state));

				axios({ method: "POST", url: url, data: formData })
					.then(function (response) {
						location.href = Routing.generate(URL_LOGIN_PAGE);
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
						Formulaire.loader(false);
					})
				;
			}
		}
	}

	render () {
		const { errors, username, firstname, lastname, displayName, email, password, password2 } = this.state;

		let params0 = { errors: errors, onChange: this.handleChange };

		return <>
			<form onSubmit={this.handleSubmit}>
				<div className="flex flex-col gap-4">
					<div className="flex gap-2">
						<div className="w-full">
							<Input identifiant="username" valeur={username} {...params0}>Nom utilisateur</Input>
						</div>
						<div className="w-full">
							<Input identifiant="email" valeur={email}    {...params0} type="email">Adresse e-mail</Input>
						</div>
					</div>
					<div className="flex gap-2">
						<div className="w-full">
							<Input identifiant="firstname" valeur={firstname}  {...params0}>Prénom</Input>
						</div>
						<div className="w-full">
							<Input identifiant="lastname" valeur={lastname}   {...params0}>Nom</Input>
						</div>
					</div>
					<div>
						<Input identifiant="displayName" valeur={displayName}   {...params0}>Nom à afficher</Input>
					</div>

					<Password template="col" password={password} password2={password2} params={params0} />
				</div>

				<div className="mt-4 flex justify-end gap-2">
					<ButtonA type="default" onClick={Routing.generate(URL_LOGIN_PAGE)}>J'ai déja un compte</ButtonA>
					<Button type="blue" isSubmit={true}>Rejoindre</Button>
				</div>
			</form>
		</>
	}
}

Form.propTypes = {
	url: PropTypes.node.isRequired,
	username: PropTypes.string.isRequired,
	firstname: PropTypes.string.isRequired,
	email: PropTypes.string.isRequired,
}
