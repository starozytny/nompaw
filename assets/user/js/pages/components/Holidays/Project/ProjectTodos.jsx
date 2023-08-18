import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire   from "@commonFunctions/formulaire";
import Validateur   from "@commonFunctions/validateur";
import Propals      from "@userFunctions/propals";

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { Modal } from "@commonComponents/Elements/Modal";
import { Input } from "@commonComponents/Elements/Fields";
import { TinyMCE } from "@commonComponents/Elements/TinyMCE";

const URL_CREATE_PROPAL = 'api_projects_todos_create';
const URL_UPDATE_PROPAL = 'api_projects_todos_update';
const URL_DELETE_PROPAL = 'api_projects_todos_delete';
const URL_UPDATE_PROJECT = 'api_projects_update_text';

export class ProjectTodos extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            element: null,
            name: '',
            texteTodos: {value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte)},
            textTodos: Formulaire.setValue(props.texte),
            errors: [],
            data: JSON.parse(props.donnees),
            todosChecked: []
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

    handleSubmitText = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { texteTodos } = this.state;

        const self = this;
        this.formText.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
        axios({
            method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, {'type': 'todos', 'id': projectId}),
            data: {texte: texteTodos}
        })
            .then(function (response) {
                self.formText.current.handleClose();

                let data = response.data;
                self.setState({
                    texteTodos: {value: Formulaire.setValue(data.textTodos), html: Formulaire.setValue(data.textTodos)},
                    textTodos: Formulaire.setValue(data.textTodos),
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
        const { errors, name, data, element, todosChecked, texteTodos, textTodos } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">📌🖇️ Liste des choses à prendre</div>
                <div className="actions">
                    <ButtonIcon type="warning" icon="pencil" text="Modifier" onClick={() => this.handleModal("formText")} />
                </div>
            </div>
            <div className="project-card-body selected">
                <div className="propals">
                    {textTodos
                        ? <div className="propal">
                            <div dangerouslySetInnerHTML={{__html: textTodos}}></div>
                        </div>
                        : null
                    }
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

                    <div className="propal">
                        <ButtonIcon type="primary" icon="add" text="Ajouter quelque chose"
                                    onClick={() => this.handleModal('formPropal', 'create', null)}
                        />
                    </div>
                </div>
            </div>

            <Modal ref={this.formPropal} identifiant="form-todos" maxWidth={414} title="Ajouter quelque chose"
                   content={<>
                       <div className="line">
                           <Input identifiant="name" valeur={name} {...params}>Intitulé</Input>

                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.formText} identifiant="form-todos-text" maxWidth={768} title="Modifier le texte"
                   content={<>
                       <div className="line">
                           <TinyMCE type={8} identifiant="texteTodos" valeur={texteTodos.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                               <span>Texte</span>
                           </TinyMCE>
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

function modalFormText (self) {
    self.formText.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitText}>Confirmer</Button>)
}
function modalFormPropal (self) {
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
function modalDeletePropal (self) {
    self.deletePropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
