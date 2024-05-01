import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Inputs from "@commonFunctions/inputs";
import Sanitaze from "@commonFunctions/sanitaze";
import Propals from "@userFunctions/propals";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";

const URL_CREATE_PROPAL = 'intern_api_projects_propals_house_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_propals_house_update';
const URL_DELETE_PROPAL = 'intern_api_projects_propals_house_delete';
const URL_VOTE_PROPAL = 'intern_api_projects_propals_house_vote';
const URL_END_PROPAL = 'intern_api_projects_propals_house_end';
const URL_CANCEL_HOUSE = 'intern_api_projects_cancel_house';
const URL_UPDATE_PROJECT = 'intern_api_projects_update_text';

export class ProjectHouse extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			propal: null,
			name: '',
			url: 'https://',
			price: '',
			texteHouse: { value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte) },
			textHouse: Formulaire.setValue(props.texte),
			errors: [],
			data: JSON.parse(props.propals),
			loadData: false,
		}

		this.formText = React.createRef();
		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
		this.endPropal = React.createRef();
		this.cancelHouse = React.createRef();
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
		modalCancelHouse(this);
		this.setState({
			context: context, propal: propal,
			name: propal ? propal.name : "",
			url: propal ? Formulaire.setValue(propal.url) : "https://",
			price: propal ? Formulaire.setValue(propal.price) : "",
		})
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { projectId } = this.props;
		const { context, propal, name, url, price, data } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [{ type: "text", id: 'name', value: name }];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let method = context === "create" ? "POST" : "PUT";
			let urlName = context === "create"
				? Routing.generate(URL_CREATE_PROPAL, { 'project': projectId })
				: Routing.generate(URL_UPDATE_PROPAL, { 'project': projectId, 'id': propal.id })

			const self = this;
			this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
			axios({ method: method, url: urlName, data: { name: name, url: url, price: price } })
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
		const { texteHouse } = this.state;

		const self = this;
		this.formText.current.handleUpdateFooter(<Button isLoader={true} type="blue">Confirmer</Button>);
		axios({
			method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, { 'type': 'house', 'id': projectId }),
			data: { texte: texteHouse }
		})
			.then(function (response) {
				self.formText.current.handleClose();

				let data = response.data;
				self.setState({
					texteHouse: { value: Formulaire.setValue(data.textHouse), html: Formulaire.setValue(data.textHouse) },
					textHouse: Formulaire.setValue(data.textHouse),
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

		this.deletePropal.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer la suppression</Button>);
		Propals.deletePropal(this, this.deletePropal, propal, data, URL_DELETE_PROPAL, modalDeletePropal);
	}

	handleVote = (propal) => {
		const { userId } = this.props;
		const { loadData, data } = this.state;

		Propals.vote(this, propal, data, userId, loadData, URL_VOTE_PROPAL);
	}

	handleEndPropal = () => {
		const { propal } = this.state;

		this.endPropal.current.handleUpdateFooter(<Button isLoader={true} type="success">Clôturer</Button>);
		Propals.endPropal(this, propal, URL_END_PROPAL, modalEndPropal);
	}

	handleCancelHouse = () => {
		const { projectId } = this.props;

		this.cancelHouse.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer l'annulation</Button>);
		Propals.cancel(this, projectId, URL_CANCEL_HOUSE, modalCancelHouse);
	}

	render () {
		const { mode, houseName, houseUrl, housePrice, userId, authorId } = this.props;
		const { errors, loadData, name, url, price, data, propal, texteHouse, textHouse } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		if (!userId && data.length === 0 && textHouse === "") {
			return null;
		}

		return <div className="bg-white border rounded-md max-w-screen-lg">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md flex justify-between gap-2">
                <div className="font-semibold text-xl">🏠 Hébergement</div>
                {userId
                    ? <div className="flex gap-2">
                        {((mode || authorId === parseInt(userId)) && houseName)
                            ? <Button type="default" iconLeft="close"
                                      onClick={() => this.handleModal('cancelHouse', 'delete', null)}
                            >
                                Annuler l'hébergement
                            </Button>
                            : null
                        }
                        <Button type="default" iconLeft="pencil" onClick={() => this.handleModal("formText")}>
                            Modifier
                        </Button>
                    </div>
                    : null
                }
            </div>
            <div className="p-4">
                <div className="propals">
                    {textHouse
                        ? <div className="pb-4 mb-4 border-b text-gray-600">
                            <div dangerouslySetInnerHTML={{ __html: textHouse }}></div>
						</div>
						: null
					}
					{houseName
						? <div>
							{houseUrl
								? <a href={houseUrl} target="_blank" className="flex items-center gap-2 text-blue-700 hover:text-blue-500 hover:underline">
									<span>{houseName}</span>
									<span className="icon-link" />
								</a>
								: <span>{houseName}</span>
							}
						</div>
						: <>
                            <div className="flex flex-col gap-2">
								{data.map((el, index) => {

									let onVote = userId ? () => this.handleVote(el) : null;

									let active = false;
									el.votes.forEach(v => {
										if (v === userId) {
											active = true;
										}
									})

									return <div className="flex items-center justify-between gap-2" key={index}>
										<div className="flex items-center gap-2 group">
											<div className={`cursor-pointer w-6 h-6 border-2 rounded-md ring-1 flex items-center justify-center ${active ? "bg-blue-700 ring-blue-700" : "bg-white ring-gray-100 group-hover:bg-blue-100"}`}
												 onClick={onVote}>
												<span className={`icon-check1 text-sm ${active ? "text-white" : "text-transparent"}`}></span>
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
													{el.price ? Sanitaze.toFormatCurrency(el.price) : ""}
												</div>
											</div>
										</div>
										<div>
											<div className="flex gap-2">
												<div className="flex gap-1">
													{mode || el.author.id === parseInt(userId)
														? <>
															<ButtonIcon icon="pencil" type="yellow" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
															<ButtonIcon icon="trash" type="red" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
															{mode && <ButtonIcon icon="check1" type="green" onClick={() => this.handleModal("endPropal", "update", el)}>Clôturer</ButtonIcon>}
														</>
														: null
													}
												</div>
												<div className="bg-gray-200 px-2 py-0.5 text-xs rounded-md flex items-center justify-center" onClick={onVote}>
													{loadData
														? <span className="icon-chart-3" />
														: `+ ${el.votes.length}`
													}
												</div>
											</div>
										</div>
									</div>
								})}
                            </div>

                            {userId
                                ? <div className="mt-4 flex justify-end">
                                    <Button type="blue" iconLeft="add"
                                            onClick={() => this.handleModal('formPropal', 'create', null)}
                                    >
                                        Proposer un hébergement
                                    </Button>
                                </div>
                                : null
                            }
                        </>
                    }
                </div>
            </div>

            <div className="flex flex-col gap-2 justify-center items-center p-4 bg-color0/10 rounded-b-md">
                <div className="text-xl font-bold text-yellow-500">
                    {Sanitaze.toFormatCurrency(housePrice)}
                </div>
            </div>

            <Modal ref={this.formText} identifiant="form-house-text" maxWidth={768} title="Modifier le texte"
                   content={<div>
                       <TinyMCE type={8} identifiant="texteHouse" valeur={texteHouse.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                           Texte
                       </TinyMCE>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formPropal} identifiant="form-house" maxWidth={568} title="Proposer un hébergement"
                   content={<div className="flex flex-col gap-4">
                       <div className="flex gap-4">
                           <div class="w-full">
                               <Input identifiant="name" valeur={name} {...params}>Nom de l'hébergement</Input>
                           </div>
                           <div class="w-full">
                               <Input identifiant="price" valeur={price} {...params}>Prix de l'hébergement</Input>
                           </div>
					   </div>
					   <div>
						   <Input identifiant="url" valeur={url} {...params}>Lien externe</Input>
					   </div>
				   </div>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.deletePropal} identifiant='delete-propal-house' maxWidth={414} title="Supprimer l'hébergement"
				   content={<p>Êtes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.endPropal} identifiant='end-propal-house' maxWidth={414} title="Sélectionner l'hébergement final"
				   content={<p>Êtes-vous sûr de vouloir sélectionner <b>{propal ? propal.name : ""}</b> comme étant l'hébergement <b>FINAL</b> ?</p>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.cancelHouse} identifiant='cancel-house' maxWidth={414} title="Annuler l'hébergement sélectionnée"
				   content={<p>Êtes-vous sûr de vouloir revenir sur les propositions de l'hébergement ?</p>}
				   footer={null} closeTxt="Annuler" />
		</div>
	}
}

ProjectHouse.propTypes = {
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
	self.endPropal.current.handleUpdateFooter(<Button type="green" onClick={self.handleEndPropal}>Clôturer</Button>)
}

function modalCancelHouse (self) {
	self.cancelHouse.current.handleUpdateFooter(<Button type="red" onClick={self.handleCancelHouse}>Confirmer l'annulation</Button>)
}
