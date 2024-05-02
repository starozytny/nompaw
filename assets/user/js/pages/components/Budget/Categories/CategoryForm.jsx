import React, { Component } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Button } from "@tailwindComponents/Elements/Button";
import { Input, Radiobox } from "@tailwindComponents/Elements/Fields";

const URL_INDEX_ELEMENTS = "user_budget_categories_index";
const URL_CREATE_ELEMENT = "intern_api_budget_categories_create";
const URL_UPDATE_ELEMENT = "intern_api_budget_categories_update";

export function CategoryFormulaire ({ context, element }) {
	let url = Routing.generate(URL_CREATE_ELEMENT);

	if (context === "update") {
		url = Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });
	}

	return <Form
        context={context}
        url={url}

        type={element ? Formulaire.setValue(element.type) : 0}
        goal={element ? Formulaire.setValue(element.goal) : ""}
        name={element ? Formulaire.setValue(element.name) : ""}
    />
}

class Form extends Component {
	constructor (props) {
		super(props);

		this.state = {
			type: props.type,
			goal: props.goal,
			name: props.name,
			errors: [],
			loadData: false,
		}
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "goal") {
			value = Inputs.textMoneyMinusInput(value, this.state[name]);
		}

		if (name === "type") {
			if (parseInt(value) === 2) {
				this.setState({ goal: this.state.goal ? this.state.goal : "" })
			}
		}

		this.setState({ [name]: value })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { context, url } = this.props;
		const { loadData, type, name } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'type', value: type },
			{ type: "text", id: 'name', value: name },
		];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let self = this;

			if (!loadData) {
				this.setState({ loadData: true })
				Formulaire.loader(true);

				axios({ method: context === "create" ? "POST" : "PUT", url: url, data: this.state })
					.then(function (response) {
						location.href = Routing.generate(URL_INDEX_ELEMENTS, { h: response.data.id });
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
						Formulaire.loader(false);
						self.setState({ loadData: false })
					})
				;
			}
		}
	}

	render () {
        const { context } = this.props;
        const { errors, loadData, type, goal, name } = this.state;

        let typeItems = [
            { value: 0, label: 'Dépense', identifiant: 'it-depense' },
            { value: 1, label: 'Revenu', identifiant: 'it-revenu' },
            { value: 2, label: 'Économie', identifiant: 'it-economie' },
        ]

        let params = { errors: errors, onChange: this.handleChange };
        let paramsInput0 = { ...params, ...{ onChange: this.handleChange } }

        return <form onSubmit={this.handleSubmit}>
            <div className="flex flex-col gap-4 xl:gap-6">
                <div className="grid gap-2 xl:grid-cols-3 xl:gap-6">
                    <div>
                        <div className="font-medium text-lg">Catégorie</div>
                    </div>
                    <div className="flex flex-col gap-4 bg-white p-4 rounded-md ring-1 ring-inset ring-gray-200 xl:col-span-2">
                        <div>
                            <Radiobox items={typeItems} identifiant="type" valeur={type} {...paramsInput0}
                                      classItems="flex gap-2" styleType="fat">
                                Type
                            </Radiobox>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-full">
                                <Input identifiant="name" valeur={name} {...paramsInput0}>Intitulé</Input>
                            </div>
                            {parseInt(type) === 2
                                ? <div className="w-full">
                                    <Input identifiant="goal" valeur={goal} {...paramsInput0}>Objectif</Input>
                                </div>
                                : null
                            }
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
                <Button type="blue" isSubmit={true} iconLeft={loadData ? "chart-3" : ""}>
                    {context === "create" ? "Ajouter la catégorie" : "Enregistrer les modifications"}
                </Button>
            </div>
        </form>
    }
}
