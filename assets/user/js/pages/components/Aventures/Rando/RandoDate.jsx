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

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { Modal }    from "@commonComponents/Elements/Modal";
import { Input }    from "@commonComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'api_aventures_propals_date_create';
const URL_UPDATE_PROPAL = 'api_aventures_propals_date_update';
const URL_DELETE_PROPAL = 'api_aventures_propals_date_delete';
const URL_VOTE_PROPAL   = 'api_aventures_propals_date_vote';
const URL_END_PROPAL    = 'api_aventures_propals_date_end';
const URL_CANCEL_DATE   = 'api_aventures_randos_cancel_date';

export class RandoDate extends Component{
    constructor(props) {
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

    componentDidMount = () => { Inputs.initDateInput(this.handleChangeDate, this.handleChange, "") }

    handleChange = (e, picker) => {
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "dateAt"){
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
        this.setState({ context: context, propal: propal, dateAt: propal ? moment(propal.dateAt).format('DD/MM/Y') : "" })
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { randoId } = this.props;
        const { context, propal, dateAt, data } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'dateAt', value: dateAt},
            {type: "date",  id: 'dateAt', value: dateAt},
        ];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let method = context === "create" ? "POST" : "PUT";
            let url    = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'rando': randoId})
                : Routing.generate(URL_UPDATE_PROPAL, {'rando': randoId, 'id': propal.id})

            const self = this;
            this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
            axios({ method: method, url: url, data: {dateAt: dateAt} })
                .then(function (response) {
                    self.formPropal.current.handleClose();

                    let nData = data;
                    if(context === "create"){
                        nData = [...data, ...[response.data]];
                    }else if(context === "update"){
                        nData = [];
                        data.forEach(d => {
                            if(d.id === response.data.id){
                                d = response.data;
                            }
                            nData.push(d);
                        })
                    }

                    self.setState({ data: nData })
                })
                .catch(function (error) { modalFormPropal(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    handleDeletePropal = () => {
        const { propal, data } = this.state;

        let self = this;
        this.deletePropal.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer la suppression</Button>);
        axios({ method: "DELETE", url: Routing.generate(URL_DELETE_PROPAL, {'id': propal.id}), data: {} })
            .then(function (response) {
                self.deletePropal.current.handleClose();
                self.setState({ data: data.filter(d => { return d.id !== propal.id }) })
            })
            .catch(function (error) { modalDeletePropal(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    handleVote = (propal) => {
        const { userId } = this.props;
        const { loadData, data } = this.state;

        if(!loadData){
            this.setState({ loadData: true });

            let self = this;
            axios({ method: "PUT", url: Routing.generate(URL_VOTE_PROPAL, {'id': propal.id}), data: {userId: userId} })
                .then(function (response) {
                    let nData = [];
                    data.forEach(d => {
                        if(d.id === response.data.id){
                            d = response.data;
                        }
                        nData.push(d);
                    })

                    self.setState({ data: nData });
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
                .then(function () { self.setState({ loadData: false }); })
            ;
        }
    }

    handleEndPropal = () => {
        const { propal } = this.state;

        let self = this;
        this.endPropal.current.handleUpdateFooter(<Button isLoader={true} type="success">Clôturer</Button>);
        axios({ method: "PUT", url: Routing.generate(URL_END_PROPAL, {'id': propal.id}), data: {} })
            .then(function (response) {
                location.reload();
            })
            .catch(function (error) { modalEndPropal(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    handleCancelDate = () => {
        const { randoId } = this.props;

        let self = this;
        this.cancelDate.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer l'annulation</Button>);
        axios({ method: "PUT", url: Routing.generate(URL_CANCEL_DATE, {'id': randoId}), data: {} })
            .then(function (response) {
                location.reload();
            })
            .catch(function (error) { modalCancelDate(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    render() {
        const { mode, startAt, userId, status, authorId, dateId } = this.props;
        const { errors, loadData, dateAt, data, propal } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        data.sort(Sort.compareDateAt);

        let propalSelected = null;
        if(dateId){
            data.forEach(d => {
                if(d.id === parseInt(dateId)){
                    propalSelected = d;
                }
            })
        }

        return <div className="rando-card">
            <div className="rando-card-header">
                <div className="name">{startAt ? "Date sélectionnée" : "Proposition de dates"}</div>
            </div>
            <div className={`rando-card-body${startAt ? " selected" : ""}`}>
                {startAt
                    ? <div className="propals">
                        <div className="propal selected">
                            {Sanitaze.toDateFormat(startAt, 'LL', '', false)}
                        </div>
                    </div>
                    : <>
                        <div className="propals">
                            {data.map((el, index) => {

                                let onVote = () => this.handleVote(el);

                                let active = "";
                                el.votes.forEach(v => {
                                    if(v === userId){
                                        active = " active"
                                    }
                                })

                                return <div className="propal" key={index}>
                                    <div className={`selector${active}`} onClick={onVote}></div>
                                    <div className="propal-body" onClick={onVote}>
                                        <div className="name">{Sanitaze.toDateFormat(el.dateAt, 'LL', "", false)}</div>
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
            {startAt === ""
                ? <div className="rando-card-footer" onClick={() => this.handleModal('formPropal', 'create', null)}>
                    <div style={{display: 'flex', gap: '4px'}}>
                        <span className="icon-add"></span>
                        <span>Proposer une date</span>
                    </div>
                </div>
                : (mode || authorId === parseInt(userId)
                    ? <div className="rando-card-footer rando-card-footer-danger" onClick={() => this.handleModal('cancelDate', 'delete', null)}>
                        <div style={{display: 'flex', gap: '4px'}}>
                            <span className="icon-close"></span>
                            <span>Annuler la date sélectionnée</span>
                        </div>
                    </div>
                    : null)
            }

            <Modal ref={this.formPropal} identifiant="form-dates" maxWidth={568} title="Proposer une date"
                   content={<div className="line">
                       <Input type="js-date" identifiant="dateAt" valeur={dateAt} {...params}>Date</Input>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-propal-date' maxWidth={414} title="Supprimer la date"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{propal ? Sanitaze.toDateFormat(propal.dateAt, 'LL', "", false) : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-propal-date' maxWidth={414} title="Sélectionner la date finale"
                   content={<p>Etes-vous sûr de vouloir sélectionner <b>{propal ? Sanitaze.toDateFormat(propal.dateAt, 'LL', "", false) : ""}</b> comme étant la date <b>FINALE</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelDate} identifiant='cancel-date' maxWidth={414} title="Annuler la date sélectionnée"
                   content={<p>Etes-vous sûr de vouloir revenir sur les propositions de dates ?</p>}
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
