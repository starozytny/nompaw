import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Inputs from "@commonFunctions/inputs";
import Sanitaze from "@commonFunctions/sanitaze";
import Propals from "@userFunctions/propals";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Input, InputFile, Radiobox, TextArea } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_projects_propals_activity_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_propals_activity_update';
const URL_DELETE_PROPAL = 'intern_api_projects_propals_activity_delete';
const URL_VOTE_PROPAL = 'intern_api_projects_propals_activity_vote';
const URL_END_PROPAL = 'intern_api_projects_propals_activity_end';
const URL_CANCEL_PROPAL = 'intern_api_projects_propals_activity_cancel';
const URL_UPDATE_PROJECT = 'intern_api_projects_update_text';

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
			texteActivities: { value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte) },
			textActivities: Formulaire.setValue(props.texte),
			description: '',
			errors: [],
			data: JSON.parse(props.propals),
			loadData: false,
		}

		this.file = React.createRef();

		this.formText = React.createRef();
		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
		this.endPropal = React.createRef();
		this.cancelPropal = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "price") {
			value = Inputs.textMoneyMinusInput(value, this.state[name])
		}

		this.setState({ [name]: value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleModal = (identifiant, context, propal) => {
		modalFormText(this);
		modalFormPropal(this);
		modalDeletePropal(this);
		modalEndPropal(this);
		modalCancelPropal(this);
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
		const { texteActivities } = this.state;

		const self = this;
		this.formText.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
		axios({
			method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, { 'type': 'activities', 'id': projectId }),
			data: { texte: texteActivities }
		})
			.then(function (response) {
				self.formText.current.handleClose();

				let data = response.data;
				self.setState({
					texteActivities: { value: Formulaire.setValue(data.textActivities), html: Formulaire.setValue(data.textActivities) },
					textActivities: Formulaire.setValue(data.textActivities),
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
		const { propal, data } = this.state;

		this.deletePropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		Propals.deletePropal(this, this.deletePropal, propal, data, URL_DELETE_PROPAL, modalDeletePropal);
	}

	handleVote = (propal) => {
		const { userId } = this.props;
		const { loadData, data } = this.state;

		Propals.vote(this, propal, data, userId, loadData, URL_VOTE_PROPAL);
	}

	handleEndPropal = () => {
		const { propal } = this.state;

		this.endPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="green">Valider</Button>);
		Propals.endPropal(this, propal, URL_END_PROPAL, modalEndPropal);
	}

	handleCancelPropal = () => {
		const { propal } = this.state;

		this.cancelPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer l'annulation</Button>);
		Propals.cancel(this, propal.id, URL_CANCEL_PROPAL, modalCancelPropal);
	}

	render () {
		const { mode, userId } = this.props;
		const { errors, loadData, name, url, price, priceType, description, data, propal, imageFile, texteActivities, textActivities } = this.state;

		let params = { errors: errors, onChange: this.handleChange }
		let totalPrice = 0;

		let pricesType = [
			{ value: 0, label: 'par pers.', identifiant: 'act-price-type-0' },
			{ value: 1, label: 'fixe', identifiant: 'act-price-type-1' },
		]

		if (!userId && data.length === 0 && textActivities === "") {
			return null;
		}

		return <div className="bg-white border rounded-md max-w-screen-lg">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md flex justify-between gap-2">
                <div className="font-semibold text-xl">💡 Activités</div>
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
                {textActivities
                    ? <div className="pb-4 mb-4 border-b text-gray-600">
                        <div dangerouslySetInnerHTML={{ __html: textActivities }}></div>
                    </div>
                    : null
                }
                <div className="flex flex-col gap-2">
                    {data.map((el, index) => {

                        let onVote = el.isSelected ? null : () => this.handleVote(el);

                        let active = false;
                        el.votes.forEach(v => {
                            if (v === userId) {
                                active = true;
                            }
                        })

                        totalPrice += el.isSelected && el.price ? el.price : 0;

                        let descriptionFormatted = el.description ? el.description.replaceAll("\n", "<br />") : null;

                        return <div className="flex items-center justify-between gap-2" key={index}>

                            <div className="flex items-center gap-2 group">
                                <div className={`cursor-pointer w-6 h-6 border-2 rounded-md ring-1 flex items-center justify-center ${active ? "bg-blue-700 ring-blue-700" : "bg-white ring-gray-100 group-hover:bg-blue-100"}`}
                                     onClick={onVote}>
                                    <span className={`icon-check1 text-sm ${active ? "text-white" : "text-transparent"}`}></span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-40 w-40 overflow-hidden rounded-md bg-gray-100" onClick={onVote}>
                                        <img src={el.imageFile} alt={"illustration " + el.name} className="h-40 object-contain" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <div className="font-medium" onClick={onVote}>{el.name}</div>
                                            {(el.url && el.url !== "https://") && <a href={el.url} className="url-topo relative text-blue-700" target="_blank">
                                                <span className="icon-link"></span>
                                                <span className="tooltip bg-gray-300 py-1 px-2 rounded absolute -top-7 right-0 text-xs text-gray-600 hidden" style={{ width: '84px' }}>
													Lien externe
												</span>
                                            </a>}
                                        </div>
                                        <div className="text-gray-600 text-sm" onClick={onVote}>
                                            {el.price ? Sanitaze.toFormatCurrency(el.price) + (el.priceType === 0 ? " / pers" : "") : ""}
                                        </div>
                                        {descriptionFormatted && <div className="text-gray-600 text-sm mt-2" onClick={onVote}>
                                            <div dangerouslySetInnerHTML={{ __html: descriptionFormatted }}></div>
                                        </div>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex gap-2">
                                    <div className="flex gap-1">
                                        {mode || el.author.id === parseInt(userId)
                                            ? <>
                                                {!el.isSelected && <>
                                                    <ButtonIcon icon="pencil" type="yellow" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                                    <ButtonIcon icon="trash" type="red" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                                                </>}
                                                {mode && <>
                                                    {el.isSelected
                                                        ? <ButtonIcon icon="close" type="default" onClick={() => this.handleModal('cancelPropal', 'delete', el)}>Annuler</ButtonIcon>
                                                        : <ButtonIcon icon="check1" type="green" onClick={() => this.handleModal("endPropal", "update", el)}>Valider</ButtonIcon>
                                                    }
                                                </>}
                                            </>
                                            : null
                                        }
                                    </div>
                                    <div className={`${el.isSelected ? "bg-blue-200" : "bg-gray-200"} px-2 py-0.5 text-xs rounded-md flex items-center justify-center`} onClick={onVote}>
                                        {loadData
                                            ? <span className="icon-chart-3" />
                                            : `+ ${el.votes.length}`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    })}

                    {userId
                        ? <div className="mt-4 flex justify-end">
                            <Button type="blue" iconLeft="add"
                                    onClick={() => this.handleModal('formPropal', 'create', null)}
                            >
                                Proposer une activité
                            </Button>
                        </div>
                        : null
                    }

                </div>
            </div>

            <div className="flex flex-col gap-2 justify-center items-center p-4 bg-color0/10 rounded-b-md">
                <div className="text-xl font-bold text-yellow-500">
                    {Sanitaze.toFormatCurrency(totalPrice)}
                </div>
            </div>

            <Modal ref={this.formText} identifiant="form-activities-text" maxWidth={768} title="Modifier le texte"
                   content={<div className="line">
                       <TinyMCE type={8} identifiant="texteActivities" valeur={texteActivities.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                           Texte
                       </TinyMCE>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formPropal} identifiant="form-activities" maxWidth={568} margin={10} title="Proposer une activité"
                   content={<div className="flex flex-col gap-4">
                       <div className="flex flex-col gap-4 sm:flex-row">
                           <div class="w-full">
                               <Input identifiant="name" valeur={name} {...params}>Nom de l'activité</Input>
                           </div>
                           <div class="w-full">
                               <Input identifiant="price" valeur={price} {...params}>Prix</Input>
                           </div>
                           <div class="w-full">
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

            <Modal ref={this.deletePropal} identifiant='delete-propal-activities' maxWidth={414} title="Supprimer l'activité"
                   content={<p>Êtes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-propal-activities' maxWidth={414} title="Sélectionner une activité validée"
                   content={<p>Êtes-vous sûr de vouloir sélectionner <b>{propal ? propal.name : ""}</b> comme une activité <b className="txt-primary">validée</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelPropal} identifiant='cancel-activities' maxWidth={414} title="Annuler une activité"
                   content={<p>Êtes-vous sûr de vouloir annuler cette activité ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

ProjectActivities.propTypes = {
    mode: PropTypes.bool.isRequired,
    userId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired,
    propals: PropTypes.string.isRequired,
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

function modalEndPropal (self) {
	self.endPropal.current.handleUpdateFooter(<Button type="green" onClick={self.handleEndPropal}>Valider</Button>)
}

function modalCancelPropal (self) {
	self.cancelPropal.current.handleUpdateFooter(<Button type="red" onClick={self.handleCancelPropal}>Confirmer l'annulation</Button>)
}
