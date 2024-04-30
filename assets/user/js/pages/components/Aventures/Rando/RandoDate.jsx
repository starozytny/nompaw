import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import moment from 'moment';
import 'moment/locale/fr';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Inputs from "@commonFunctions/inputs";
import Sanitaze from "@commonFunctions/sanitaze";
import Sort from "@commonFunctions/sort";
import Propals from "@userFunctions/propals";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_aventures_propals_date_create';
const URL_UPDATE_PROPAL = 'intern_api_aventures_propals_date_update';
const URL_DELETE_PROPAL = 'intern_api_aventures_propals_date_delete';
const URL_VOTE_PROPAL = 'intern_api_aventures_propals_date_vote';
const URL_END_PROPAL = 'intern_api_aventures_propals_date_end';
const URL_CANCEL_DATE = 'intern_api_aventures_randos_cancel_date';

export class RandoDate extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			propal: null,
			dateAt: '',
			errors: [],
			data: JSON.parse(props.propals),
			loadData: false,
		}

		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
		this.endPropal = React.createRef();
		this.cancelDate = React.createRef();
	}

	componentDidMount = () => {
		Inputs.initDateInput(this.handleChangeDate, this.handleChange, "")
	}

	handleChange = (e, picker) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "dateAt") {
			value = Inputs.dateInput(e, picker, this.state[name]);
		}

		this.setState({ [name]: value })
	}

	handleChangeDate = (name, value) => {
		this.setState({ [name]: value })
	}

	handleModal = (identifiant, context, propal) => {
		modalFormPropal(this);
		modalDeletePropal(this);
		modalEndPropal(this);
		modalCancelDate(this);
		this.setState({ context: context, propal: propal, dateAt: propal ? moment(propal.dateAt).format('DD/MM/Y') : "" })
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { randoId } = this.props;
		const { context, propal, dateAt, data } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [
			{ type: "text", id: 'dateAt', value: dateAt },
			{ type: "date", id: 'dateAt', value: dateAt },
		];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let method = context === "create" ? "POST" : "PUT";
			let url = context === "create"
				? Routing.generate(URL_CREATE_PROPAL, { 'rando': randoId })
				: Routing.generate(URL_UPDATE_PROPAL, { 'rando': randoId, 'id': propal.id })

			const self = this;
			this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="blue">Confirmer</Button>);
			axios({ method: method, url: url, data: { dateAt: dateAt } })
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

		this.deletePropal.current.handleUpdateFooter(<Button isLoader={true} type="red">Confirmer la suppression</Button>);
		Propals.deletePropal(this, this.deletePropal, propal, data, URL_DELETE_PROPAL, modalDeletePropal);
	}

	handleVote = (propal) => {
		const { userId } = this.props;
		const { loadData, data } = this.state;

		Propals.vote(this, propal, data, userId, loadData, URL_VOTE_PROPAL);
	}

	handleEndPropal = () => {
		const { propal } = this.state;

		this.endPropal.current.handleUpdateFooter(<Button isLoader={true} type="green">Clôturer</Button>);
		Propals.endPropal(this, propal, URL_END_PROPAL, modalEndPropal);
	}

	handleCancelDate = () => {
		const { randoId } = this.props;

		this.cancelDate.current.handleUpdateFooter(<Button isLoader={true} type="red">Confirmer l'annulation</Button>);
		Propals.cancel(this, randoId, URL_CANCEL_DATE, modalCancelDate);
	}

	render () {
		const { mode, startAt, userId, authorId, dateId } = this.props;
		const { errors, loadData, dateAt, data, propal } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		data.sort(Sort.compareDateAt);

		let propalSelected = null;
		if (dateId) {
			data.forEach(d => {
				if (d.id === parseInt(dateId)) {
					propalSelected = d;
				}
			})
		}

		return <div className="bg-white border rounded-md">
			<div className="p-4 bg-color0/80 text-slate-50 rounded-t-md">
				<div className="font-semibold">{startAt ? "Date sélectionnée" : "Proposition de dates"}</div>
			</div>
			<div className="p-4">
				{startAt
					? <div className="text-xl font-bold text-blue-700 py-4 flex items-center justify-center gap-2">
						<div>{Sanitaze.toDateFormat(startAt, 'LL', '', false)}</div>
						{mode || authorId === parseInt(userId)
							? <div className="cursor-pointer text-gray-900" onClick={() => this.handleModal('cancelDate', 'delete', null)}>
								<span class="icon-close"></span>
							</div>
							: null
						}
					</div>
					: <>
						<div className="flex flex-col gap-2">
						{data.map((el, index) => {

								let onVote = () => this.handleVote(el);

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
											<span class={`icon-check1 text-sm ${active ? "text-white" : "text-transparent"}`}></span>
										</div>
										<div className="font-medium" onClick={onVote}>
											{Sanitaze.toDateFormat(el.dateAt, 'LL', "", false)}
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
					</>
				}
			</div>
			{startAt === ""
				? <div className="flex items-center justify-center gap-1 cursor-pointer text-center bg-blue-500 hover:opacity-95 text-slate-50 transition-colors w-full rounded-b-md p-4"
					   onClick={() => this.handleModal('formPropal', 'create', null)}>
					<span className="icon-add"></span>
					<span>Proposer une date</span>
				</div>
				: null
			}

			<Modal ref={this.formPropal} identifiant="form-dates" maxWidth={568} title="Proposer une date"
				   content={<div>
					   <Input type="js-date" identifiant="dateAt" valeur={dateAt} {...params}>Date</Input>
				   </div>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.deletePropal} identifiant='delete-propal-date' maxWidth={414} title="Supprimer la date"
				   content={<p>Êtes-vous sûr de vouloir supprimer <b>{propal ? Sanitaze.toDateFormat(propal.dateAt, 'LL', "", false) : ""}</b> ?</p>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.endPropal} identifiant='end-propal-date' maxWidth={414} title="Sélectionner la date finale"
				   content={<p>Êtes-vous sûr de vouloir sélectionner <b>{propal ? Sanitaze.toDateFormat(propal.dateAt, 'LL', "", false) : ""}</b> comme étant la date <b>FINALE</b> ?</p>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.cancelDate} identifiant='cancel-date' maxWidth={414} title="Annuler la date sélectionnée"
				   content={<p>Êtes-vous sûr de vouloir revenir sur les propositions de dates ?</p>}
				   footer={null} closeTxt="Annuler" />
		</div>
	}
}

RandoDate.propTypes = {
	mode: PropTypes.bool.isRequired,
	userId: PropTypes.string.isRequired,
	randoId: PropTypes.string.isRequired,
	propals: PropTypes.string.isRequired,
	status: PropTypes.string.isRequired,
	startAt: PropTypes.string
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

function modalCancelDate (self) {
	self.cancelDate.current.handleUpdateFooter(<Button type="red" onClick={self.handleCancelDate}>Confirmer l'annulation</Button>)
}
