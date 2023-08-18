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
import { Input, InputFile } from "@commonComponents/Elements/Fields";
import { Modal } from "@commonComponents/Elements/Modal";

const URL_CREATE_PROPAL = 'api_projects_propals_activity_create';
const URL_UPDATE_PROPAL = 'api_projects_propals_activity_update';
const URL_DELETE_PROPAL = 'api_projects_propals_activity_delete';
const URL_VOTE_PROPAL   = 'api_projects_propals_activity_vote';

export class ProjectActivities extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            propal: null,
            name: '',
            url: 'https://',
            price: '',
            imageFile: '',
            errors: [],
            data: JSON.parse(props.propals),
            loadData: false,
        }

        this.formPropal = React.createRef();
        this.deletePropal = React.createRef();
        this.file = React.createRef();
    }

    handleChange = (e) => {
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "price"){
            value = Inputs.textMoneyMinusInput(e, this.state[name])
        }

        this.setState({[name]: value})
    }

    handleModal = (identifiant, context, propal) => {
        modalFormPropal(this);
        modalDeletePropal(this);
        this.setState({
            context: context, propal: propal,
            name: propal ? propal.name : "",
            url: propal ? Formulaire.setValue(propal.url) : "https://",
            price: propal ? Formulaire.setValue(propal.price) : "",
            imageFile: propal ? Formulaire.setValue(propal.imageFile) : "",
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
            let urlName = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'project': projectId})
                : Routing.generate(URL_UPDATE_PROPAL, {'project': projectId, 'id': propal.id})

            let formData = new FormData();
            formData.append("data", JSON.stringify({name: name, url: url, price: price}));

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

    render() {
        const { mode, userId } = this.props;
        const { errors, loadData, name, url, price, data, propal, imageFile } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">Activités</div>
            </div>
            <div className="project-card-body">
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
                                        {el.price ? Sanitaze.toFormatCurrency(el.price) : ""}
                                    </div>
                                </div>
                            </div>
                            <div className="propal-actions propal-actions-activities">
                                {mode || el.author.id === parseInt(userId)
                                    ? <>
                                        <ButtonIcon icon="pencil" type="warning" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                        <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
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
            </div>
            <div className="project-card-footer" onClick={() => this.handleModal('formPropal', 'create', null)}>
                <div style={{display: 'flex', gap: '4px'}}>
                    <span className="icon-add"></span>
                    <span>Proposer une activité</span>
                </div>
            </div>

            <Modal ref={this.formPropal} identifiant="form-activities" maxWidth={568} margin={10} title="Proposer une activité"
                   content={<>
                       <div className="line line-2">
                           <Input identifiant="name" valeur={name} {...params}>Nom de l'activité</Input>
                           <Input identifiant="price" valeur={price} {...params}>Prix de l'activité</Input>
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
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-propal-activities' maxWidth={414} title="Supprimer l'activité"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
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

function modalFormPropal (self) {
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
function modalDeletePropal (self) {
    self.deletePropal.current.handleUpdateFooter(<Button type="danger" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}
