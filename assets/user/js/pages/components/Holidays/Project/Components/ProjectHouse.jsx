import React, { Component } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Propals from "@userFunctions/propals";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";

const URL_CREATE_PROPAL = 'intern_api_projects_propals_house_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_propals_house_update';
const URL_DELETE_PROPAL = 'intern_api_projects_propals_house_delete';

export class ProjectHouse extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			propal: null,
			name: '',
			url: 'https://',
			price: '',
			nbNights: '1',
			localisation: '',
			errors: [],
			data: JSON.parse(props.houses)
		}

		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "price") {
			value = Inputs.textMoneyMinusInput(value, this.state[name])
		}

		if (name === "nbNights") {
			value = Inputs.textNumericInput(value, this.state[name])
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
			nbNights: propal ? Formulaire.setValue(propal.nbNights) : 1,
			localisation: propal ? Formulaire.setValue(propal.localisation) : "",
		})
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { projectId } = this.props;
		const { context, propal, name, url, price, nbNights, localisation, data } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'name', value: name },
			{ type: "text", id: 'price', value: price },
			{ type: "text", id: 'nbNights', value: nbNights },
			{ type: "text", id: 'localisation', value: localisation },
		];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let method = context === "create" ? "POST" : "PUT";
			let urlName = context === "create"
				? Routing.generate(URL_CREATE_PROPAL, { 'project': projectId })
				: Routing.generate(URL_UPDATE_PROPAL, { 'project': projectId, 'id': propal.id })

			const self = this;
			this.formPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="primary">Confirmer</Button>);
			axios({ method: method, url: urlName, data: { name: name, url: url, price: price, nbNights: nbNights, localisation: localisation } })
				.then(function (response) {
					self.formPropal.current.handleClose();
					self.setState({ data: Propals.updateList(context, data, response) })
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
		const { errors, name, url, price, nbNights, localisation, data, propal } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		if (!userId && data.length === 0) {
			return null;
		}

		return <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-800 flex items-center">
					<span className="icon-home !font-bold text-xl"></span>
					<span className="ml-2">Hébergement</span>
				</h3>
				<button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
						onClick={() => this.handleModal('formPropal', 'create', null)}
				>
					+ Ajouter
				</button>
			</div>
			<div className="space-y-3">
				{data.map((acc, idx) => (
					<div key={idx} className="group flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
						<div className="w-[calc(100%-2.5rem-3rem-24px)] md:w-[calc(100%-6rem-3rem-24px)] font-medium flex flex-col">
							<div className="flex items-center gap-2 text-slate-800">
								<span>{acc.name}</span>
								{(acc.url && acc.url !== "https://") && <a href={acc.url} className="url-topo relative text-blue-700" target="_blank">
									<span className="icon-link"></span>
									<span className="tooltip bg-gray-300 py-1 px-2 rounded absolute -top-7 right-0 text-xs text-gray-600 hidden">Lien externe</span>
								</a>}
							</div>
							{acc.localisation
								? <div className="flex items-center text-xs text-slate-600">
									<span className="icon-placeholder"></span>
									<span className="ml-1">{acc.localisation}</span>
								</div>
								: null
							}
						</div>
						<div className="w-10 md:w-24 flex flex-col justify-end items-center text-sm text-right">
							<div className="text-slate-600">{acc.nbNights} nuits</div>
							<div className="font-semibold text-purple-600 ml-2">{acc.price.toFixed(2)} €</div>
						</div>
						<div className="w-12 flex opacity-100 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
							<button onClick={() => this.handleModal("formPropal", "update", acc)}
									className="px-1 pt-2 pb-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
							>
								<span className="icon-pencil"></span>
							</button>
							<button onClick={() => this.handleModal("deletePropal", "delete", acc)}
									className="px-1 pt-2 pb-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
							>
								<span className="icon-close"></span>
							</button>
						</div>
					</div>
				))}

				<div className="pt-3 border-t border-slate-200">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-slate-600">Total hébergements</span>
						<span className="text-sm font-bold text-purple-600">
							{data.reduce((sum, a) => sum + a.price, 0)} €
						</span>
					</div>
				</div>
			</div>


			{createPortal(
				<Modal ref={this.formPropal} identifiant="form-house" maxWidth={568} title="Proposer un hébergement"
					   content={<div className="flex flex-col gap-4">
						   <div className="flex gap-4">
							   <div className="w-full">
								   <Input identifiant="name" valeur={name} {...params}>Nom de l'hébergement</Input>
							   </div>
							   <div className="w-full">
								   <Input identifiant="localisation" valeur={localisation} {...params}>Localisation</Input>
							   </div>
						   </div>
						   <div className="flex gap-4">
							   <div className="w-full">
								   <Input identifiant="nbNights" valeur={nbNights} {...params}>Nombre de nuits</Input>
							   </div>
							   <div className="w-full">
								   <Input identifiant="price" valeur={price} {...params}>Prix total</Input>
							   </div>
						   </div>
						   <div>
							   <Input identifiant="url" valeur={url} {...params}>Lien externe</Input>
						   </div>
					   </div>}
					   footer={null} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(
				<Modal ref={this.deletePropal} identifiant='delete-propal-house' maxWidth={414} title="Supprimer l'hébergement"
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
