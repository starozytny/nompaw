import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire   from "@commonFunctions/formulaire";
import Validateur   from "@commonFunctions/validateur";
import Propals      from "@userFunctions/propals";

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { Modal }    from "@commonComponents/Elements/Modal";
import { Input } from "@commonComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'api_projects_todos_create';
const URL_UPDATE_PROPAL = 'api_projects_todos_update';
const URL_DELETE_PROPAL = 'api_projects_todos_delete';

export class ProjectTodos extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            element: null,
            name: '',
            errors: [],
            data: JSON.parse(props.donnees),
            todosChecked: []
        }

        this.formPropal = React.createRef();
        this.deletePropal = React.createRef();
    }

    handleChange = (e, picker) => { this.setState({[e.currentTarget.name]: e.currentTarget.value}) }

    handleModal = (identifiant, context, element) => {
        modalFormPropal(this);
        modalDeletePropal(this);
        this.setState({
            context: context, element: element,
            name: element ? element.name: "",
        })
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { context, element, name, data } = this.state;

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
            axios({ method: method, url: urlName, data: {name: name} })
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

    handleCheck = (name) => {
        const { todosChecked } = this.state;

        let nData = [];
        if(todosChecked.includes(name)){
            nData = todosChecked.filter(d => { return d !== name })
        }else{
            nData = todosChecked;
            nData.push(name);
        }

        this.setState({ todosChecked: nData });
    }

    render() {
        const { errors, name, data, element, todosChecked } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">📌🖇️ Liste des choses à prendre</div>
            </div>
            <div className="project-card-body">
                <div className="propals">
                    {data.map((el, index) => {

                        let onVote = () => this.handleCheck(el.name);

                        let active = "";
                        todosChecked.forEach(v => {
                            if(v === el.name){
                                active = " active"
                            }
                        })

                        return <div className="propal" key={index}>
                            <div className={`selector${active}`}></div>
                            <div className="propal-body propal-body-todos" onClick={onVote}>
                                <div className="name">
                                    <span>{el.name}</span>
                                </div>
                            </div>
                            <div className="propal-actions propal-actions-activities">
                                <ButtonIcon icon="pencil" type="warning" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                            </div>
                        </div>
                    })}
                </div>
            </div>
            <div className="project-card-footer" onClick={() => this.handleModal('formPropal', 'create', null)}>
                <div style={{display: 'flex', gap: '4px'}}>
                    <span className="icon-add"></span>
                    <span>Ajouter</span>
                </div>
            </div>

            <Modal ref={this.formPropal} identifiant="form-todos" maxWidth={414} title="Ajouter"
                   content={<>
                       <div className="line">
                           <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>

                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-todos' maxWidth={414} title="Supprimer"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{element ? element.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

ProjectTodos.propTypes = {
    projectId: PropTypes.string.isRequired,
    donnees: PropTypes.string.isRequired,
}

function modalFormPropal (self) {
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
function modalDeletePropal (self) {
    self.deletePropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
