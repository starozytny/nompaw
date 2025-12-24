import React, { Component } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Propals from "@userFunctions/propals";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Button } from "@tailwindComponents/Elements/Button";
import { Input, Radiobox } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_projects_lifestyle_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_lifestyle_update';
const URL_DELETE_PROPAL = 'intern_api_projects_lifestyle_delete';

export class ProjectLifestyle extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			element: null,
			name: '',
			unit: '',
			price: '',
			priceType: 0,
			errors: [],
			data: JSON.parse(props.lifestyles),
		}

		this.formText = React.createRef();
		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleModal = (identifiant, context, element) => {
		modalFormPropal(this);
		modalDeletePropal(this);
		this.setState({
			context: context, element: element,
			name: element ? element.name : "",
			unit: element ? Formulaire.setValue(element.unit) : "",
			price: element ? Formulaire.setValue(element.price) : "",
			priceType: element ? Formulaire.setValue(element.priceType) : 0,
		})
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { projectId } = this.props;
		const { context, element, name, unit, price, priceType, data } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [{ type: "text", id: 'name', value: name }];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let method = context === "create" ? "POST" : "PUT";
			let urlName = context === "create"
				? Routing.generate(URL_CREATE_PROPAL, { 'project': projectId })
				: Routing.generate(URL_UPDATE_PROPAL, { 'project': projectId, 'id': element.id })

			const self = this;
			this.formPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
			axios({ method: method, url: urlName, data: { name: name, unit: unit, price: price, priceType: priceType } })
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
		const { element, data } = this.state;

		this.deletePropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		Propals.deletePropal(this, this.deletePropal, element, data, URL_DELETE_PROPAL, modalDeletePropal);
	}

	render () {
		const { userId } = this.props;
		const { errors, name, unit, price, priceType, data, element } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		let pricesType = [
			{ value: 0, label: 'par pers.', identifiant: 'life-price-type-0' },
			{ value: 1, label: 'fixe', identifiant: 'life-price-type-1' },
		]

		if (!userId && data.length === 0) {
			return null;
		}

		return <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-800">
					<span className="icon-flash !font-semibold text-xl"></span>
					<span className="ml-2">Style de vie</span>
				</h3>
				<button onClick={() => this.handleModal('formPropal', 'create', null)}
						className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
				>
					+ Ajouter
				</button>
			</div>
			<div className="space-y-3">
				{data.map((item, idx) => {
					return <div key={idx} className="group flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
						<div className="w-[calc(100%-6rem-3rem-24px)] flex items-center space-x-3">
							<div>
								<div className="text-sm font-medium text-slate-700">
									{item.name} <span>{item.unit ? "(" + item.unit + ")" : ""}</span>
								</div>
							</div>
						</div>

						<div className="w-24 text-sm text-right">
							<div className="font-semibold text-amber-600">{item.price} € {(item.priceType === 0 ? " / pers" : "")}</div>
						</div>

						<div className="w-12 flex opacity-0 group-hover:opacity-100 transition-opacity">
							<button onClick={() => this.handleModal("formPropal", "update", item)}
									className="px-1 pt-2 pb-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
							>
								<span className="icon-pencil"></span>
							</button>
							<button onClick={() => this.handleModal("deletePropal", "delete", item)}
									className="px-1 pt-2 pb-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
							>
								<span className="icon-close"></span>
							</button>
						</div>
					</div>
				})}

				<div className="pt-3 border-t border-slate-200">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-slate-600">Total des dépenses</span>
						<span className="text-sm font-bold text-amber-600">
							{data.reduce((sum, a) => sum + a.price, 0)} €
						</span>
					</div>
				</div>
			</div>

			{createPortal(
				<Modal ref={this.formPropal} identifiant="form-lifestyle" maxWidth={568} title="Ajouter une dépense"
					   content={<div className="flex flex-col gap-4">
						   <div className="flex flex-col gap-4 sm:flex-row">
							   <div className="w-full">
								   <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
							   </div>
							   <div className="w-full">
								   <Input identifiant="unit" valeur={unit} {...params}>Unité</Input>
							   </div>
							   <div className="w-full">
								   <Input identifiant="price" valeur={price} {...params}>Prix</Input>
							   </div>
						   </div>
						   <div>
							   <Radiobox items={pricesType} identifiant="priceType" valeur={priceType} {...params}>
								   Type de prix
							   </Radiobox>
						   </div>
					   </div>}
					   footer={null} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(
				<Modal ref={this.deletePropal} identifiant='delete-lifestyle' maxWidth={414} title="Supprimer"
					   content={<p>Êtes-vous sûr de vouloir supprimer <b>{element ? element.name : ""}</b> ?</p>}
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
