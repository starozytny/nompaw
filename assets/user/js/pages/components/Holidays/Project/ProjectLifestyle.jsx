import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire   from "@commonFunctions/formulaire";
import Validateur   from "@commonFunctions/validateur";
import Sanitaze     from "@commonFunctions/sanitaze";
import Propals      from "@userFunctions/propals";

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { Modal } from "@commonComponents/Elements/Modal";
import {Input, Radiobox} from "@commonComponents/Elements/Fields";
import { TinyMCE } from "@commonComponents/Elements/TinyMCE";

const URL_CREATE_PROPAL = 'api_projects_lifestyle_create';
const URL_UPDATE_PROPAL = 'api_projects_lifestyle_update';
const URL_DELETE_PROPAL = 'api_projects_lifestyle_delete';
const URL_UPDATE_PROJECT = 'api_projects_update_text';

export class ProjectLifestyle extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            element: null,
            name: '',
            unit: '',
            price: '',
            priceType: 0,
            texteLifestyle: {value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte)},
            textLifestyle: Formulaire.setValue(props.texte),
            errors: [],
            data: JSON.parse(props.donnees),
        }

        this.formText = React.createRef();
        this.formPropal = React.createRef();
        this.deletePropal = React.createRef();
    }

    handleChange = (e) => { this.setState({[e.currentTarget.name]: e.currentTarget.value}) }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleModal = (identifiant, context, element) => {
        modalFormText(this);
        modalFormPropal(this);
        modalDeletePropal(this);
        this.setState({
            context: context, element: element,
            name: element ? element.name : "",
            unit: element ? Formulaire.setValue(element.unit) : "",
            price: element ? Formulaire.setValue(element.price) : "",
            priceType: element ? Formulaire.setValue(element.priceType) : 0,
        })
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { context, element, name, unit, price, priceType, data } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [{type: "text",  id: 'name', value: name}];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let method  = context === "create" ? "POST" : "PUT";
            let urlName = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'project': projectId})
                : Routing.generate(URL_UPDATE_PROPAL, {'project': projectId, 'id': element.id})

            const self = this;
            this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
            axios({ method: method, url: urlName, data: {name: name, unit: unit, price: price, priceType: priceType} })
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
        const { texteLifestyle } = this.state;

        const self = this;
        this.formText.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
        axios({
            method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, {'type': 'lifestyle', 'id': projectId}),
            data: {texte: texteLifestyle}
        })
            .then(function (response) {
                self.formText.current.handleClose();

                let data = response.data;
                self.setState({
                    texteLifestyle: {value: Formulaire.setValue(data.textLifestyle), html: Formulaire.setValue(data.textLifestyle)},
                    textLifestyle: Formulaire.setValue(data.textLifestyle),
                })
            })
            .catch(function (error) { modalFormText(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    handleDeletePropal = () => {
        const { element, data } = this.state;

        this.deletePropal.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer la suppression</Button>);
        Propals.deletePropal(this, this.deletePropal, element, data, URL_DELETE_PROPAL, modalDeletePropal);
    }

    render() {
        const { userId } = this.props;
        const { errors, name, unit, price, priceType, data, element, texteLifestyle, textLifestyle } = this.state;

        let params = { errors: errors, onChange: this.handleChange }
        let totalPrice = 0;

        let pricesType = [
            { value: 0, label: 'par pers.', identifiant: 'life-price-type-0' },
            { value: 1, label: 'fixe',      identifiant: 'life-price-type-1' },
        ]

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">✨ Style de vie</div>
                {userId
                    ? <div className="actions">
                        <ButtonIcon type="warning" icon="pencil" text="Modifier" onClick={() => this.handleModal("formText")} />
                    </div>
                    : null
                }
            </div>
            <div className="project-card-body">
                <div className="propals">
                    {textLifestyle
                        ? <div className="propal propal-text">
                            <div dangerouslySetInnerHTML={{__html: textLifestyle}}></div>
                        </div>
                        : null
                    }
                    {data.map((el, index) => {

                        totalPrice += el.price ? el.price : 0;

                        return <div className="propal" key={index}>
                            <div className="propal-body propal-body-lifestyle">
                                <div className="name">
                                    <span>{el.name}</span> <span>{el.unit ? "(" + el.unit + ")" : ""}</span>
                                </div>
                                <div className="duration">
                                    {el.price ? Sanitaze.toFormatCurrency(el.price) + (el.priceType === 0 ? " / pers" : "") : ""}
                                </div>
                            </div>
                            {userId
                                ? <div className="propal-actions propal-actions-lifestyle">
                                    <ButtonIcon icon="pencil" type="warning" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                    <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                                </div>
                                : null
                            }
                        </div>
                    })}

                    {userId
                        ? <div className="propal">
                            <ButtonIcon type="primary" icon="add" text="Ajouter une dépense"
                                        onClick={() => this.handleModal('formPropal', 'create', null)}
                            />
                        </div>
                        : null
                    }
                </div>
            </div>

            <div className="project-card-footer project-card-footer-total">
                <div>
                    {Sanitaze.toFormatCurrency(totalPrice)}
                </div>
            </div>

            <Modal ref={this.formText} identifiant="form-lifestyle-text" maxWidth={768} title="Modifier le texte"
                   content={<>
                       <div className="line">
                           <TinyMCE type={8} identifiant="texteLifestyle" valeur={texteLifestyle.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                               <span>Texte</span>
                           </TinyMCE>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formPropal} identifiant="form-lifestyle" maxWidth={568} title="Ajouter une dépense"
                   content={<>
                       <div className="line line-3">
                           <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
                           <Input identifiant="unit" valeur={unit} {...params}>Unité</Input>
                           <Input identifiant="price" valeur={price} {...params}>Prix</Input>
                       </div>
                       <div className="line">
                           <Radiobox items={pricesType} identifiant="priceType" valeur={priceType} {...params}>
                               Type de prix
                           </Radiobox>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-lifestyle' maxWidth={414} title="Supprimer"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{element ? element.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

ProjectLifestyle.propTypes = {
    projectId: PropTypes.string.isRequired,
    donnees: PropTypes.string.isRequired,
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
