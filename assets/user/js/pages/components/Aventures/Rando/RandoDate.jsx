import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort from "@commonFunctions/sort";
import Propals from "@userFunctions/propals";
import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

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

	handleChange = (e) => {
		this.setState({ [e.currentTarget.name]: e.currentTarget.value })
	}

	handleModal = (identifiant, context, propal) => {
		modalFormPropal(this);
		modalDeletePropal(this);
		modalEndPropal(this);
		modalCancelDate(this);
		this.setState({ context: context, propal: propal, dateAt: propal ? Formulaire.setValueDate(propal.dateAt) : "" })
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
			this.formPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
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

		this.endPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="green">Clôturer</Button>);
		Propals.endPropal(this, propal, URL_END_PROPAL, modalEndPropal);
	}

	handleCancelDate = () => {
		const { randoId } = this.props;

		this.cancelDate.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer l'annulation</Button>);
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

		return <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
			<h3 className="text-sm font-semibold text-slate-700 mb-3">{startAt ? "Date sélectionnée" : "Proposition de dates"}</h3>

			<div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
				{startAt
					? <>
						<div className="flex items-center gap-2">
							<span className="icon-calendar text-blue-600"></span>
							<span className="text-sm font-medium text-blue-900">{Sanitaze.toFormatDate(startAt, 'LL', '', false)}</span>
						</div>
						{mode || authorId === parseInt(userId)
							? <button className="text-slate-400 hover:text-slate-600" onClick={() => this.handleModal('cancelDate', 'delete', null)}>
								<span className="icon-close"></span>
							</button>
							: null
						}
					</>
					: <div className="w-full flex flex-col gap-4">
						{data.length > 0
							? <div className="w-full flex flex-col gap-2">
								{data.map((el, index) => {

									let onVote = () => this.handleVote(el);

									let active = false;
									el.votes.forEach(v => {
										if (v === userId) {
											active = true;
										}
									})

									return <div className="w-full flex items-center justify-between gap-2" key={index}>
										<div className="flex items-center gap-2 group">
											<div className={`cursor-pointer w-6 h-6 border-2 rounded-md ring-1 flex items-center justify-center ${active ? "bg-blue-700 ring-blue-700" : "bg-white ring-gray-100 group-hover:bg-blue-100"}`}
												 onClick={onVote}>
												<span className={`icon-check1 text-sm ${active ? "text-white" : "text-transparent"}`}></span>
											</div>
											<div className="font-medium text-sm" onClick={onVote}>
												{Sanitaze.toFormatDate(el.dateAt, 'LL', "", false)}
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
							: null
						}

						<div className="group flex items-center gap-2 cursor-pointer" onClick={() => this.handleModal('formPropal', 'create', null)}>
							<span className="icon-add text-blue-900"></span>
							<span className="text-sm font-medium text-blue-900 group-hover:underline">Proposer une date</span>
						</div>
					</div>
				}
			</div>

			<Modal ref={this.formPropal} identifiant="form-dates" maxWidth={568} title="Proposer une date"
				   content={<div>
					   <Input type="date" identifiant="dateAt" valeur={dateAt} {...params}>Date</Input>
				   </div>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.deletePropal} identifiant='delete-propal-date' maxWidth={414} title="Supprimer la date"
				   content={<p>Êtes-vous sûr de vouloir supprimer <b>{propal ? Sanitaze.toFormatDate(propal.dateAt, 'LL', "", false) : ""}</b> ?</p>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.endPropal} identifiant='end-propal-date' maxWidth={414} title="Sélectionner la date finale"
				   content={<p>Êtes-vous sûr de vouloir sélectionner <b>{propal ? Sanitaze.toFormatDate(propal.dateAt, 'LL', "", false) : ""}</b> comme étant la date <b>FINALE</b> ?</p>}
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
