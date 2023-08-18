import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire   from "@commonFunctions/formulaire";
import Validateur   from "@commonFunctions/validateur";
import Inputs       from "@commonFunctions/inputs";
import Sanitaze     from "@commonFunctions/sanitaze";
import Propals      from "@userFunctions/propals";

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { Modal }    from "@commonComponents/Elements/Modal";
import { Input }    from "@commonComponents/Elements/Fields";
import { TinyMCE }  from "@commonComponents/Elements/TinyMCE";

const URL_CREATE_PROPAL = 'api_projects_propals_house_create';
const URL_UPDATE_PROPAL = 'api_projects_propals_house_update';
const URL_DELETE_PROPAL = 'api_projects_propals_house_delete';
const URL_VOTE_PROPAL   = 'api_projects_propals_house_vote';
const URL_END_PROPAL    = 'api_projects_propals_house_end';
const URL_CANCEL_HOUSE  = 'api_projects_cancel_house';
const URL_UPDATE_PROJECT = 'api_projects_update_text';

export class ProjectHouse extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            propal: null,
            name: '',
            url: 'https://',
            price: '',
            texteHouse: {value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte)},
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
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "price"){
            value = Inputs.textMoneyMinusInput(e, this.state[name])
        }

        this.setState({[name]: value})
    }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleModal = (identifiant, context, propal) => {
        modalFormText(this);
        modalFormPropal(this);
        modalDeletePropal(this);
        modalEndPropal(this);
        modalCancelHouse(this);
        this.setState({
            context: context, propal: propal,
            name: propal ? propal.name: "",
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

        let paramsToValidate = [{type: "text",  id: 'name', value: name}];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let method = context === "create" ? "POST" : "PUT";
            let urlName = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'project': projectId})
                : Routing.generate(URL_UPDATE_PROPAL, {'project': projectId, 'id': propal.id})

            const self = this;
            this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
            axios({ method: method, url: urlName, data: {name: name, url: url, price: price} })
                .then(function (response) {
                    self.formPropal.current.handleClose();
                    self.setState({ data: Propals.updateList(context, data, response) })
                })
                .catch(function (error) { modalFormPropal(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    handleSubmitText = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { texteHouse } = this.state;

        const self = this;
        this.formText.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
        axios({
            method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, {'type': 'house', 'id': projectId}),
            data: {texte: texteHouse}
        })
            .then(function (response) {
                self.formText.current.handleClose();

                let data = response.data;
                self.setState({
                    texteHouse: {value: Formulaire.setValue(data.textHouse), html: Formulaire.setValue(data.textHouse)},
                    textHouse: Formulaire.setValue(data.textHouse),
                })
            })
            .catch(function (error) { modalFormText(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
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

    render() {
        const { mode, houseName, houseUrl, housePrice, userId, authorId } = this.props;
        const { errors, loadData, name, url, price, data, propal, texteHouse, textHouse } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">🏠 Hébergement</div>
                {(mode || authorId === parseInt(userId))
                    ? <div className="actions">
                        <ButtonIcon type="danger" icon="trash" text="Annuler l'hébergement"
                                    onClick={() => this.handleModal('cancelHouse', 'delete', null)}
                        />
                    </div>
                    : null
                }
                <div className="actions">
                    <ButtonIcon type="warning" icon="pencil" text="Modifier" onClick={() => this.handleModal("formText")} />
                </div>
            </div>
            <div className={`project-card-body${houseName ? " selected" : ""}`}>
                <div className="propals">
                    {textHouse
                        ? <div className="propal">
                            <div dangerouslySetInnerHTML={{__html: textHouse}}></div>
                        </div>
                        : null
                    }
                    {houseName
                        ? <div className="propal selected" style={{ flexDirection: 'column' }}>
                            <div>{houseName}</div>
                            {houseUrl ? <a href={houseUrl} target="_blank" className="txt-link">
                                <span>Lien de l'hébergement</span>
                                <span className="icon-link" />
                            </a> : ""}
                            {housePrice ? <div>{Sanitaze.toFormatCurrency(housePrice)}</div> : ""}
                        </div>
                        : <>
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
                                                <span className="tooltip">Lien externe</span>
                                            </a>}
                                        </div>
                                        <div className="duration" onClick={onVote}>
                                            {el.price ? Sanitaze.toFormatCurrency(el.price) : ""}
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

                            <div className="propal">
                                <ButtonIcon type="primary" icon="add" text="Proposer un hébergement"
                                            onClick={() => this.handleModal('formPropal', 'create', null)}
                                />
                            </div>
                        </>
                    }
                </div>
            </div>

            <Modal ref={this.formText} identifiant="form-house-text" maxWidth={768} title="Modifier le texte"
                   content={<>
                       <div className="line">
                           <TinyMCE type={8} identifiant="texteHouse" valeur={texteHouse.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                               <span>Texte</span>
                           </TinyMCE>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formPropal} identifiant="form-house" maxWidth={568} title="Proposer un hébergement"
                   content={<>
                       <div className="line line-2">
                           <Input identifiant="name" valeur={name} {...params}>Nom de l'hébergement</Input>
                           <Input identifiant="price" valeur={price} {...params}>Prix de l'hébergement</Input>
                       </div>
                       <div className="line">
                           <Input identifiant="url" valeur={url} {...params}>Lien externe</Input>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-propal-house' maxWidth={414} title="Supprimer l'hébergement"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-propal-house' maxWidth={414} title="Sélectionner l'hébergement final"
                   content={<p>Etes-vous sûr de vouloir sélectionner <b>{propal ? propal.name : ""}</b> comme étant l'hébergement <b>FINAL</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelHouse} identifiant='cancel-house' maxWidth={414} title="Annuler l'hébergement sélectionnée"
                   content={<p>Etes-vous sûr de vouloir revenir sur les propositions de l'hébergement ?</p>}
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
    self.formText.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitText}>Confirmer</Button>)
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
function modalCancelHouse (self) {
    self.cancelHouse.current.handleUpdateFooter(<Button type="danger" onClick={self.handleCancelHouse}>Confirmer l'annulation</Button>)
}
