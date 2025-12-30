import React, { Component } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Propals from "@userFunctions/propals";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { Button } from "@tailwindComponents/Elements/Button";

const URL_CREATE_PROPAL = 'intern_api_projects_todos_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_todos_update';
const URL_DELETE_PROPAL = 'intern_api_projects_todos_delete';

export class ProjectTodos extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			element: null,
			name: '',
			errors: [],
			data: props.todos,
			todosChecked: []
		}

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
		})
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { projectId } = this.props;
		const { context, element, name, data } = this.state;

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
			axios({ method: method, url: urlName, data: { name: name } })
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

	handleCheck = (id) => {
		const { todosChecked } = this.state;

		let nData = [];
		if (todosChecked.includes(id)) {
			nData = todosChecked.filter(d => {
				return d !== id
			})
		} else {
			nData = todosChecked;
			nData.push(id);
		}

		this.setState({ todosChecked: nData });
	}


	render () {
		const { userId } = this.props;
		const { errors, name, data, element, todosChecked } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		if (!userId && data.length === 0) {
			return null;
		}

		return <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-slate-800">
					<span className="icon-check !font-bold text-xl"></span>
					<span className="ml-2">Choses à préparer</span>
				</h3>
				{userId
					? <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
							  onClick={() => this.handleModal('formPropal', 'create', null)}
					>
						+ Ajouter
					</button>
					: null
				}
			</div>

			<div className="space-y-2">
				{data.map((todo, idx) => {
					return <div
						key={idx}
						className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
					>
						<div className="flex items-center space-x-3">
							<input
								type="checkbox"
								checked={todosChecked.includes(todo.id)}
								onChange={() => this.handleCheck(todo.id)}
								className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
							/>
							<span className={`${todosChecked.includes(todo.id) ? 'line-through text-slate-400' : 'text-slate-700'} text-sm`}>{todo.name}</span>
						</div>
						{userId
							? <button onClick={() => this.handleModal("deletePropal", "delete", todo)}
									  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 pt-2 pb-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
							>
								<span className="icon-close"></span>
							</button>
							: null
						}
					</div>
				})}
			</div>

			<div className="mt-6 pt-6 border-t border-slate-200">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium text-slate-700">Progression</span>
					<span className="text-sm font-semibold text-slate-800">{todosChecked.filter(t => t).length} / {data.length}</span>
				</div>
				<div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
					<div
						className="h-2 bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
						style={{ width: `${(todosChecked.filter(t => t).length / data.length) * 100}%` }}
					/>
				</div>
			</div>

			{createPortal(
				<Modal ref={this.formPropal} identifiant="form-todos" maxWidth={414} title="Ajouter quelque chose"
					   content={<div>
						   <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
					   </div>}
					   footer={null} closeTxt="Annuler" />
				, document.body
			)}

			{createPortal(
				<Modal ref={this.deletePropal} identifiant='delete-todos' maxWidth={414} title="Supprimer"
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
