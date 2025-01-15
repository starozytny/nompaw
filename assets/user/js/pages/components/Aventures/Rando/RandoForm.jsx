import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Input, InputView, Radiobox } from "@tailwindComponents/Elements/Fields";

const URL_INDEX_PAGE = "user_aventures_randos_read";
const URL_CREATE_ELEMENT = "intern_api_aventures_randos_create";
const URL_UPDATE_ELEMENT = "intern_api_aventures_randos_update";
const TEXT_CREATE = "Ajouter la randonnée";
const TEXT_UPDATE = "Enregistrer les modifications";

export function RandoFormulaire ({ context, element, groupeId, users, userId }) {
	let url = Routing.generate(URL_CREATE_ELEMENT, { groupe: groupeId });

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { groupe: groupeId, id: element.id });
	}

	return <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        description={element ? Formulaire.setValue(element.description) : ""}
        status={element ? Formulaire.setValue(element.status) : 0}
        level={element ? Formulaire.setValue(element.level) : ""}
        altitude={element ? Formulaire.setValue(element.altitude) : ""}
        devPlus={element ? Formulaire.setValue(element.devPlus) : ""}
        distance={element ? Formulaire.setValue(element.distance) : ""}
        adventure={element ? element.adventure : null}
        referent={element ? Formulaire.setValue(element.author.id) : userId}
        googlePhotos={element ? Formulaire.setValue(element.googlePhotos) : ""}
        story={element ? Formulaire.setValue(element.story) : ""}

        users={users}
    />
}

RandoFormulaire.propTypes = {
	context: PropTypes.string.isRequired,
	groupeId: PropTypes.number.isRequired,
	users: PropTypes.array.isRequired,
	element: PropTypes.object,
}

class Form extends Component {
	constructor (props) {
		super(props);

		let description = props.description ? props.description : "";

		this.state = {
			name: props.name,
			description: { value: description, html: description },
			level: props.level,
			altitude: props.altitude,
			devPlus: props.devPlus,
			distance: props.distance,
			referent: props.referent,
			googlePhotos: props.googlePhotos,
			story: props.story,
			errors: [],
		}
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { context, url } = this.props;
		const { name } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [{ type: "text", id: 'name', value: name }];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			Formulaire.loader(true);
			let self = this;
			axios({ method: context === "create" ? "POST" : "PUT", url: url, data: this.state })
				.then(function (response) {
					Toastr.toast('info', "Données enregistrées.");
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
        const { context, status, adventure, users } = this.props;
        const { errors, name, description, level, altitude, devPlus, distance, referent, googlePhotos, story } = this.state;

        let params = { errors: errors, onChange: this.handleChange };

        let levelItems = [
            { value: 0, label: 'Aucun', identifiant: 'level-0' },
            { value: 1, label: 'Facile', identifiant: 'level-1' },
            { value: 2, label: 'Moyen', identifiant: 'level-2' },
            { value: 3, label: 'Difficile', identifiant: 'level-3' },
            { value: 4, label: 'Très difficile', identifiant: 'level-4' },
            { value: 5, label: 'Extrême', identifiant: 'level-5' },
        ]

        let referentsItem = [];
        users.forEach(us => {
            referentsItem.push({ value: us.id, label: us.displayName, identifiant: 'us-' + us.id })
        })

        return <form onSubmit={this.handleSubmit}>
            <div className="flex flex-col gap-4 xl:gap-6">
                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Informations générales</div>
                        <div className="text-gray-600 text-sm">
                            La personnalisation se fera après avoir enregistrée cette étape.
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-full">
                                {/*<Select identifiant="referent" valeur={referent} items={referentsItem} noEmpty={true} noErrors={true} {...params}>*/}
                                {/*    Référent*/}
                                {/*</Select>*/}
                            </div>
                            <div className="w-full">
                                <Input identifiant="name" valeur={name} {...params}>Nom de l'aventure *</Input>
                            </div>
                        </div>
                        <div>
                            <TinyMCE type={7} identifiant='description' valeur={description.value}
                                     errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                Petite description
                            </TinyMCE>
                        </div>
                    </div>
                </div>
                {status !== 0 &&
                    <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                        <div>
                            <div className="font-medium text-lg">Informations complémentaire</div>
                            <div className="text-gray-600 text-sm">
                                Ajouter des informations complémentaires à propos de l'aventure sélectionnée.
                            </div>
                        </div>
                        <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                            <div>
                                <InputView valeur={adventure.name}>Nom de l'aventure sélectionnée</InputView>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-full">
                                    <Input type="number" identifiant="distance" valeur={distance} {...params}>Distance</Input>
                                </div>
                                <div className="w-full">
                                    <Input type="number" identifiant="devPlus" valeur={devPlus} {...params}>Dénivelé +</Input>
                                </div>
                                <div className="w-full">
                                    <Input type="number" identifiant="altitude" valeur={altitude} {...params}>Altitude</Input>
                                </div>
                            </div>
                            <div>
                                <Radiobox items={levelItems} identifiant="level" valeur={level} {...params}
                                          classItems="flex gap-2 flex-wrap" styleType="fat">
                                    Niveau *
                                </Radiobox>
                            </div>
                            <div className="flex gap-4">
                                <div className="w-full">
                                    <Input identifiant="googlePhotos" valeur={googlePhotos} {...params}>Lien Google photos</Input>
                                </div>
                                <div className="w-full">
                                    <Input identifiant="story" valeur={story} {...params}>Lien URL du storytelling</Input>
                                </div>
                            </div>
                        </div>
                    </div>
                }
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="blue" isSubmit={true}>{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
            </div>
        </form>
    }
}
