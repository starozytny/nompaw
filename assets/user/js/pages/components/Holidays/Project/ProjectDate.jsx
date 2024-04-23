import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import moment from 'moment';
import 'moment/locale/fr';

import Formulaire   from "@commonFunctions/formulaire";
import Validateur   from "@commonFunctions/validateur";
import Inputs       from "@commonFunctions/inputs";
import Sanitaze     from "@commonFunctions/sanitaze";
import Sort         from "@commonFunctions/sort";
import Propals      from "@userFunctions/propals";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal }    from "@tailwindComponents/Elements/Modal";
import { Input }    from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_projects_propals_date_create';
const URL_UPDATE_PROPAL = 'intern_api_projects_propals_date_update';
const URL_DELETE_PROPAL = 'intern_api_projects_propals_date_delete';
const URL_VOTE_PROPAL   = 'intern_api_projects_propals_date_vote';
const URL_END_PROPAL    = 'intern_api_projects_propals_date_end';
const URL_CANCEL_DATE   = 'intern_api_projects_cancel_date';

export class ProjectDate extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            propal: null,
            startAt: '',
            endAt: '',
            errors: [],
            data: JSON.parse(props.propals),
            loadData: false,
        }

        this.formPropal = React.createRef();
        this.deletePropal = React.createRef();
        this.endPropal = React.createRef();
        this.cancelDate = React.createRef();
    }

    componentDidMount = () => { Inputs.initDateInput(this.handleChangeDate, this.handleChange, "") }

    handleChange = (e, picker) => {
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "startAt" || name === "endAt"){
            value = Inputs.dateInput(e, picker, this.state[name]);
        }

        this.setState({[name]: value})
    }

    handleChangeDate = (name, value) => { this.setState({ [name]: value }) }

    handleModal = (identifiant, context, propal) => {
        modalFormPropal(this);
        modalDeletePropal(this);
        modalEndPropal(this);
        modalCancelDate(this);
        this.setState({
            context: context, propal: propal,
            startAt: propal ? moment(propal.startAt).format('DD/MM/Y') : "",
            endAt: propal && propal.endAt ? moment(propal.endAt).format('DD/MM/Y') : ""
        })
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { context, propal, startAt, endAt, data } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'startAt', value: startAt},
            {type: "date",  id: 'startAt', value: startAt},
        ];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let method = context === "create" ? "POST" : "PUT";
            let url    = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'project': projectId})
                : Routing.generate(URL_UPDATE_PROPAL, {'project': projectId, 'id': propal.id})

            const self = this;
            this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
            axios({ method: method, url: url, data: {startAt: startAt, endAt: endAt} })
                .then(function (response) {
                    self.formPropal.current.handleClose();
                    self.setState({ data: Propals.updateList(context, data, response) })
                })
                .catch(function (error) { modalFormPropal(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
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

    handleCancelDate = () => {
        const { projectId } = this.props;

        this.cancelDate.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer l'annulation</Button>);
        Propals.cancel(this, projectId, URL_CANCEL_DATE, modalCancelDate);
    }

    render() {
        const { mode, nStartAt, nEndAt, userId, authorId, dateId } = this.props;
        const { errors, loadData, startAt, endAt, data, propal } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        data.sort(Sort.compareStartAt);

        let propalSelected = null;
        if(dateId){
            data.forEach(d => {
                if(d.id === parseInt(dateId)){
                    propalSelected = d;
                }
            })
        }

        return <div className="project-card project-card-date">
            <div className="project-card-header">
                <div className="name">{nStartAt ? "Date sélectionnée" : "Proposition de dates"}</div>
            </div>
            <div className={`project-card-body${nStartAt ? " selected" : ""}`}>
                {nStartAt
                    ? <div className="propals">
                        <div className="propal selected">
                            {Sanitaze.toDateFormat(nStartAt, 'LL', '', false)}
                            {nEndAt ? " au " + Sanitaze.toDateFormat(nEndAt, 'LL', "", false) : ""}
                        </div>
                    </div>
                    : <>
                        <div className="propals">
                            {data.map((el, index) => {

                                let onVote = userId ? () => this.handleVote(el) : null;

                                let active = "";
                                el.votes.forEach(v => {
                                    if(v === userId){
                                        active = " active"
                                    }
                                })

                                return <div className="propal" key={index}>
                                    <div className={`selector${active}`} onClick={onVote}></div>
                                    <div className="propal-body" onClick={onVote}>
                                        <div className="name">
                                            {Sanitaze.toDateFormat(el.startAt, 'LL', "", false)}
                                            {el.endAt ? " au " + Sanitaze.toDateFormat(el.endAt, 'LL', "", false) : ""}
                                        </div>
                                    </div>
                                    <div className="propal-actions">
                                        {mode || el.author.id === parseInt(userId)
                                            ? <>
                                                <ButtonIcon icon="pencil" type="warning" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                                <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                                                {mode && <ButtonIcon icon="check1" type="success" onClick={() => this.handleModal("endPropal", "update", el)}>Clôturer</ButtonIcon> }
                                            </>
                                            : null
                                        }
                                    </div>
                                    <div className="propal-counter" onClick={onVote}>
                                        {loadData
                                            ? <span className="icon-chart-3"/>
                                            : `+ ${el.votes.length}`
                                        }
                                    </div>
                                </div>
                            })}
                        </div>
                    </>
                }
            </div>
            {userId && nStartAt === ""
                ? <div className="project-card-footer" onClick={() => this.handleModal('formPropal', 'create', null)}>
                    <div style={{display: 'flex', gap: '4px'}}>
                        <span className="icon-add"></span>
                        <span>Proposer une date</span>
                    </div>
                </div>
                : (mode || authorId === parseInt(userId)
                    ? <div className="project-card-footer project-card-footer-danger" onClick={() => this.handleModal('cancelDate', 'delete', null)}>
                        <div style={{display: 'flex', gap: '4px'}}>
                            <span className="icon-close"></span>
                            <span>Annuler la date sélectionnée</span>
                        </div>
                    </div>
                    : null)
            }

            <Modal ref={this.formPropal} identifiant="form-dates" maxWidth={568} title="Proposer une date"
                   content={<div className="line line-2">
                       <Input type="js-date" identifiant="startAt" valeur={startAt} {...params}>Début le</Input>
                       <Input type="js-date" identifiant="endAt" valeur={endAt} {...params}>Fini le</Input>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-propal-date' maxWidth={414} title="Supprimer la date"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{propal ? Sanitaze.toDateFormat(propal.startAt, 'LL', "", false) : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-propal-date' maxWidth={414} title="Sélectionner la date finale"
                   content={<p>Etes-vous sûr de vouloir sélectionner <b>{propal ? Sanitaze.toDateFormat(propal.startAt, 'LL', "", false) : ""}</b> comme étant la date <b>FINALE</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelDate} identifiant='cancel-date' maxWidth={414} title="Annuler la date sélectionnée"
                   content={<p>Etes-vous sûr de vouloir revenir sur les propositions de dates ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

ProjectDate.propTypes = {
    mode: PropTypes.bool.isRequired,
    userId: PropTypes.string.isRequired,
    projectId: PropTypes.string.isRequired,
    propals: PropTypes.string.isRequired,
    nStartAt: PropTypes.string
}

function modalFormPropal (self) {
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
function modalDeletePropal (self) {
    self.deletePropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
function modalEndPropal (self) {
    self.endPropal.current.handleUpdateFooter(<Button type="success" onClick={self.handleEndPropal}>Clôturer</Button>)
}
function modalCancelDate (self) {
    self.cancelDate.current.handleUpdateFooter(<Button type="danger" onClick={self.handleCancelDate}>Confirmer l'annulation</Button>)
}
