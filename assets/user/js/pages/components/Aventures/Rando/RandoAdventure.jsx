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
import Propals      from "@userFunctions/propals";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal }    from "@tailwindComponents/Elements/Modal";
import { Input }    from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_aventures_propals_adventure_create';
const URL_UPDATE_PROPAL = 'intern_api_aventures_propals_adventure_update';
const URL_DELETE_PROPAL = 'intern_api_aventures_propals_adventure_delete';
const URL_VOTE_PROPAL   = 'intern_api_aventures_propals_adventure_vote';
const URL_END_PROPAL    = 'intern_api_aventures_propals_adventure_end';
const URL_CANCEL_ADV    = 'intern_api_aventures_randos_cancel_adventure';

export class RandoAdventure extends Component {
    constructor(props) {
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
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "duration"){
            value = Inputs.timeInput(e, this.state[name]);
        }

        this.setState({[name]: value})
    }

    handleModal = (identifiant, context, propal) => {
        modalFormPropal(this);
        modalDeletePropal(this);
        modalEndPropal(this);
        modalCancelAdventure(this);
        this.setState({
            context: context, propal: propal,
            name: propal ? propal.name : "",
            duration: propal  && propal.duration ? moment(propal.duration).format('LT').replace(':', 'h') : "",
            url: propal ? Formulaire.setValue(propal.url) : "https://",
        })
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { randoId } = this.props;
        const { context, propal, name, duration, url, data } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [{type: "text",  id: 'name', value: name}];

        if(duration !== ""){
            paramsToValidate = [...paramsToValidate, ...[{type: "time", id: 'duration', value: duration}]];
        }

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let method  = context === "create" ? "POST" : "PUT";
            let urlForm = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'rando': randoId})
                : Routing.generate(URL_UPDATE_PROPAL, {'rando': randoId, 'id': propal.id})

            const self = this;
            this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
            axios({ method: method, url: urlForm, data: {name: name, duration: duration, url: url} })
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

    handleCancelAdventure = () => {
        const { randoId } = this.props;

        this.cancelAdventure.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer l'annulation</Button>);
        Propals.cancel(this, randoId, URL_CANCEL_ADV, modalCancelAdventure);
    }

    render() {
        const { mode, haveAdventure, advName, userId, authorId } = this.props;
        const { errors, loadData, name, duration, url, data, propal } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div className="rando-card">
            <div className="rando-card-header">
                <div className="name">{haveAdventure ? "Aventure sélectionnée" : "Proposition d'aventures"}</div>
            </div>
            <div className={`rando-card-body${haveAdventure ? " selected" : ""}`}>
                {haveAdventure
                    ? <div className="propals">
                        <div className="propal selected">{advName}</div>
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
                                    <div className="propal-body">
                                        <div className="name">
                                            <span onClick={onVote}>{el.name}</span>
                                            {(el.url && el.url !== "https://") && <a href={el.url} className="url-topo" target="_blank">
                                                <span className="icon-link"></span>
                                                <span className="tooltip">Topo</span>
                                            </a>}
                                        </div>
                                        <div className="duration" onClick={onVote}>
                                            {Sanitaze.toFormatDuration(Sanitaze.toDateFormat(el.duration, 'LT', "", false).replace(':', 'h'))}
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
            {haveAdventure
                ? (mode || authorId === parseInt(userId)
                    ?  <div className="rando-card-footer rando-card-footer-danger" onClick={() => this.handleModal('cancelAdventure', 'delete', null)}>
                        <div style={{display: 'flex', gap: '4px'}}>
                            <span className="icon-close"></span>
                            <span>Annuler l'aventure sélectionnée</span>
                        </div>
                    </div>
                    : null
                )
                : <div className="rando-card-footer" onClick={() => this.handleModal('formPropal', 'create', null)}>
                    <div style={{display: 'flex', gap: '4px'}}>
                        <span className="icon-add"></span>
                        <span>Proposer une aventure</span>
                    </div>
                </div>
            }

            <Modal ref={this.formPropal} identifiant="form-adventures" maxWidth={568} title="Proposer une aventure"
                   content={<>
                       <div className="line line-2">
                           <Input identifiant="name" valeur={name} {...params}>Nom de l'aventure</Input>
                           <Input identifiant="duration" valeur={duration} placeholder="00h00" {...params}>Durée</Input>
                       </div>
                       <div className="line">
                           <Input identifiant="url" valeur={url} {...params}>Lien du topo</Input>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-propal-adventure' maxWidth={414} title="Supprimer l'aventure"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-propal-adventure' maxWidth={414} title="Sélectionner l'aventure finale"
                   content={<p>Etes-vous sûr de vouloir sélectionner <b>{propal ? propal.name : ""}</b> comme étant l'aventure <b>FINALE</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelAdventure} identifiant='cancel-adventure' maxWidth={414} title="Annuler l'aventure sélectionnée"
                   content={<p>Etes-vous sûr de vouloir revenir sur les propositions des aventures ?</p>}
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
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
function modalDeletePropal (self) {
    self.deletePropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
function modalEndPropal (self) {
    self.endPropal.current.handleUpdateFooter(<Button type="success" onClick={self.handleEndPropal}>Clôturer</Button>)
}
function modalCancelAdventure (self) {
    self.cancelAdventure.current.handleUpdateFooter(<Button type="danger" onClick={self.handleCancelAdventure}>Confirmer l'annulation</Button>)
}
