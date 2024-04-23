import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze   from "@commonFunctions/sanitaze";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import Inputs from "@commonFunctions/inputs";

const URL_UPDATE_PROJECT = 'intern_api_projects_update_text';

export class ProjectRoute extends Component{
    constructor(props) {
        super(props);

        this.state = {
            texte: {value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte)},
            iframe: Formulaire.setValue(props.iframe),
            price: Formulaire.setValue(props.price),
            iframeRoute: Formulaire.setValue(props.iframe),
            textRoute: Formulaire.setValue(props.texte),
            priceRoute: Formulaire.setValue(props.price),
            errors: [],
        }

        this.formText = React.createRef();
    }

    handleChange = (e) => {
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "price"){
            value = Inputs.textMoneyMinusInput(value, this.state[name])
        }

        this.setState({[name]: value})
    }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleModal = (identifiant) => {
        modalFormText(this);
        this[identifiant].current.handleClick();
    }

    handleSubmitText = (e) => {
        e.preventDefault();

        const { projectId } = this.props;
        const { texte, iframe, price } = this.state;

        const self = this;
        this.formText.current.handleUpdateFooter(<Button isLoader={true} type="primary">Confirmer</Button>);
        axios({
            method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, {'type': 'route', 'id': projectId}),
            data: {texte: texte, iframe: iframe, price: price}
        })
            .then(function (response) {
                self.formText.current.handleClose();

                let data = response.data;
                self.setState({
                    texte: {value: Formulaire.setValue(data.textRoute), html: Formulaire.setValue(data.textRoute)},
                    iframe: Formulaire.setValue(data.iframeRoute),
                    price: Formulaire.setValue(data.priceRoute),
                    iframeRoute: Formulaire.setValue(data.iframeRoute),
                    textRoute: Formulaire.setValue(data.textRoute),
                    priceRoute: Formulaire.setValue(data.priceRoute),
                })
            })
            .catch(function (error) { modalFormText(self); Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    render() {
        const { userId } = this.props;
        const { errors, texte, iframe, price, textRoute, iframeRoute, priceRoute } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        if(!userId && priceRoute === "" && textRoute === "" && iframeRoute === ""){
            return null;
        }

        return <div className="project-card">
            <div className="project-card-header">
                <div className="name">🚓 Trajet</div>
                {userId
                    ? <div className="actions">
                        <ButtonIcon type="warning" icon="pencil" text="Modifier" onClick={() => this.handleModal("formText")} />
                    </div>
                    : null
                }
            </div>
            <div className="project-card-body">
                <div className="propals">
                    <div className="propal propal-route">
                        <div dangerouslySetInnerHTML={{__html: textRoute}}></div>
                        <div className="iframe-route" dangerouslySetInnerHTML={{__html: iframeRoute}}></div>
                    </div>
                </div>
            </div>

            <div className="project-card-footer project-card-footer-total">
                <div>
                    {Sanitaze.toFormatCurrency(priceRoute)}
                </div>
            </div>

            <Modal ref={this.formText} identifiant="form-route" maxWidth={768} margin={5} title="Modifier la partie Route"
                   content={<>
                       <div className="line">
                           <TinyMCE type={8} identifiant="texte" valeur={texte.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                               <span>Texte</span>
                           </TinyMCE>
                       </div>
                       <div className="line">
                           <Input identifiant="iframe" valeur={iframe} {...params}>Iframe</Input>
                       </div>
                       <div className="line">
                           <Input identifiant="price" valeur={price} {...params}>Prix</Input>
                       </div>
                   </>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

ProjectRoute.propTypes = {
    projectId: PropTypes.string.isRequired
}

function modalFormText (self) {
    self.formText.current.handleUpdateFooter(<Button type="primary" onClick={self.handleSubmitText}>Confirmer</Button>)
}
