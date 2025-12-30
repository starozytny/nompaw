import React, { Component } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Propals from "@userFunctions/propals";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Button } from "@tailwindComponents/Elements/Button";
import { Input, InputFile, Radiobox, TextArea } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_projects_propals_activity_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_propals_activity_update';
const URL_DELETE_PROPAL = 'intern_api_projects_propals_activity_delete';

export class ProjectActivities extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			propal: null,
			name: '',
			url: 'https://',
			price: '',
			priceType: 0,
			imageFile: '',
			description: '',
			errors: [],
			data: props.activities
		}

		this.file = React.createRef();

		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "price") {
			value = Inputs.textMoneyMinusInput(value, this.state[name])
		}

		this.setState({ [name]: value })
	}

	handleModal = (identifiant, context, propal) => {
		modalFormPropal(this);
		modalDeletePropal(this);
		this.setState({
			context: context, propal: propal,
			name: propal ? propal.name : "",
			url: propal ? Formulaire.setValue(propal.url) : "https://",
			price: propal ? Formulaire.setValue(propal.price) : "",
			priceType: propal ? Formulaire.setValue(propal.priceType) : 0,
			imageFile: propal ? Formulaire.setValue(propal.imageFile) : "",
			description: propal ? Formulaire.setValue(propal.description) : "",
		})
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { projectId } = this.props;
		const { context, propal, name, url, price, priceType, description, data } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [{ type: "text", id: 'name', value: name }];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let urlName = context === "create"
				? Routing.generate(URL_CREATE_PROPAL, { 'project': projectId })
				: Routing.generate(URL_UPDATE_PROPAL, { 'project': projectId, 'id': propal.id })

			let formData = new FormData();
			formData.append("data", JSON.stringify({ name: name, url: url, price: price, priceType: priceType, description: description }));

			let file = this.file.current;
			if (file.state.files.length > 0) {
				formData.append("image", file.state.files[0]);
			}

			const self = this;
			this.formPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
			axios({ method: "POST", url: urlName, data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
				.then(function (response) {
					self.formPropal.current.handleClose();

					let nData = Propals.updateList(context, data, response);

					self.setState({ data: nData })
					self.props.onUpdateData(nData);
				})
				.catch(function (error) {
					modalFormPropal(self);
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
			;
		}
	}

	handleDeletePropal = () => {
		const { propal, data } = this.state;

		this.deletePropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		Propals.deletePropal(this, this.deletePropal, propal, data, URL_DELETE_PROPAL, modalDeletePropal);
	}

	render () {
		const { userId } = this.props;
		const { errors, name, url, price, priceType, description, data, propal, imageFile } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		let pricesType = [
			{ value: 0, label: 'par pers.', identifiant: 'act-price-type-0' },
			{ value: 1, label: 'fixe', identifiant: 'act-price-type-1' },
		]

		if (!userId && data.length === 0) {
			return null;
		}

		return <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-800">
					<span className="icon-box !font-semibold text-xl"></span>
					<span className="ml-2">Activités</span>
				</h3>
				{userId
					? <button onClick={() => this.handleModal('formPropal', 'create', null)}
							  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
					>
						+ Ajouter
					</button>
					: null
				}
			</div>
			<div className="space-y-3">
				{data.map((activity, idx) => {
					let descriptionFormatted = activity.description ? activity.description.replaceAll("\n", "<br />") : null;

					return <div key={idx} className="group flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
						<div className="w-[calc(100%-2.5rem-3rem-24px)] md:w-[calc(100%-6rem-3rem-24px)] flex items-center space-x-3">
							<div className="h-14 w-14 overflow-hidden rounded-md bg-gray-300">
								<img src={activity.imageFile} alt={"illustration " + activity.name} className="h-full w-full object-cover" />
							</div>
							<div>
								<div className="text-sm font-medium text-slate-700">
									{activity.name}
									{(activity.url && activity.url !== "https://")
										? <a href={activity.url} className="url-topo relative text-blue-700 ml-2" target="_blank">
											<span className="icon-link"></span>
											<span className="tooltip bg-gray-800 text-slate-50 py-1 px-2 rounded absolute -top-7 right-0 text-xs hidden"
												  style={{ width: '84px' }}
											> Lien externe</span>
										</a>
										: null
									}
								</div>

								{descriptionFormatted
									? <div className="text-gray-600 text-xs mt-2">
										<div dangerouslySetInnerHTML={{ __html: descriptionFormatted }}></div>
									</div>
									: null
								}
							</div>
						</div>

						<div className="w-10 md:w-24 text-sm text-right">
							<div className="font-semibold text-emerald-600">{activity.price} € {(activity.priceType === 0 ? " / pers" : "")}</div>
						</div>

						{userId
							? <div className="w-12 flex opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
								<button onClick={() => this.handleModal("formPropal", "update", activity)}
										className="px-1 pt-2 pb-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
								>
									<span className="icon-pencil"></span>
								</button>
								<button onClick={() => this.handleModal("deletePropal", "delete", activity)}
										className="px-1 pt-2 pb-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
								>
									<span className="icon-close"></span>
								</button>
							</div>
							: null
						}
					</div>
				})}

				<div className="pt-3 border-t border-slate-200">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-slate-600">Total activités</span>
						<span className="text-sm font-bold text-emerald-600">
							{data.reduce((sum, a) => sum + a.price, 0)} €
						</span>
					</div>
				</div>
			</div>

			{createPortal(
				<Modal ref={this.formPropal} identifiant="form-activities" maxWidth={568} margin={10} title="Proposer une activité"
					   content={<div className="flex flex-col gap-4">
						   <div className="flex flex-col gap-4 sm:flex-row">
							   <div className="w-full">
								   <Input identifiant="name" valeur={name} {...params}>Nom de l'activité</Input>
							   </div>
							   <div className="w-full">
								   <Input identifiant="price" valeur={price} {...params}>Prix</Input>
							   </div>
							   <div className="w-full">
								   <Radiobox items={pricesType} identifiant="priceType" valeur={priceType} {...params}>
									   Type de prix
								   </Radiobox>
							   </div>
						   </div>
						   <div>
							   <Input identifiant="url" valeur={url} {...params}>Lien externe</Input>
						   </div>
						   <div>
							   <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
										  placeholder="Glissez et déposer une image" {...params}>
								   Illustration
							   </InputFile>
						   </div>
						   <div>
							   <TextArea identifiant="description" valeur={description} {...params}>Description</TextArea>
						   </div>
					   </div>}
					   footer={null} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(
				<Modal ref={this.deletePropal} identifiant='delete-propal-activities' maxWidth={414} title="Supprimer l'activité"
					   content={<p>Êtes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
					   footer={null} closeTxt="Annuler" />
				, document.body
			)}
		</div>
    }
}

function modalFormPropal (self) {
	self.formPropal.current.handleUpdateFooter(<Button type="blue" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}

function modalDeletePropal (self) {
	self.deletePropal.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
