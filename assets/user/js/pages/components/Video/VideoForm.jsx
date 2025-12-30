import React, { Component } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { Input } from "@tailwindComponents/Elements/Fields";
import { CloseModalBtn } from "@tailwindComponents/Elements/Modal";

const URL_INDEX_PAGE = "user_videotheque_index";
const URL_CREATE_ELEMENT = "intern_api_videos_create";
const URL_UPDATE_ELEMENT = "intern_api_videos_update";

export function VideoFormulaire ({ context, element }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        filename={element ? Formulaire.setValue(element.filename) : ""}
        fileSize={element ? Formulaire.setValue(element.fileSize) : ""}
        fileExtension={element ? Formulaire.setValue(element.fileExtension) : ""}
		// imageFile={element ? Formulaire.setValue(element.illustrationFile) : ""}
    />
}

class Form extends Component {
	constructor (props) {
		super(props);

		this.state = {
			name: props.name,
			filename: props.filename,
			fileSize: props.fileSize,
			fileExtension: props.fileExtension,
			errors: [],
		}

		this.file = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		this.setState({ [name]: value })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { url } = this.props;
		const { name } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'name', value: name },
		];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			Formulaire.loader(true);
			let self = this;

			let formData = new FormData();
			formData.append("data", JSON.stringify(this.state));

			// let file = this.file.current;
			// if (file.state.files.length > 0) {
			// 	formData.append("image", file.state.files[0]);
			// }

			axios({ method: "POST", url: url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
				.then(function (response) {
					Toastr.toast('info', 'Données enregistrées.');
					location.href = Routing.generate(URL_INDEX_PAGE);
				})
				.catch(function (error) {
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
			;
		}
	}

	render () {
        const { identifiant, imageFile } = this.props;
        const { errors, name } = this.state;

        let params0 = { errors: errors, onChange: this.handleChange };

        return <>
			<div className="px-4 pb-4 pt-5 sm:px-6 sm:pb-4">
				<div className="flex gap-4">
					<div className="w-full">
						<Input identifiant="name" valeur={name} {...params0}>Nom du projet *</Input>
					</div>
					{/*<div className="w-full">*/}
					{/*	<InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}*/}
					{/*			   placeholder="Glissez et déposer une image" {...params0}>*/}
					{/*		Illustration*/}
					{/*	</InputFile>*/}
					{/*</div>*/}
				</div>
			</div>
			<div className="bg-gray-50 px-4 py-3 flex flex-row justify-end gap-2 sm:px-6 border-t">
				<CloseModalBtn identifiant={identifiant} />
				<Button type="blue" onClick={this.handleSubmit}>Confirmer</Button>
			</div>
        </>
    }
}
