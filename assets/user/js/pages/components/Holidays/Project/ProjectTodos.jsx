import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Propals from "@userFunctions/propals";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";

const URL_CREATE_PROPAL = 'intern_api_projects_todos_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_todos_update';
const URL_DELETE_PROPAL = 'intern_api_projects_todos_delete';
const URL_UPDATE_PROJECT = 'intern_api_projects_update_text';

export class ProjectTodos extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			element: null,
			name: '',
			texteTodos: { value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte) },
			textTodos: Formulaire.setValue(props.texte),
			errors: [],
			data: JSON.parse(props.donnees),
			todosChecked: []
		}

		this.formText = React.createRef();
		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
	}

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleModal = (identifiant, context, element) => {
		modalFormText(this);
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

	handleSubmitText = (e) => {
		e.preventDefault();

		const { projectId } = this.props;
		const { texteTodos } = this.state;

		const self = this;
		this.formText.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
		axios({
			method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, { 'type': 'todos', 'id': projectId }),
			data: { texte: texteTodos }
		})
			.then(function (response) {
				self.formText.current.handleClose();

				let data = response.data;
				self.setState({
					texteTodos: { value: Formulaire.setValue(data.textTodos), html: Formulaire.setValue(data.textTodos) },
					textTodos: Formulaire.setValue(data.textTodos),
				})
			})
			.catch(function (error) {
				modalFormText(self);
				Formulaire.displayErrors(self, error);
				Formulaire.loader(false);
			})
		;
	}

	handleDeletePropal = () => {
		const { element, data } = this.state;

		this.deletePropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		Propals.deletePropal(this, this.deletePropal, element, data, URL_DELETE_PROPAL, modalDeletePropal);
	}

	handleCheck = (name) => {
		const { todosChecked } = this.state;

		let nData = [];
		if (todosChecked.includes(name)) {
			nData = todosChecked.filter(d => {
				return d !== name
			})
		} else {
			nData = todosChecked;
			nData.push(name);
		}

		this.setState({ todosChecked: nData });
	}

	render () {
		const { userId } = this.props;
		const { errors, name, data, element, todosChecked, texteTodos, textTodos } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		if (!userId && data.length === 0 && textTodos === "") {
			return null;
		}

		return <div className="bg-white border rounded-md max-w-screen-lg">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md flex justify-between gap-2">
                <div className="font-semibold text-xl">⚒️ Liste des choses à prendre</div>
				{userId
					? <div>
						<Button type="default" iconLeft="pencil" onClick={() => this.handleModal("formText")}>
                            Modifier
                        </Button>
					</div>
					: null
				}
			</div>
            <div className="p-4">
                {textTodos
                    ? <div className="propal propal-text">
                        <div dangerouslySetInnerHTML={{ __html: textTodos }}></div>
                    </div>
                    : null
                }
                <div className="flex flex-col gap-2">
                    {data.map((el, index) => {

                        let onVote = () => this.handleCheck(el.name);

                        let active = "";
                        todosChecked.forEach(v => {
                            if (v === el.name) {
                                active = " active"
                            }
                        })

                        return <div className="flex items-center justify-between gap-2" key={index}>
                            <div className="font-medium" onClick={onVote}>
                                <span>{el.name}</span>
                            </div>
                            {userId
                                ? <div className="flex gap-2">
                                    <ButtonIcon icon="pencil" type="yellow" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                    <ButtonIcon icon="trash" type="red" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                                </div>
                                : null
                            }
                        </div>
                    })}

                    {userId
                        ? <div className="mt-4 flex justify-end">
                            <Button type="blue" iconLeft="add"
                                        onClick={() => this.handleModal('formPropal', 'create', null)}
                            >
                                Ajouter quelque chose
                            </Button>
                        </div>
                        : null
                    }
                </div>
            </div>

            <Modal ref={this.formText} identifiant="form-todos-text" maxWidth={768} title="Modifier le texte"
				   content={<div>
                       <TinyMCE type={8} identifiant="texteTodos" valeur={texteTodos.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                           Texte
                       </TinyMCE>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formPropal} identifiant="form-todos" maxWidth={414} title="Ajouter quelque chose"
                   content={<div>
                       <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-todos' maxWidth={414} title="Supprimer"
				   content={<p>Êtes-vous sûr de vouloir supprimer <b>{element ? element.name : ""}</b> ?</p>}
				   footer={null} closeTxt="Annuler" />
		</div>
	}
}

ProjectTodos.propTypes = {
	projectId: PropTypes.string.isRequired,
	donnees: PropTypes.string.isRequired,
}

function modalFormText (self) {
	self.formText.current.handleUpdateFooter(<Button type="blue" onClick={self.handleSubmitText}>Confirmer</Button>)
}

function modalFormPropal (self) {
	self.formPropal.current.handleUpdateFooter(<Button type="blue" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}

function modalDeletePropal (self) {
	self.deletePropal.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
