import React, { Component } from "react";
import PropTypes from "prop-types";

import _ from "lodash";
import parse from "html-react-parser"
import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from '@commonFunctions/sanitaze';
import Formulaire from '@commonFunctions/formulaire';
import Validateur from "@commonFunctions/validateur";
import Inputs from "@commonFunctions/inputs";

import { Radio, Rate } from "antd";
import { Input, Radiobox } from "@tailwindComponents/Elements/Fields";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";

import { Ingredients } from "@userPages/Recipes/Ingredients";
import { Instructions } from "@userPages/Recipes/Instructions";
import { Commentary } from "@userPages/Recipes/Commentary";

const URL_UPDATE_DATA = 'intern_api_cook_recipes_update_data';

const menu = [
	{ label: 'Instructions', value: 'instructions' },
	{ label: 'Ingrédients', value: 'ingredients' },
	{ label: 'Avis', value: 'avis' },
];

const menuTiny = [
	{ label: 'Ingrédients', value: 'ingredients' },
	{ label: 'Avis', value: 'avis' },
];

export class RecipeRead extends Component {
	constructor (props) {
		super(props);

		const elem = props.elem;
		let description = elem.content ? elem.content : "";

		this.state = {
			isMobile: !window.matchMedia("(min-width: 1280px)").matches,
			context: window.matchMedia("(min-width: 1280px)").matches ? 'ingredients' : 'instructions',
			elem: elem,
			nbPerson: Formulaire.setValue(elem.nbPerson),
			difficulty: Formulaire.setValue(elem.difficulty),
			durationCooking: Formulaire.setValueTime(elem.durationCooking),
			durationPrepare: Formulaire.setValueTime(elem.durationPrepare),
			description: { value: description, html: description },
			errors: [],
			loadData: false,
		}
	}

	handleChangeContext = (e) => {
		this.setState({ context: e.target.value })
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name !== "difficulty") {
			if (name === 'durationPrepare' || name === 'durationCooking') {
				value = Inputs.timeInput(e, this.state[name]);
			}

			this.setState({ [name]: value });
		} else {
			this.handleSubmit(e, 'text', 'difficulty', value);
		}
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleSubmit = (e, type, name, nValue = null) => {
		e.preventDefault();

		const { elem } = this.props;
		const { loadData } = this.state;

		this.setState({ errors: [] });

		let value = nValue ? nValue : this.state[name];
		let paramsToValidate = [{ type: type, id: name, value: value }];
		if (type === "textarea") {
			paramsToValidate = [{ type: 'text', id: name, value: value.html }];
		}

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			if (!loadData) {
				this.setState({ loadData: true })
				let self = this;
				axios({ method: "PUT", url: Routing.generate(URL_UPDATE_DATA, { 'id': elem.id }), data: { name: name, value: value } })
					.then(function (response) {
						toastr.info('Recette mise à jour.');
						self.setState({ [name]: value, elem: response.data, loadData: false })
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
		const { mode, elem, steps, ingre, coms, rate } = this.props;
		const { isMobile, context, errors, loadData, nbPerson, difficulty, durationCooking, durationPrepare, description } = this.state;

		let content;
		switch (context) {
			case "avis":
				content = <Commentary mode={mode} recipe={elem} coms={coms} />
				break;
			case "ingredients":
				content = <Ingredients mode={mode} recipe={elem} ingre={ingre} />
				break;
			default:
				content = isMobile ? <Instructions mode={mode} recipe={elem} steps={steps} /> : null
				break;
		}

		let difficultyItems = [
			{ value: 0, label: 'Facile', identifiant: 'type-0' },
			{ value: 1, label: 'Moyen', identifiant: 'type-1' },
			{ value: 2, label: 'Difficile', identifiant: 'type-2' },
		]

		const paramsInput0 = { errors: errors, onChange: this.handleChange };

		return <div className="flex flex-col gap-6 xl:grid xl:grid-cols-3">
			<div className="flex flex-col gap-6 xl:col-span-2">
				<img alt="example" src={elem.imageFile} className="h-64 w-full object-cover rounded-md" />
				<div className="flex flex-col gap-6">
					{(mode || elem.content) && <div className="bg-white rounded-md border p-4">
						{mode
							? <div className="flex flex-col gap-4">
								<div>
									<TinyMCE type={4} identifiant='description' valeur={description.value} params={{ id: elem.id }}
											 errors={errors} onUpdateData={this.handleChangeTinyMCE}>
										Introduction
									</TinyMCE>
								</div>
								<div className="flex justify-end">
									{loadData
										? <Button type="default" icon='chart-3'>Enregistrer</Button>
										: <Button type="blue" icon='check1'
												  onClick={(e) => this.handleSubmit(e, 'textarea', 'description')}>
											Enregistrer
										</Button>
									}
								</div>
							</div>
							: parse(elem.content)
						}
					</div>}
					<div>
						<Rate disabled allowHalf defaultValue={rate} />
					</div>

					{!isMobile
						? <Instructions mode={mode} recipe={elem} steps={steps} />
						: null
					}
				</div>
			</div>
			<div className="flex flex-col gap-6">
				<div className="xl:hidden">
					<Radio.Group
						options={menu}
						onChange={this.handleChangeContext}
						value={context}
						optionType="button"
						buttonStyle="solid"
					/>
				</div>
				<div className="hidden xl:block">
					<Radio.Group
						options={menuTiny}
						onChange={this.handleChangeContext}
						value={context}
						optionType="button"
						buttonStyle="solid"
					/>
				</div>

				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						{(mode || elem.durationPrepare) ? <div className="bg-white rounded-md border p-4">
							{mode
								? <div className="flex flex-col gap-4">
									<div>
										<Input identifiant="durationPrepare" valeur={durationPrepare} placeholder="00h00 préparation" {...paramsInput0}>
											Temps de préparation
										</Input>
									</div>
									{loadData
										? <Button type="blue" icon='chart-3' />
										: <Button type="blue" icon='check1'
												  onClick={(e) => this.handleSubmit(e, 'time', 'durationPrepare')}>
											Enregistrer
										</Button>
									}
								</div>
								: <div className="flex items-center gap-2">
									<span className="icon-time"></span>
									<span>{Sanitaze.toFormatDuration(Sanitaze.toDateFormat(elem.durationPrepare, 'LT', '', false))} de préparation</span>
								</div>
							}
						</div> : null}
						{(mode || elem.durationCooking) ? <div className="bg-white rounded-md border p-4">
							{mode
								? <div className="flex flex-col gap-4">
									<div>
										<Input identifiant="durationCooking" valeur={durationCooking} placeholder="00h00 cuisson" {...paramsInput0}>
											Temps de cuisson
										</Input>
									</div>
									{loadData
										? <Button type="blue" icon='chart-3' />
										: <Button type="blue" icon='check1'
												  onClick={(e) => this.handleSubmit(e, 'time', 'durationCooking')}>
											Enregistrer
										</Button>
									}
								</div>
								: <div className="flex items-center gap-2">
									<span className="icon-time"></span>
									<span>{Sanitaze.toFormatDuration(Sanitaze.toDateFormat(elem.durationCooking, 'LT', '', false))} de cuisson</span>
								</div>
							}
						</div> : null}
						{(mode || elem.nbPerson) ? <div className="bg-white rounded-md border p-4">
							{mode
								? <div className="flex flex-col gap-4">
									<div>
										<Input identifiant="nbPerson" valeur={nbPerson} placeholder="Pour combien de pers." {...paramsInput0}>
											Nombre de personnes
										</Input>
									</div>
									{loadData
										? <Button type="blue" icon='chart-3' />
										: <Button type="blue" icon='check1'
													  onClick={(e) => this.handleSubmit(e, 'text', 'nbPerson')}>
											Enregistrer
										</Button>
									}
								</div>
								: <div className="flex items-center gap-2">
									<span className="icon-group"></span>
									<span>{nbPerson} personnes</span>
								</div>
							}
						</div> : null}
						{(mode || elem.difficulty) ? <div className="bg-white rounded-md border p-4">
							{mode
								? <div>
									<Radiobox items={difficultyItems} identifiant="difficulty" valeur={difficulty} {...paramsInput0} classItems="flex gap-2">
										Difficulté
									</Radiobox>
								</div>
								: <div className="flex items-center gap-2">
									<span className="icon-flash"></span>
									<span>Difficulté {elem.difficultyString.toLowerCase()}</span>
								</div>
							}
						</div> : null}
					</div>

					<div>
						<h2 className="mb-2 font-semibold text-xl">{_.capitalize(context)}</h2>
						<div>
							{content}
						</div>
					</div>
				</div>
			</div>

		</div>
	}
}

RecipeRead.propTypes = {
	elem: PropTypes.object.isRequired,
	steps: PropTypes.array.isRequired,
	ingre: PropTypes.array.isRequired,
	coms: PropTypes.array.isRequired,
}
