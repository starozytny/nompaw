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

const URL_INDEX_PAGE = "user_birthdays_read";
const URL_CREATE_ELEMENT = "intern_api_birthdays_create";
const URL_UPDATE_ELEMENT = "intern_api_birthdays_update";
const TEXT_CREATE = "Ajouter l'anniversaire";
const TEXT_UPDATE = "Enregistrer les modifications";

export function BirthdayFormulaire ({ context, element }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        description={element ? Formulaire.setValue(element.description) : ""}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}
        startAt={element ? Formulaire.setValueDate(element.startAt) : ""}
        timeAt={element ? Formulaire.setValueTime(element.timeAt) : ""}
        iframeRoute={element ? Formulaire.setValue(element.iframeRoute) : ""}
    />
}

BirthdayFormulaire.propTypes = {
	context: PropTypes.string.isRequired,
	element: PropTypes.object,
}

class Form extends Component {
	constructor (props) {
		super(props);

		let description = props.description ? props.description : "";

		this.state = {
			name: props.name,
			description: { value: description, html: description },
			startAt: props.startAt,
			timeAt: props.timeAt,
			iframeRoute: props.iframeRoute,
			errors: [],
		}

		this.file = React.createRef();
	}

	componentDidMount = () => {
		Inputs.initDateInput(this.handleChangeDate, this.handleChange, new Date())
	}

	handleChange = (e, picker) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "startAt") {
			value = Inputs.dateInput(e, picker, this.state[name]);
		}

		if (name === "timeAt") {
			value = Inputs.timeInput(e, this.state[name]);
		}

		this.setState({ [name]: value })
	}

	handleChangeDate = (name, value) => {
		this.setState({ [name]: value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { url } = this.props;
		const { name, startAt, timeAt } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [{ type: "text", id: 'name', value: name }];

		if (startAt !== "") {
			paramsToValidate = [...paramsToValidate, ...[{ type: "date", id: 'startAt', value: startAt }]];
		}

		if (timeAt !== "") {
			paramsToValidate = [...paramsToValidate, ...[{ type: "time", id: 'timeAt', value: timeAt }]];
		}

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
					Toastr.toast('info', "Donnée enregistrées.");
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
        const { errors, name, description, startAt, timeAt, iframeRoute } = this.state;

        let params = { errors: errors, onChange: this.handleChange };

        return <form onSubmit={this.handleSubmit}>
            <div className="flex flex-col gap-4 xl:gap-6">
                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Informations générales</div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-full">
                                <Input identifiant="name" valeur={name} {...params}>Nom *</Input>
                            </div>
                            <div className="w-full">
                                <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                           placeholder="Glissez et déposer une image" {...params}>
                                    Illustration
                                </InputFile>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-full">
                                <Input type="js-date" identifiant="startAt" valeur={startAt} {...params}>Début le</Input>
                            </div>
                            <div className="w-full">
                                <Input type="time" identifiant="timeAt" valeur={timeAt} placeholder="00h00" {...params}>À quelle heure</Input>
                            </div>
                        </div>
                        <div>
                            <TinyMCE type={6} identifiant='description' valeur={description.value}
                                     errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                Description
                            </TinyMCE>
                        </div>
                        <div>
                            <Input identifiant="iframeRoute" valeur={iframeRoute} {...params}>Iframe carte</Input>
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
