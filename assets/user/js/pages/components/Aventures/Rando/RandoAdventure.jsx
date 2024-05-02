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
import Propals from "@userFunctions/propals";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_aventures_propals_adventure_create';
const URL_UPDATE_PROPAL = 'intern_api_aventures_propals_adventure_update';
const URL_DELETE_PROPAL = 'intern_api_aventures_propals_adventure_delete';
const URL_VOTE_PROPAL = 'intern_api_aventures_propals_adventure_vote';
const URL_END_PROPAL = 'intern_api_aventures_propals_adventure_end';
const URL_CANCEL_ADV = 'intern_api_aventures_randos_cancel_adventure';

export class RandoAdventure extends Component {
	constructor (props) {
		super(props);

		this.state = {
			context: 'create',
			propal: null,
			name: '',
			duration: '',
			url: 'https://',
			errors: [],
			data: JSON.parse(props.propals),
			loadData: false,
		}

		this.formPropal = React.createRef();
		this.deletePropal = React.createRef();
		this.endPropal = React.createRef();
		this.cancelAdventure = React.createRef();
	}

	handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "duration") {
			value = Inputs.timeInput(e, this.state[name]);
		}

		this.setState({ [name]: value })
	}

	handleModal = (identifiant, context, propal) => {
		modalFormPropal(this);
		modalDeletePropal(this);
		modalEndPropal(this);
		modalCancelAdventure(this);
		this.setState({
			context: context, propal: propal,
			name: propal ? propal.name : "",
			duration: propal && propal.duration ? moment(propal.duration).format('LT').replace(':', 'h') : "",
			url: propal ? Formulaire.setValue(propal.url) : "https://",
		})
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { randoId } = this.props;
		const { context, propal, name, duration, url, data } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [{ type: "text", id: 'name', value: name }];

		if (duration !== "") {
			paramsToValidate = [...paramsToValidate, ...[{ type: "time", id: 'duration', value: duration }]];
		}

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let method = context === "create" ? "POST" : "PUT";
			let urlForm = context === "create"
				? Routing.generate(URL_CREATE_PROPAL, { 'rando': randoId })
				: Routing.generate(URL_UPDATE_PROPAL, { 'rando': randoId, 'id': propal.id })

			const self = this;
			this.formPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
			axios({ method: method, url: urlForm, data: { name: name, duration: duration, url: url } })
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

	handleCancelAdventure = () => {
		const { randoId } = this.props;

		this.cancelAdventure.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer l'annulation</Button>);
		Propals.cancel(this, randoId, URL_CANCEL_ADV, modalCancelAdventure);
	}

	render () {
		const { mode, haveAdventure, advName, userId, authorId } = this.props;
		const { errors, loadData, name, duration, url, data, propal } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

        return <div className="bg-white border rounded-md">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md">
                <div className="font-semibold">{haveAdventure ? "Aventure sélectionnée" : "Proposition d'aventures"}</div>
            </div>
            <div className="p-4">
                {haveAdventure
                    ? <div className="text-xl font-bold text-blue-700 py-4 flex items-center justify-center gap-2">
                        <div>{advName}</div>
                        {mode || authorId === parseInt(userId)
                            ? <div className="cursor-pointer text-gray-900" onClick={() => this.handleModal('cancelDate', 'delete', null)}>
                                <span className="icon-close"></span>
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
                                        <span className={`icon-check1 text-sm ${active ? "text-white" : "text-transparent"}`}></span>
                                    </div>
                                    <div>
                                        <div className="font-medium flex items-center gap-2">
                                            <span onClick={onVote}>{el.name}</span>
                                            {(el.url && el.url !== "https://") && <a href={el.url} className="url-topo relative text-blue-700" target="_blank">
                                                <span className="icon-link"></span>
                                                <span className="tooltip bg-gray-300 py-1 px-2 rounded absolute -top-7 right-0 text-xs text-gray-600 hidden">Topo</span>
                                            </a>}
                                        </div>
                                        <div className="text-gray-600 text-sm" onClick={onVote}>
                                            {Sanitaze.toFormatDuration(Sanitaze.toFormatDate(el.duration, 'LT', "", false).replace(':', 'h'))}
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
                    </>
                }
            </div>
            {haveAdventure
                ? null
                : <div className="flex items-center justify-center gap-1 cursor-pointer text-center bg-blue-500 hover:opacity-95 text-slate-50 transition-colors w-full rounded-b-md p-4"
                       onClick={() => this.handleModal('formPropal', 'create', null)}>
                    <span className="icon-add"></span>
                    <span>Proposer une aventure</span>
                </div>
            }

            <Modal ref={this.formPropal} identifiant="form-adventures" maxWidth={568} title="Proposer une aventure"
                   content={<>
                       <div className="flex gap-4">
                           <div className="w-full">
                               <Input identifiant="name" valeur={name} {...params}>Nom de l'aventure</Input>
                           </div>
                           <div className="w-full">
                               <Input identifiant="duration" valeur={duration} placeholder="00h00" {...params}>Durée</Input>
                           </div>
                       </div>
                       <div>
                           <Input identifiant="url" valeur={url} {...params}>Lien du topo</Input>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-propal-adventure' maxWidth={414} title="Supprimer l'aventure"
                   content={<p>Êtes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-propal-adventure' maxWidth={414} title="Sélectionner l'aventure finale"
                   content={<p>Êtes-vous sûr de vouloir sélectionner <b>{propal ? propal.name : ""}</b> comme étant l'aventure <b>FINALE</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelAdventure} identifiant='cancel-adventure' maxWidth={414} title="Annuler l'aventure sélectionnée"
                   content={<p>Êtes-vous sûr de vouloir revenir sur les propositions des aventures ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

RandoAdventure.propTypes = {
    mode: PropTypes.bool.isRequired,
	haveAdventure: PropTypes.bool.isRequired,
	advName: PropTypes.string.isRequired,
	userId: PropTypes.string.isRequired,
	randoId: PropTypes.string.isRequired,
	status: PropTypes.string.isRequired,
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

function modalCancelAdventure (self) {
	self.cancelAdventure.current.handleUpdateFooter(<Button type="red" onClick={self.handleCancelAdventure}>Confirmer l'annulation</Button>)
}
