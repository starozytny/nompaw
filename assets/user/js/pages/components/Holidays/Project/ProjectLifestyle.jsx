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
import { Input } from "@commonComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'api_projects_lifestyle_create';
const URL_UPDATE_PROPAL = 'api_projects_lifestyle_update';
const URL_DELETE_PROPAL = 'api_projects_lifestyle_delete';

export class ProjectLifestyle extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            element: null,
            name: '',
            unit: '',
            price: '',
            errors: [],
            data: JSON.parse(props.donnees),
        }

        this.formPropal = React.createRef();
        this.deletePropal = React.createRef();
    }

    handleChange = (e) => { this.setState({[e.currentTarget.name]: e.currentTarget.value}) }

    handleModal = (identifiant, context, element) => {
        modalFormPropal(this);
        modalDeletePropal(this);
        this.setState({
            context: context, element: element,
            name: element ? element.name : "",
            unit: element ? Formulaire.setValue(element.unit) : "",
            price: element ? Formulaire.setValue(element.price) : "",
        })
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { context, element, name, unit, price, data } = this.state;

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
            axios({ method: method, url: urlName, data: {name: name, unit: unit, price: price} })
                .then(function (response) {
                    self.formPropal.current.handleClose();
                    self.setState({ data: Propals.updateList(context, data, response) })
                })
                .catch(function (error) { modalFormPropal(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    handleDeletePropal = () => {
        const { element, data } = this.state;

        this.deletePropal.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer la suppression</Button>);
        Propals.deletePropal(this, this.deletePropal, element, data, URL_DELETE_PROPAL, modalDeletePropal);
    }

    render() {
        const { errors, name, unit, price, data, element } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">✨ Style de vie</div>
            </div>
            <div className="project-card-body selected">
                <div className="propals">
                    {data.map((el, index) => {
                        return <div className="propal" key={index}>
                            <div className="propal-body propal-body-lifestyle">
                                <div className="name">
                                    <span>{el.name}</span> <span>{el.unit ? "(" + el.unit + ")" : ""}</span>
                                </div>
                                <div className="duration">
                                    {el.price ? Sanitaze.toFormatCurrency(el.price) : ""}
                                </div>
                            </div>
                            <div className="propal-actions propal-actions-activities">
                                <ButtonIcon icon="pencil" type="warning" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                            </div>
                        </div>
                    })}
                    <div className="propal">
                        <ButtonIcon type="primary" icon="add" text="Ajouter une dépense"
                                    onClick={() => this.handleModal('formPropal', 'create', null)}
                        />
                    </div>
                </div>
            </div>

            <Modal ref={this.formPropal} identifiant="form-lifestyle" maxWidth={568} title="Ajouter une dépense"
                   content={<>
                       <div className="line line-3">
                           <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>
                           <Input identifiant="unit" valeur={unit} {...params}>Unité</Input>
                           <Input identifiant="price" valeur={price} {...params}>Prix</Input>
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

function modalFormPropal (self) {
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
function modalDeletePropal (self) {
    self.deletePropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
