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

const URL_CREATE_PROPAL = 'api_birthdays_presents_create';
const URL_UPDATE_PROPAL = 'api_birthdays_presents_update';
const URL_DELETE_PROPAL = 'api_birthdays_presents_delete';
const URL_END_PROPAL    = 'api_birthdays_presents_end';
const URL_CANCEL_PROPAL = 'api_birthdays_presents_cancel';

export class Presents extends Component{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            propal: null,
            name: '',
            url: 'https://',
            price: '',
            priceMax: '',
            imageFile: '',
            guest: props.userId ? props.userId : "",
            guestName: props.userDisplay ? props.userDisplay : "",
            errors: [],
            data: JSON.parse(props.donnees),
            loadData: false,
        }

        this.file = React.createRef();

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

    handleModal = (identifiant, context, propal) => {
        const { userId, userDisplay } = this.props;

        modalFormPropal(this);
        modalDeletePropal(this);
        modalEndPropal(this);
        modalCancelPropal(this);
        this.setState({
            context: context, propal: propal,
            name: propal ? propal.name : "",
            url: propal ? Formulaire.setValue(propal.url) : "https://",
            price: propal ? Formulaire.setValue(propal.price) : "",
            priceMax: propal ? Formulaire.setValue(propal.priceMax) : "",
            imageFile: propal ? Formulaire.setValue(propal.imageFile) : "",
            guest: propal ? Formulaire.setValue(propal.guest, userId) : userId,
            guestName: propal ? Formulaire.setValue(propal.guestName, userDisplay) : userDisplay,
        })
        this[identifiant].current.handleClick();
    }

    handleSubmitPropal = (e) => {
        e.preventDefault();

        const { birthdayId } = this.props;
        const { context, propal, name, url, price, priceMax, data } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [{type: "text",  id: 'name', value: name}];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let urlName = context === "create"
                ? Routing.generate(URL_CREATE_PROPAL, {'birthday': birthdayId})
                : Routing.generate(URL_UPDATE_PROPAL, {'birthday': birthdayId, 'id': propal.id})

            let formData = new FormData();
            formData.append("data", JSON.stringify({name: name, url: url, price: price, priceMax: priceMax}));

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

    handleEndPropal = () => {
        const { propal, guest, guestName } = this.state;

        this.endPropal.current.handleUpdateFooter(<Button isLoader={true} type="success">Valider</Button>);
        Propals.endPropal(this, propal, URL_END_PROPAL, modalEndPropal, {guest: guest, guestName: guestName});
    }

    handleCancelPropal = () => {
        const { propal } = this.state;

        this.cancelPropal.current.handleUpdateFooter(<Button isLoader={true} type="danger">Confirmer l'annulation</Button>);
        Propals.cancel(this, propal.id, URL_CANCEL_PROPAL, modalCancelPropal);
    }

    render() {
        const { mode, userId, isAdmin } = this.props;
        const { errors, loadData, name, url, price, priceMax, data, propal, imageFile, guestName } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        if(!userId && data.length === 0){
            return null;
        }

        return <div className="birthday-card">
            <div className="birthday-card-header">
                <div className="name">🎁 Cadeaux</div>
            </div>
            <div className="birthday-card-body">
                <div className="propals">
                    <div className="propal propal-text">
                        <div>
                            Connectez-vous pour modifier votre choix et profiter au max des fonctionnalités de Nompaw,
                            sinon il faudra contacter le responsable du groupe si vous souhaiter annuler votre choix.
                            <br/>
                            Cliquez sur le bouton <span className="txt-primary">bleu</span> pour annoncer que vous prenez ce cadeau !
                        </div>
                    </div>
                    {data.map((el, index) => {
                        return <div className={`propal${el.isSelected ? " active " : " "}propal-presents`} key={index}>
                            <div className="propal-body propal-body-with-image">
                                <div className="image">
                                    <img src={el.imageFile} alt={"illustration " + el.name}/>
                                </div>
                                <div>
                                    <div className="name">
                                        <span>{el.name} {el.isSelected
                                            ? <span className="txt-danger">[Pris par {el.guestName}{isAdmin === "1" && el.guest && el.guestName === "Anonyme"
                                                ? " - #" + el.guest.displayName
                                                : ""
                                            }]</span>
                                            : ""
                                        }
                                        </span>
                                        {(el.url && el.url !== "https://") && <a href={el.url} className="url-topo" target="_blank">
                                            <span className="icon-link"></span>
                                            <span className="tooltip">Lien externe</span>
                                        </a>}
                                    </div>
                                    <div className="duration">
                                        {el.price ? Sanitaze.toFormatCurrency(el.price) : ""} {el.priceMax ? " - " + Sanitaze.toFormatCurrency(el.priceMax) : ""}
                                    </div>
                                </div>
                            </div>
                            <div className="propal-actions">
                                {mode || el.author.id === parseInt(userId) || (el.guest && el.guest.id === parseInt(userId))
                                    ? <>
                                        {el.isSelected
                                            ? <ButtonIcon icon="close" type="default" onClick={() => this.handleModal('cancelPropal', 'delete', el)}>Annuler</ButtonIcon>
                                            : <>
                                                <ButtonIcon icon="pencil" type="warning" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                                <ButtonIcon icon="trash" type="danger" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                                            </>
                                        }
                                    </>
                                    : null
                                }
                                {!el.isSelected && <ButtonIcon icon="cart" type="primary" onClick={() => this.handleModal("endPropal", "update", el)}>Prendre</ButtonIcon>}
                            </div>
                            <div className={`propal-counter${el.isSelected ? " active" : ""}`}>
                                {loadData
                                    ? <span className="icon-chart-3"/>
                                    : (el.isSelected ? "Pris" : "Dispo")
                                }
                            </div>
                        </div>
                    })}

                    {userId
                        ? <div className="propal">
                            <ButtonIcon type="primary" icon="add" text="Proposer un cadeau"
                                        onClick={() => this.handleModal('formPropal', 'create', null)}
                            />
                        </div>
                        : null
                    }

                </div>
            </div>

            <Modal ref={this.formPropal} identifiant="form-presents" maxWidth={568} margin={10} title="Proposer un cadeau"
                   content={<>
                       <div className="line line-3">
                           <Input identifiant="name" valeur={name} {...params}>Nom du cadeau</Input>
                           <Input identifiant="price" valeur={price} {...params}>Prix min ou réel</Input>
                           <Input identifiant="priceMax" valeur={priceMax} {...params}>Prix max (facultatif)</Input>
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

            <Modal ref={this.deletePropal} identifiant='delete-presents' maxWidth={414} title="Supprimer le cadeau"
                   content={<p>Etes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.endPropal} identifiant='end-presents' maxWidth={414} title="Prendre ce cadeau"
                   content={<>
                       <p>Etes-vous sûr de vouloir <b className="txt-primary">prendre</b> le cadeau <b>{propal ? propal.name : ""}</b> ?</p>
                       <div className="line" style={{ marginTop: "12px" }}>
                           <Input identifiant="guestName" valeur={guestName} {...params}>Qui es-tu ? (facultatif)</Input>
                       </div>
                       <p>Si vous changez d'avis, vous devrez contacter le responsable du groupe.</p>
                   </>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.cancelPropal} identifiant='cancel-presents' maxWidth={414} title="Annuler un cadeau"
                   content={<p>Etes-vous sûr de vouloir annuler ce cadeau ?</p>}
                   footer={null} closeTxt="Annuler" />
        </div>
    }
}

Presents.propTypes = {
    mode: PropTypes.bool.isRequired,
    userId: PropTypes.string.isRequired,
    birthdayId: PropTypes.string.isRequired,
    donnees: PropTypes.string.isRequired,
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
