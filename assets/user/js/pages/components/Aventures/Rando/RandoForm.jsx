import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Input, Radiobox, SelectCombobox } from "@tailwindComponents/Elements/Fields";

const URL_INDEX_PAGE = "user_aventures_randos_read";
const URL_CREATE_ELEMENT = "intern_api_aventures_randos_create";
const URL_UPDATE_ELEMENT = "intern_api_aventures_randos_update";
const TEXT_CREATE = "Ajouter la randonnée";
const TEXT_UPDATE = "Enregistrer les modifications";

export function RandoFormulaire ({ context, element, isAdmin, groupeId, users, userId }) {
	let url = Routing.generate(URL_CREATE_ELEMENT, { groupe: groupeId });

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { groupe: groupeId, id: element.id });
	}

	return <Form
        context={context}
        url={url}

		isAdmin={isAdmin}

        name={element ? Formulaire.setValue(element.name) : ""}
		typeRando={element ? Formulaire.setValue(element.typeRando) : 0}
        description={element ? Formulaire.setValue(element.description) : ""}
        status={element ? Formulaire.setValue(element.status) : 0}
        localisation={element ? Formulaire.setValue(element.localisation) : ""}
        level={element ? Formulaire.setValue(element.level) : ""}
        altitude={element ? Formulaire.setValue(element.altitude) : ""}
        devPlus={element ? Formulaire.setValue(element.devPlus) : ""}
        distance={element ? Formulaire.setValue(element.distance) : ""}
        referent={element ? Formulaire.setValue(element.author.id) : userId}
        story={element ? Formulaire.setValue(element.story) : ""}

		adventureId={element && element.adventure ? Formulaire.setValue(element.adventure.id) : ""}
		adventureName={element && element.adventure ? Formulaire.setValue(element.adventure.name) : ""}
		adventureDuration={element && element.adventure ? Formulaire.setValueTime(element.adventure.duration) : ""}
		adventureUrl={element && element.adventure ? Formulaire.setValue(element.adventure.url) : "https://"}

		adventureDateId={element && element.adventureDate ? Formulaire.setValue(element.adventureDate.id) : ""}
		adventureDateAt={element && element.adventureDate ? Formulaire.setValueDate(element.adventureDate.dateAt) : ""}

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
			typeRando: props.typeRando,
			description: { value: description, html: description },
			localisation: props.localisation,
			level: props.level,
			altitude: props.altitude,
			devPlus: props.devPlus,
			distance: props.distance,
			referent: props.referent,
			story: props.story,

			adventureId: props.adventureId,
			adventureName: props.adventureName,
			adventureDuration: props.adventureDuration,
			adventureUrl: props.adventureUrl,

			adventureDateId: props.adventureDateId,
			adventureDateAt: props.adventureDateAt,

			errors: [],
		}
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleSelect = (identifiant, value) => {
		this.setState({ [identifiant]: value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { context, url } = this.props;
		const { referent, name, typeRando, localisation } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'referent', value: referent },
			{ type: "text", id: 'name', value: name },
			{ type: "text", id: 'typeRando', value: typeRando },
			{ type: "text", id: 'localisation', value: localisation }
		];

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
        const { context, isAdmin, users } = this.props;
        const {
			errors, name, typeRando, description, localisation, level, altitude, devPlus, distance, referent, story,
			adventureName, adventureDuration, adventureUrl, adventureDateAt
		} = this.state;

        let params0 = { errors: errors, onChange: this.handleChange };
        let params1 = { errors: errors, onSelect: this.handleSelect };

        let levelItems = [
            { value: 0, label: 'Aucun', identifiant: 'level-0' },
            { value: 1, label: 'Facile', identifiant: 'level-1' },
            { value: 2, label: 'Moyen', identifiant: 'level-2' },
            { value: 3, label: 'Difficile', identifiant: 'level-3' },
            { value: 4, label: 'Très difficile', identifiant: 'level-4' },
            { value: 5, label: 'Extrême', identifiant: 'level-5' },
        ]

        let typeItems = [
            { value: 0, label: 'Randonnée', identifiant: 'type-0' },
            { value: 1, label: 'Voyage', identifiant: 'type-1' },
            { value: 2, label: 'Urbex', identifiant: 'type-2' },
        ]

        let referentsItem = [];
        users.forEach(us => {
            referentsItem.push({ value: us.id, label: us.displayName })
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
								<SelectCombobox identifiant="referent" valeur={referent} items={referentsItem} {...params1} noEmpty={true}>
									Référent *
								</SelectCombobox>
                            </div>
                            <div className="w-full">
                                <Input identifiant="name" valeur={name} {...params0}>Nom de l'aventure *</Input>
                            </div>
                        </div>
						<div>
							<Radiobox items={typeItems} identifiant="typeRando" valeur={typeRando} {...params0}
									  classItems="flex gap-2" styleType="fat">
								Type d'aventure *
							</Radiobox>
						</div>
                        <div>
                            <TinyMCE type={7} identifiant='description' valeur={description.value}
                                     errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                Petite description
                            </TinyMCE>
                        </div>
						<div>
							<Input identifiant="localisation" valeur={localisation} {...params0}>Localisation *</Input>
						</div>
                    </div>
                </div>
				<div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
					<div>
						<div className="font-medium text-lg">Informations complémentaire</div>
						<div className="text-gray-600 text-sm">
							Ajouter des informations complémentaires à propos de l'aventure sélectionnée.
						</div>
					</div>
					<div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
						<div>
							<Input identifiant="adventureDateAt" valeur={adventureDateAt} {...params0} type="date">Date de l'aventure</Input>
						</div>

						<div className="flex gap-4">
							<div className="w-full">
								<Input identifiant="adventureName" valeur={adventureName} {...params0}>Nom de l'aventure sélectionnée</Input>
							</div>
							<div className="w-full">
								<Input identifiant="adventureDuration" valeur={adventureDuration} {...params0} type="time">Durée</Input>
							</div>
							<div className="w-full">
								<Input identifiant="adventureUrl" valeur={adventureUrl} {...params0}>Lien du topo</Input>
							</div>
						</div>

						{isAdmin
							? <div>
								<Input identifiant="story" valeur={story} {...params0}>Nom de la route du storytelling</Input>
							</div>
							: null
						}

						{parseInt(typeRando) === 0
							? <>
								<div className="flex gap-4">
									<div className="w-full">
										<Input type="number" identifiant="distance" valeur={distance} {...params0}>Distance</Input>
									</div>
									<div className="w-full">
										<Input type="number" identifiant="devPlus" valeur={devPlus} {...params0}>Dénivelé +</Input>
									</div>
									<div className="w-full">
										<Input type="number" identifiant="altitude" valeur={altitude} {...params0}>Altitude</Input>
									</div>
								</div>
								<div>
									<Radiobox items={levelItems} identifiant="level" valeur={level} {...params0}
											  classItems="flex gap-2 flex-wrap" styleType="fat">
										Niveau *
									</Radiobox>
								</div>
							</>
							: null
						}
					</div>
				</div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Button type="blue" isSubmit={true}>{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
            </div>
        </form>
    }
}
