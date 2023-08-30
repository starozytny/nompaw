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
import {Input, InputFile, Radiobox, TextArea} from "@commonComponents/Elements/Fields";
import { Modal } from "@commonComponents/Elements/Modal";
import { TinyMCE } from "@commonComponents/Elements/TinyMCE";

const URL_CREATE_PROPAL = 'api_projects_propals_activity_create';
const URL_UPDATE_PROPAL = 'api_projects_propals_activity_update';
const URL_DELETE_PROPAL = 'api_projects_propals_activity_delete';
const URL_VOTE_PROPAL   = 'api_projects_propals_activity_vote';
const URL_END_PROPAL    = 'api_projects_propals_activity_end';
const URL_CANCEL_PROPAL = 'api_projects_propals_activity_cancel';
const URL_UPDATE_PROJECT = 'api_projects_update_text';

export class ProjectActivities extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            propal: null,
            name: '',
            url: 'https://',
            price: '',
            priceType: 0,
            imageFile: '',
            texteActivities: {value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte)},
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

        let paramsToValidate = [{type: "text",  id: 'name', value: name}];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let urlName = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'project': projectId})
                : Routing.generate(URL_UPDATE_PROPAL, {'project': projectId, 'id': propal.id})

            let formData = new FormData();
            formData.append("data", JSON.stringify({name: name, url: url, price: price, priceType: priceType, description: description}));

            let file = this.file.current;
            if(file.state.files.length > 0){
                formData.append("image", file.state.files[0]);
            }

            const self = this;
            this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
            axios({ method: "POST", url: urlName, data: formData, headers: {'Content-Type': 'multipart/form-data'} })
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
        const { texteActivities } = this.state;

        const self = this;
        this.formText.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
        axios({
            method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, {'type': 'activities', 'id': projectId}),
            data: {texte: texteActivities}
        })
            .then(function (response) {
                self.formText.current.handleClose();

                let data = response.data;
                self.setState({
                    texteActivities: {value: Formulaire.setValue(data.textActivities), html: Formulaire.setValue(data.textActivities)},
                    textActivities: Formulaire.setValue(data.textActivities),
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

        this.endPropal.current.handleUpdateFooter(<Button isLoader={true} type="success">Valider</Button>);
        Propals.endPropal(this, propal, URL_END_PROPAL, modalEndPropal);
    }

    handleCancelPropal = () => {
        const { propal } = this.state;

        this.cancelPropal.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer l'annulation</Button>);
        Propals.cancel(this, propal.id, URL_CANCEL_PROPAL, modalCancelPropal);
    }

    render() {
        const { mode, userId } = this.props;
        const { errors, loadData, name, url, price, priceType, description, data, propal, imageFile, texteActivities, textActivities } = this.state;

        let params = { errors: errors, onChange: this.handleChange }
        let totalPrice = 0;

        let pricesType = [
            { value: 0, label: 'par pers.', identifiant: 'act-price-type-0' },
            { value: 1, label: 'fixe',      identifiant: 'act-price-type-1' },
        ]

        if(!userId && data.length === 0 && textActivities === ""){
            return null;
        }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">💡 Activités</div>
                {userId
                    ? <div className="actions">
                        <ButtonIcon type="warning" icon="pencil" text="Modifier" onClick={() => this.handleModal("formText")} />
                    </div>
                    : null
                }
            </div>
            <div className="project-card-body">
                <div className="propals">
                    {textActivities
                        ? <div className="propal propal-text">
                            <div dangerouslySetInnerHTML={{__html: textActivities}}></div>
                        </div>
                        : null
                    }
                    {data.map((el, index) => {

                        let onVote = el.isSelected ? null : () => this.handleVote(el);

                        let active = "";
                        el.votes.forEach(v => {
                            if(v === userId){
                                active = " active"
                            }
                        })

                        totalPrice += el.isSelected && el.price ? el.price : 0;

                        let descriptionFormatted = el.description ? el.description.replaceAll("\n", "<br />") : null;

                        return <div className="propal" key={index}>
                            <div className="propal-body propal-body-with-image">
                                <div className="image" onClick={onVote}>
                                    <img src={el.imageFile} alt={"illustration " + el.name}/>
                                </div>
                                <div>
                                    <div className="name">
                                        <span onClick={onVote}>{el.name}</span>
                                        {(el.url && el.url !== "https://") && <a href={el.url} className="url-topo" target="_blank">
                                            <span className="icon-link"></span>
                                            <span className="tooltip">Lien externe</span>
                                        </a>}
                                    </div>
                                    <div className="duration" onClick={onVote}>
                                        {el.price ? Sanitaze.toFormatCurrency(el.price) + (el.priceType === 0 ? " / pers" : "") : ""}
                                    </div>
                                    {descriptionFormatted && <div className="duration" onClick={onVote}>
                                        <div dangerouslySetInnerHTML={{__html: descriptionFormatted}}></div>
                                    </div>}
                                </div>
                            </div>
                            <div className="propal-actions">
                                {mode || el.author.id === parseInt(userId)
                                    ? <>
                                        {!el.isSelected && <>
                                            <ButtonIcon icon="pencil" type="warning" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                            <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                                        </>}
                                        {mode && <>
                                            {el.isSelected
                                                ? <ButtonIcon icon="close" type="default" onClick={() => this.handleModal('cancelPropal', 'delete', el)}>Annuler</ButtonIcon>
                                                : <ButtonIcon icon="check1" type="success" onClick={() => this.handleModal("endPropal", "update", el)}>Valider</ButtonIcon>
                                            }
                                        </>}
                                    </>
                                    : null
                                }
                            </div>
                            <div className={`propal-counter${el.isSelected ? " active" : ""}`} onClick={onVote}>
                                {loadData
                                    ? <span className="icon-chart-3"/>
                                    : `+ ${el.votes.length}`
                                }
                            </div>
                        </div>
                    })}

                    {userId
                        ? <div className="propal">
                            <ButtonIcon type="primary" icon="add" text="Proposer une activité"
                                        onClick={() => this.handleModal('formPropal', 'create', null)}
                            />
                        </div>
                        : null
                    }

                </div>
            </div>

            <div className="project-card-footer project-card-footer-total">
                <div>{Sanitaze.toFormatCurrency(totalPrice)}</div>
            </div>

            <Modal ref={this.formText} identifiant="form-activities-text" maxWidth={768} title="Modifier le texte"
                   content={<>
                       <div className="line">
                           <TinyMCE type={8} identifiant="texteActivities" valeur={texteActivities.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                               <span>Texte</span>
                           </TinyMCE>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formPropal} identifiant="form-activities" maxWidth={568} margin={10} title="Proposer une activité"
                   content={<>
                       <div className="line line-3">
                           <Input identifiant="name" valeur={name} {...params}>Nom de l'activité</Input>
                           <Input identifiant="price" valeur={price} {...params}>Prix</Input>
                           <Radiobox items={pricesType} identifiant="priceType" valeur={priceType} {...params}>
                               Type de prix
                           </Radiobox>
                       </div>
                       <div className="line">
                           <Input identifiant="url" valeur={url} {...params}>Lien externe</Input>
                       </div>
                       <div className="line">
                           <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                      placeholder="Glissez et déposer une image" {...params}>
                               Illustration
                           </InputFile>
                       </div>
                       <div className="line">
                           <TextArea identifiant="description" valeur={description} {...params}>Description</TextArea>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-propal-activities' maxWidth={414} title="Supprimer l'activité"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-propal-activities' maxWidth={414} title="Sélectionner une activité validée"
                   content={<p>Etes-vous sûr de vouloir sélectionner <b>{propal ? propal.name : ""}</b> comme une activité <b className="txt-primary">validée</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelPropal} identifiant='cancel-activities' maxWidth={414} title="Annuler une activité"
                   content={<p>Etes-vous sûr de vouloir annuler cette activité ?</p>}
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
    self.formText.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitText}>Confirmer</Button>)
}
function modalFormPropal (self) {
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
function modalDeletePropal (self) {
    self.deletePropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
function modalEndPropal (self) {
    self.endPropal.current.handleUpdateFooter(<Button type="success" onClick={self.handleEndPropal}>Valider</Button>)
}
function modalCancelPropal (self) {
    self.cancelPropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleCancelPropal}>Confirmer l'annulation</Button>)
}
