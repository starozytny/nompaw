import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Sanitaze from "@commonFunctions/sanitaze";
import Propals from "@userFunctions/propals";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Input, Radiobox } from "@tailwindComponents/Elements/Fields";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_CREATE_PROPAL = 'intern_api_projects_lifestyle_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_lifestyle_update';
const URL_DELETE_PROPAL = 'intern_api_projects_lifestyle_delete';
const URL_UPDATE_PROJECT = 'intern_api_projects_update_text';

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
			texteLifestyle: { value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte) },
			textLifestyle: Formulaire.setValue(props.texte),
			errors: [],
			data: JSON.parse(props.donnees),
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

	handleSubmitText = (e) => {
		e.preventDefault();

		const { projectId } = this.props;
		const { texteLifestyle } = this.state;

		const self = this;
		this.formText.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
		axios({
			method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, { 'type': 'lifestyle', 'id': projectId }),
			data: { texte: texteLifestyle }
		})
			.then(function (response) {
				self.formText.current.handleClose();

				let data = response.data;
				self.setState({
					texteLifestyle: { value: Formulaire.setValue(data.textLifestyle), html: Formulaire.setValue(data.textLifestyle) },
					textLifestyle: Formulaire.setValue(data.textLifestyle),
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

	render () {
		const { userId } = this.props;
		const { errors, name, unit, price, priceType, data, element, texteLifestyle, textLifestyle } = this.state;

		let params = { errors: errors, onChange: this.handleChange }
		let totalPrice = 0;

		let pricesType = [
			{ value: 0, label: 'par pers.', identifiant: 'life-price-type-0' },
			{ value: 1, label: 'fixe', identifiant: 'life-price-type-1' },
		]

		if (!userId && data.length === 0 && textLifestyle === "") {
			return null;
		}

		return <div className="bg-white border rounded-md max-w-screen-lg">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md flex justify-between gap-2">
                <div className="font-semibold text-xl">✨ Style de vie</div>
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
                {textLifestyle
                    ? <div className="pb-4 mb-4 border-b text-gray-600">
                        <div dangerouslySetInnerHTML={{ __html: textLifestyle }}></div>
                    </div>
                    : null
                }
                <div className="flex flex-col gap-2">
                    {data.map((el, index) => {

                        totalPrice += el.price ? el.price : 0;

                        return <div className="flex items-center justify-between gap-2" key={index}>
                            <div>
                                <div className="font-medium">
                                    <span>{el.name}</span> <span>{el.unit ? "(" + el.unit + ")" : ""}</span>
                                </div>
                                <div className="text-gray-600 text-sm">
                                    {el.price ? Sanitaze.toFormatCurrency(el.price) + (el.priceType === 0 ? " / pers" : "") : ""}
                                </div>
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
                </div>


                {userId
                    ? <div className="mt-4 flex justify-end">
                        <Button type="blue" iconLeft="add"
                                onClick={() => this.handleModal('formPropal', 'create', null)}
                        >
                            Ajouter une dépense
                        </Button>
                    </div>
                    : null
                }
            </div>

            <div className="flex flex-col gap-2 justify-center items-center p-4 bg-color0/10 rounded-b-md">
                <div className="text-xl font-bold text-yellow-500">
                    {Sanitaze.toFormatCurrency(totalPrice)}
                </div>
            </div>

            <Modal ref={this.formText} identifiant="form-lifestyle-text" maxWidth={768} title="Modifier le texte"
                   content={<div>
                       <TinyMCE type={8} identifiant="texteLifestyle" valeur={texteLifestyle.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                           Texte
                       </TinyMCE>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formPropal} identifiant="form-lifestyle" maxWidth={568} title="Ajouter une dépense"
                   content={<div className="flex flex-col gap-4">
                       <div className="flex flex-col gap-4 sm:flex-row">
                           <div class="w-full">
                               <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
                           </div>
                           <div class="w-full">
                               <Input identifiant="unit" valeur={unit} {...params}>Unité</Input>
                           </div>
                           <div class="w-full">
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

            <Modal ref={this.deletePropal} identifiant='delete-lifestyle' maxWidth={414} title="Supprimer"
                   content={<p>Êtes-vous sûr de vouloir supprimer <b>{element ? element.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

ProjectLifestyle.propTypes = {
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
