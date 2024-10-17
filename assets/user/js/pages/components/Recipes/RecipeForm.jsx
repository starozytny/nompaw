import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Button } from "@tailwindComponents/Elements/Button";
import { Input, InputFile, Radiobox } from "@tailwindComponents/Elements/Fields";

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

const URL_INDEX_PAGE = "user_recipes_read";
const URL_CREATE_ELEMENT = "intern_api_cook_recipes_create";
const URL_UPDATE_ELEMENT = "intern_api_cook_recipes_update";
const TEXT_CREATE = "Ajouter le produit";
const TEXT_UPDATE = "Enregistrer les modifications";

export function RecipeFormulaire ({ context, element }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        status={element ? Formulaire.setValue(element.status) : 0}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}
    />
}

RecipeFormulaire.propTypes = {
	context: PropTypes.string.isRequired,
	element: PropTypes.object
}

class Form extends Component {
	constructor (props) {
		super(props);

		this.state = {
			name: props.name,
			status: props.status,
			errors: [],
		}

		this.file = React.createRef();
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleSubmit = (e, stay = false) => {
		e.preventDefault();

		const { context, url } = this.props;
		const { name, status } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'name', value: name },
			{ type: "text", id: 'status', value: status },
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
					if (!stay) {
						location.href = Routing.generate(URL_INDEX_PAGE, { 'slug': response.data.slug });
					} else {
						Toastr.toast('info', 'Données enregistrées.');

						if (context === "create") {
							location.href = Routing.generate(URL_INDEX_PAGE, { 'slug': response.data.slug });
						} else {
							Formulaire.loader(false);
						}
					}
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
        const { errors, name, status } = this.state;

        let params = { errors: errors, onChange: this.handleChange };

        let statusItems = [
            { value: 0, label: 'Hors ligne', identifiant: 'status-0' },
            { value: 1, label: 'En ligne', identifiant: 'status-1' },
        ]

        return <form onSubmit={this.handleSubmit}>
            <div className="flex flex-col gap-4 xl:gap-6">
                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Informations générales</div>
                        <div className="text-gray-600 text-sm">
                            Le contenu de la recette sera à remplir dans la prochaine étape.
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div>
                            <Radiobox items={statusItems} identifiant="status" valeur={status} {...params}>
                                Visibilité *
                            </Radiobox>
                        </div>
                        <div>
                            <Input identifiant="name" valeur={name} {...params}>Intitulé *</Input>
                        </div>
                        <div>
                            <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                       placeholder="Glissez et déposer une image" {...params}>
                                Illustration
                            </InputFile>
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

Form.propTypes = {
    context: PropTypes.string.isRequired,
    url: PropTypes.node.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired,
    imageFile: PropTypes.string.isRequired,
}
