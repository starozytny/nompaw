import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Input, InputFile, Radiobox } from "@tailwindComponents/Elements/Fields";

const URL_INDEX_PAGE = "user_aventures_groupes_read";
const URL_CREATE_ELEMENT = "intern_api_aventures_groupes_create";
const URL_UPDATE_ELEMENT = "intern_api_aventures_groupes_update";
const TEXT_CREATE = "Ajouter le groupe";
const TEXT_UPDATE = "Enregistrer les modifications";

export function GroupeFormulaire ({ context, element, users, members }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        isVisible={element ? Formulaire.setValue(element.isVisible ? 1 : 0) : 0}
        level={element ? Formulaire.setValue(element.level) : 0}
        description={element ? Formulaire.setValue(element.description) : ""}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}

        members={members}
        users={users}
    />
}

GroupeFormulaire.propTypes = {
	context: PropTypes.string.isRequired,
	users: PropTypes.array.isRequired,
	members: PropTypes.array.isRequired,
	element: PropTypes.object,
}

class Form extends Component {
	constructor (props) {
		super(props);

		let description = props.description ? props.description : "";

		this.state = {
			name: props.name,
			isVisible: props.isVisible,
			level: props.level,
			description: { value: description, html: description },
			members: props.members,
			errors: [],
		}

		this.file = React.createRef();
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleClickUser = (userId) => {
		const { members } = this.state;

		let find = false;
		members.forEach(member => {
			if (member === userId) find = true;
		})
		let nMembers;
		if (find) {
			nMembers = members.filter(m => {
				return m !== userId
			});
		} else {
			nMembers = members;
			nMembers.push(userId);
		}

		this.setState({ members: nMembers });
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { url } = this.props;
		const { name, isVisible, level, description } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'name', value: name },
			{ type: "text", id: 'isVisible', value: isVisible },
			{ type: "text", id: 'level', value: level },
			{ type: "text", id: 'description', value: description.html },
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
					Toastr.toast('info', "Données enregistrées.");
					location.href = Routing.generate(URL_INDEX_PAGE, { slug: response.data.slug });
				})
				.catch(function (error) {
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
			;
		}
	}

	render () {
        const { context, imageFile, users } = this.props;
        const { errors, name, isVisible, level, description, members } = this.state;

        let params = { errors: errors, onChange: this.handleChange };

        let isVisibleItems = [
            { value: 0, label: 'Aux membres', identifiant: 'visible-0' },
            { value: 1, label: 'Par tous', identifiant: 'visible-1' },
        ]

        let levelItems = [
            { value: 0, label: 'Aucun', identifiant: 'level-0' },
            { value: 1, label: 'Facile', identifiant: 'level-1' },
            { value: 2, label: 'Moyen', identifiant: 'level-2' },
            { value: 3, label: 'Difficile', identifiant: 'level-3' },
            { value: 4, label: 'Très difficile', identifiant: 'level-4' },
            { value: 5, label: 'Extrême', identifiant: 'level-5' },
        ]

        return <form onSubmit={this.handleSubmit}>
            <div className="flex flex-col gap-4 xl:gap-6">
                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Informations générales</div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div className="flex gap-4">
                            <div className="w-full">
                                <Radiobox items={isVisibleItems} identifiant="isVisible" valeur={isVisible} {...params}
                                          classItems="flex gap-2" styleType="fat">
                                    Visibilité *
                                </Radiobox>
                            </div>
                            <div className="w-full">
                                <Radiobox items={levelItems} identifiant="level" valeur={level} {...params}
                                          classItems="flex gap-2" styleType="fat">
                                    Niveau *
                                </Radiobox>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-full">
                                <Input identifiant="name" valeur={name} {...params}>Nom du groupe *</Input>
                            </div>
                            <div className="w-full">
                                <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                           placeholder="Glissez et déposer une image" {...params}>
                                    Illustration
                                </InputFile>
                            </div>
                        </div>
                        <div>
                            <TinyMCE type={6} identifiant='description' valeur={description.value}
                                     errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                Description du groupe
                            </TinyMCE>
                        </div>
                    </div>
                </div>

                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Membres du groupe</div>
                        <div className="text-gray-600 text-sm">
                            Sélectionnez les membres du groupe d'aventures
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div className="flex flex-wrap gap-2">
                            {users.map(user => {
                                let selected = false;
                                members.forEach(member => {
                                    if (member === user.id) selected = true;
                                })

                                return <div className={`cursor-pointer bg-gray-100 py-3 px-3 rounded flex items-center gap-2 border-2 ${selected ? "bg-blue-700/20 border-blue-500" : "hover:bg-gray-50"}`} key={user.id}
                                            onClick={() => this.handleClickUser(user.id)}>
                                    <div className="avatar">
                                        {user.avatarFile
                                            ? <img src={user.avatarFile} alt={`avatar de ${user.username}`} className="w-6 h-6 object-cover rounded-full" />
                                            : <div className="w-6 h-6 rounded-full text-xs bg-gray-500 flex items-center justify-center font-semibold text-slate-50">
                                                {user.lastname.slice(0, 2).toUpperCase()}
                                        </div>
                                        }
                                    </div>
                                    <div className="font-medium">{user.displayName}</div>
                                </div>
                            })}
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
