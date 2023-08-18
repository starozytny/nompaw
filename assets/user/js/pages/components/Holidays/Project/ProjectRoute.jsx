import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire   from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { Modal } from "@commonComponents/Elements/Modal";
import { Input } from "@commonComponents/Elements/Fields";
import { TinyMCE } from "@commonComponents/Elements/TinyMCE";

const URL_UPDATE_PROJECT = 'api_projects_update_text';

export class ProjectRoute extends Component{
    constructor(props) {
        super(props);

        this.state = {
            texte: {value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte)},
            iframe: Formulaire.setValue(props.iframe),
            iframeRoute: Formulaire.setValue(props.iframe),
            textRoute: Formulaire.setValue(props.texte),
            errors: [],
        }

        this.formPropal = React.createRef();
    }

    handleChange = (e) => { this.setState({[e.currentTarget.name]: e.currentTarget.value}) }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleModal = (identifiant) => {
        modalFormPropal(this);
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { texte, iframe } = this.state;

        const self = this;
        this.formPropal.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
        axios({
            method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, {'type': 'route', 'id': projectId}),
            data: {texte: texte, iframe: iframe}
        })
            .then(function (response) {
                self.formPropal.current.handleClose();

                let data = response.data;
                self.setState({
                    texte: {value: Formulaire.setValue(data.textRoute), html: Formulaire.setValue(data.textRoute)},
                    iframe: Formulaire.setValue(data.iframeRoute),
                    iframeRoute: Formulaire.setValue(data.iframeRoute),
                    textRoute: Formulaire.setValue(data.textRoute),
                })
            })
            .catch(function (error) { modalFormPropal(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    render() {
        const { errors, texte, iframe, textRoute, iframeRoute } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">🚓 Trajet</div>
                <div className="actions">
                    <ButtonIcon type="warning" icon="pencil" text="Modifier" onClick={() => this.handleModal("formPropal")} />
                </div>
            </div>
            <div className="project-card-body selected">
                <div className="propals">
                    <div className="propal propal-route">
                        <div dangerouslySetInnerHTML={{__html: textRoute}}></div>
                        <div className="iframe-route" dangerouslySetInnerHTML={{__html: iframeRoute}}></div>
                    </div>
                </div>
            </div>

            <Modal ref={this.formPropal} identifiant="form-route" maxWidth={768} title="Modifier la partie Route"
                   content={<>
                       <div className="line">
                           <TinyMCE type={8} identifiant="texte" valeur={texte.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                               <span>Texte</span>
                           </TinyMCE>
                       </div>
                       <div className="line">
                           <Input identifiant="iframe" valeur={iframe} {...params}>Iframe</Input>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

ProjectRoute.propTypes = {
    projectId: PropTypes.string.isRequired
}

function modalFormPropal (self) {
    self.formPropal.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}
