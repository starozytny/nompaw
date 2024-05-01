import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Input } from "@tailwindComponents/Elements/Fields";
import { ModalDelete } from "@commonComponents/Shortcut/Modal";

const URL_CREATE_ELEMENT = 'intern_api_cook_ingredients_create';
const URL_UPDATE_ELEMENT = 'intern_api_cook_ingredients_update';
const URL_DELETE_ELEMENT = 'intern_api_cook_ingredients_delete';

export class Ingredients extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			ingredients: props.ingre,
			ingreId: '',
			ingreUnit: "",
			ingreNombre: "",
			ingreName: "",
			errors: [],
			loadData: false,
			actives: []
		}

		this.delete = React.createRef();
	}

	handleReset = (ingredients) => {
		this.setState({
			context: 'create',
			ingredients: ingredients,
			ingreId: '',
			ingreUnit: '',
			ingreNombre: '',
			ingreName: '',
			errors: [],
			loadData: false,
		})
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleUpdate = (element) => {
		this.setState({
			context: 'update',
			ingreId: element.id,
			ingreUnit: Formulaire.setValue(element.unit),
			ingreNombre: Formulaire.setValue(element.nombre),
			ingreName: Formulaire.setValue(element.name),
			errors: []
		})
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { recipe } = this.props;
		const { context, loadData, ingreId, ingreUnit, ingreNombre, ingreName } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'ingreName', value: ingreName },
		];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let data = { recipeId: recipe.id, id: ingreId, nombre: ingreNombre, unit: ingreUnit, name: ingreName }

			let method = context === "create" ? 'POST' : 'PUT',
				url = context === 'create'
					? Routing.generate(URL_CREATE_ELEMENT)
					: Routing.generate(URL_UPDATE_ELEMENT, { 'id': ingreId });

			if (!loadData) {
				this.setState({ loadData: true })

				let self = this;
				axios({ method: method, url: url, data: data })
					.then(function (response) {
						let element = { ...data, ...{ id: response.data.id } }
						self.handleUpdateList(element, context)
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
						Formulaire.loader(false);
					})
				;
			}
		}
	}

	handleUpdateList = (element, context) => {
		const { ingredients } = this.state;

		let nIngredients = [];
		switch (context) {
			case 'create':
				nIngredients = ingredients;
				nIngredients.push(element)
				break;
			case 'update':
				ingredients.forEach((ingre) => {
					if (ingre.id === element.id) {
						ingre = element;
					}

					nIngredients.push(ingre);
				})
				break;
			case 'delete':
				ingredients.forEach((ingre) => {
					if (ingre.id !== element.id) {
						nIngredients.push(ingre);
					}
				})
				break;
			default:
				break;
		}

		this.setState({ ingredients: nIngredients });
		this.handleReset(nIngredients);
	}

	handleDelete = (element) => {
		this.setState({ ingreId: element.id })
		this.delete.current.handleClick();
	}

	handleActive = (element) => {
		const { actives } = this.state;

		let find = false;
		actives.forEach(act => {
			if (act.id === element.id) {
				find = true;
			}
		})

		let nActives = actives;
		if (find) {
			nActives = nActives.filter(act => {
				return act.id !== element.id
			});
		} else {
			nActives.push(element);
		}

		this.setState({ actives: nActives })
	}

	render () {
		const { mode } = this.props;
		const { context, errors, loadData, ingredients, ingreId, ingreNombre, ingreUnit, ingreName, actives } = this.state;

		const paramsInput0 = { errors: errors, onChange: this.handleChange };

		return <div className="bg-white rounded-md border p-4">
			{mode && <div className="pb-4 mb-4 border-b">
				<div className="flex gap-1">
					<div class="w-full">
                        <Input identifiant='ingreNombre' valeur={ingreNombre} placeholder='0' {...paramsInput0} />
                    </div>
					<div class="w-full">
                        <Input identifiant='ingreUnit' valeur={ingreUnit} placeholder='unité' {...paramsInput0} />
                    </div>
					<div class="w-full">
                        <Input identifiant='ingreName' valeur={ingreName} placeholder="Ingrédient" {...paramsInput0} />
                    </div>
					<div className="w-full">
						{loadData
							? <ButtonIcon type="blue" icon='chart-3' />
							: (context === "create"
									? <ButtonIcon type="blue" onClick={this.handleSubmit} icon="add">Ajouter l'ingrédient</ButtonIcon>
									: <div className="flex gap-1">
										<ButtonIcon type="blue" onClick={this.handleSubmit} icon="check1">Enregistrer les modifs.</ButtonIcon>
										<ButtonIcon type="default" onClick={() => this.handleReset(ingredients)} icon="close">Annuler</ButtonIcon>
									</div>
							)
						}
					</div>
				</div>
			</div>}
			<div className="flex flex-col gap-2">
                {ingredients.map((ingre, index) => {

                    let active = false;
                    actives.forEach(act => {
                        if (act.id === ingre.id) {
                            active = true;
                        }
                    })

                    return <div className="flex items-center justify-between gap-2" onClick={() => this.handleActive(ingre)} key={index}>
                        <div className="flex items-center gap-2 group">
                            <div className={`cursor-pointer w-6 h-6 border-2 rounded-md ring-1 flex items-center justify-center ${active ? "bg-blue-700 ring-blue-700" : "bg-white ring-gray-100 group-hover:bg-blue-100"}`}>
                                <span className={`icon-check1 text-sm ${active ? "text-white" : "text-transparent"}`}></span>
                            </div>
                            <div className="flex gap-2">
                                <span>{ingre.nombre}</span>
                                <span>{ingre.unit}</span>
                                <span>{ingre.name}</span>
                            </div>
                        </div>

                        <div className="flex gap-1">
                            {mode && <>
                                <ButtonIcon type="default" onClick={() => this.handleUpdate(ingre)} icon="pencil">Modifier</ButtonIcon>
                                <ButtonIcon type="default" onClick={() => this.handleDelete(ingre)} icon="trash">Supprimer</ButtonIcon>
                            </>}
                        </div>
                    </div>
                })}
            </div>
            {mode && <ModalDelete refModal={this.delete} element={{ id: ingreId }} routeName={URL_DELETE_ELEMENT}
                                  title="Supprimer cet ingrédient" msgSuccess="Ingrédient supprimé"
                                  onUpdateList={this.handleUpdateList}>Êtes-vous sûr de vouloir supprimer cet ingrédient ?</ModalDelete>
            }
        </div>
    }
}

Ingredients.propTypes = {
    mode: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
	ingre: PropTypes.array.isRequired,
}
