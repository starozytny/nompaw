import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Inputs from "@commonFunctions/inputs";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Input, InputFile } from "@tailwindComponents/Elements/Fields";

const URL_INDEX_PAGE = "user_projects_read";
const URL_CREATE_ELEMENT = "intern_api_projects_create";
const URL_UPDATE_ELEMENT = "intern_api_projects_update";
const TEXT_CREATE = "Ajouter le projet";
const TEXT_UPDATE = "Enregistrer les modifications";

export function ProjectFormulaire ({ context, element }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
		startAt={element ? Formulaire.setValueDate(element.startAt) : ""}
		endAt={element ? Formulaire.setValueDate(element.endAt) : ""}
		participants={element ? Formulaire.setValue(element.participants) : 1}
        description={element ? Formulaire.setValue(element.description) : ""}
		maxBudget={element ? Formulaire.setValue(element.maxBudget) : ""}
		localisation={element ? Formulaire.setValue(element.localisation) : ""}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}
    />
}

ProjectFormulaire.propTypes = {
	context: PropTypes.string.isRequired,
	element: PropTypes.object,
}

class Form extends Component {
	constructor (props) {
		super(props);

		let description = props.description ? props.description : "";

		this.state = {
			name: props.name,
			startAt: props.startAt,
			endAt: props.endAt,
			participants: props.participants,
			description: { value: description, html: description },
			maxBudget: props.maxBudget,
			localisation: props.localisation,
			errors: [],
		}

		this.file = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "maxBudget") {
			value = Inputs.textMoneyMinusInput(value, this.state[name])
		}

		if (name === "participants") {
			value = Inputs.textNumericInput(value, this.state[name])
		}

		this.setState({ [name]: value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { url } = this.props;
		const { name, startAt, endAt, maxBudget, localisation } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'name', value: name },
			{ type: "text", id: 'startAt', value: startAt },
			{ type: "date", id: 'startAt', value: startAt },
			{ type: "text", id: 'endAt', value: endAt },
			{ type: "date", id: 'endAt', value: endAt },
			{ type: "text", id: 'maxBudget', value: maxBudget },
			{ type: "text", id: 'localisation', value: localisation }
		];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			Formulaire.loader(true);
			let self = this;

			let formData = new FormData();
			formData.append("data", JSON.stringify(this.state));

			let file = this.file.current;
			if (file.state.files.length > 0) {
				formData.append("image", file.state.files[0]);
			}

			axios({ method: "POST", url: url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
				.then(function (response) {
					Toastr.toast('info', 'Données enregistrées.');
					location.href = Routing.generate(URL_INDEX_PAGE, { 'slug': response.data.slug });
				})
				.catch(function (error) {
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
			;
		}
	}

	render () {
        const { context, imageFile } = this.props;
        const { errors, name, startAt, endAt, participants, description, maxBudget, localisation } = this.state;

        let params0 = { errors: errors, onChange: this.handleChange };

        return <form onSubmit={this.handleSubmit}>
            <div className="flex flex-col gap-4 xl:gap-6">
                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Informations générales</div>
                        <div className="text-gray-600 text-sm">
                            Quelques détails sur le projet.
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-full">
                                <Input identifiant="name" valeur={name} {...params0}>Nom du projet *</Input>
                            </div>
                            <div className="w-full">
                                <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                           placeholder="Glissez et déposer une image" {...params0}>
                                    Illustration
                                </InputFile>
                            </div>
                        </div>
						<div className="flex gap-2">
							<div className="w-full">
								<Input type="date" identifiant="startAt" valeur={startAt} {...params0}>Début le</Input>
							</div>
							<div className="w-full">
								<Input type="date" identifiant="endAt" valeur={endAt} {...params0}>Fini le</Input>
							</div>
						</div>
						<div className="flex gap-2">
							<div className="w-full">
								<Input type="number" identifiant="participants" valeur={participants} {...params0}>Participants</Input>
							</div>
							<div className="w-full">
								<Input type="number" identifiant="maxBudget" valeur={maxBudget} {...params0}>Budget max.</Input>
							</div>
						</div>
						<div>
							<Input identifiant="localisation" valeur={localisation} {...params0}>Localisation</Input>
						</div>
                        <div>
                            <TinyMCE type={6} identifiant='description' valeur={description.value}
                                     errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                Description
                            </TinyMCE>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <Button type="blue" isSubmit={true}>{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
            </div>
        </form>
    }
}
