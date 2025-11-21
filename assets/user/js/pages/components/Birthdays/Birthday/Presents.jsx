import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Inputs from "@commonFunctions/inputs";
import Propals from "@userFunctions/propals";
import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Input, InputFile, TextArea } from "@tailwindComponents/Elements/Fields";

const URL_CREATE_PROPAL = 'intern_api_birthdays_presents_create';
const URL_UPDATE_PROPAL = 'intern_api_birthdays_presents_update';
const URL_DELETE_PROPAL = 'intern_api_birthdays_presents_delete';
const URL_END_PROPAL = 'intern_api_birthdays_presents_end';
const URL_CANCEL_PROPAL = 'intern_api_birthdays_presents_cancel';

export class Presents extends Component {
	constructor (props) {
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
			description: '',
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
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "price" || name === "priceMax") {
			value = Inputs.textMoneyMinusInput(value, this.state[name])
		}

		this.setState({ [name]: value })
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
			description: propal ? Formulaire.setValue(propal.description) : "",
		})
		this[identifiant].current.handleClick();
	}

	handleSubmitPropal = (e) => {
		e.preventDefault();

		const { birthdayId } = this.props;
		const { context, propal, name, url, price, priceMax, description, data } = this.state;

		this.setState({ errors: [] });

		let paramsToValidate = [{ type: "text", id: 'name', value: name }];

		let validate = Validateur.validateur(paramsToValidate)
		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			let urlName = context === "create"
				? Routing.generate(URL_CREATE_PROPAL, { 'birthday': birthdayId })
				: Routing.generate(URL_UPDATE_PROPAL, { 'birthday': birthdayId, 'id': propal.id })

			let formData = new FormData();
			formData.append("data", JSON.stringify({ name: name, url: url, price: price, priceMax: priceMax, description: description }));

			let file = this.file.current;
			if (file.state.files.length > 0) {
				formData.append("image", file.state.files[0]);
			}

			const self = this;
			this.formPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
			axios({ method: "POST", url: urlName, data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
				.then(function (response) {
					self.formPropal.current.handleClose();
					self.setState({ data: Propals.updateList(context, data, response) })
				})
				.catch(function (error) {
					modalFormPropal(self);
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
			;
		}
	}

	handleDeletePropal = () => {
		const { propal, data } = this.state;

		this.deletePropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		Propals.deletePropal(this, this.deletePropal, propal, data, URL_DELETE_PROPAL, modalDeletePropal);
	}

	handleEndPropal = () => {
		const { propal, guest, guestName } = this.state;

		this.endPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="green">Valider</Button>);
		Propals.endPropal(this, propal, URL_END_PROPAL, modalEndPropal, { guest: guest, guestName: guestName });
	}

	handleCancelPropal = () => {
		const { propal } = this.state;

		this.cancelPropal.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer l'annulation</Button>);
		Propals.cancel(this, propal.id, URL_CANCEL_PROPAL, modalCancelPropal);
	}

	render () {
		const { mode, userId, isAdmin } = this.props;
		const { errors, loadData, name, url, price, priceMax, description, data, propal, imageFile, guestName } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		if (!userId && data.length === 0) {
			return null;
		}

		return <div className="bg-white border rounded-md max-w-screen-lg">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md flex justify-between gap-2">
                <div className="font-semibold text-xl">🎁 Cadeaux</div>
			</div>
            <div className="p-4">
                <div className="pb-4 mb-4 border-b text-gray-600">
                    <div>
                        Connectez-vous pour modifier votre choix et profiter au max des fonctionnalités de Nompaw,
                        sinon il faudra contacter le responsable du groupe si vous souhaiter annuler votre choix.
                        <br />
                        Cliquez sur le bouton <span className="text-blue-700">bleu</span> pour annoncer que vous prenez ce cadeau !
                    </div>
                </div>
                <div className="flex flex-col divide-y">
                    {data.map((el, index) => {

                        let descriptionFormatted = el.description ? el.description.replaceAll("\n", "<br />") : null;

                        let active = !!el.isSelected;

                        return <div className={`flex items-center justify-between gap-2 py-4 ${active ? "opacity-60" : ""}`} key={index}>
                            <div className="flex gap-2">
                                <div className="h-32 w-32 overflow-hidden rounded-md bg-gray-100">
                                    <img src={el.imageFile} alt={"illustration " + el.name} className="h-32 w-full object-contain" />
                                </div>
                                <div className="w-full">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{el.name} {el.isSelected
                                            ? <span className="text-red-500">[Pris par {el.guestName}{isAdmin === "1" && el.guest && el.guestName === "Anonyme"
                                                ? " - #" + el.guest.displayName
                                                : ""
                                            }]</span>
                                            : ""
                                        }
                                        </span>
                                        {(el.url && el.url !== "https://") && <a href={el.url} className="url-topo relative text-blue-700" target="_blank">
                                            <span className="icon-link"></span>
                                            <span className="tooltip bg-gray-300 py-1 px-2 rounded absolute -top-7 right-0 text-xs text-gray-600 hidden" style={{ width: '84px' }}>
                                                Lien externe
                                            </span>
                                        </a>}
                                    </div>
                                    <div className="text-gray-600 text-sm">
                                        {el.price ? Sanitaze.toFormatCurrency(el.price) : ""} {el.priceMax ? " - " + Sanitaze.toFormatCurrency(el.priceMax) : ""}
                                    </div>
                                    {descriptionFormatted && <div className="text-gray-600 text-sm mt-2">
                                        <div dangerouslySetInnerHTML={{ __html: descriptionFormatted }}></div>
                                    </div>}
                                </div>
                            </div>

                            <div>
                                <div className="flex gap-2">
                                    <div className="flex gap-1">
                                        {mode || el.author.id === parseInt(userId) || (el.guest && el.guest.id === parseInt(userId))
                                            ? <>
                                                {el.isSelected
                                                    ? <ButtonIcon icon="close" type="default" onClick={() => this.handleModal('cancelPropal', 'delete', el)}>Annuler</ButtonIcon>
                                                    : <>
                                                        <ButtonIcon icon="pencil" type="yellow" onClick={() => this.handleModal("formPropal", "update", el)}>Modifier</ButtonIcon>
                                                        <ButtonIcon icon="trash" type="red" onClick={() => this.handleModal("deletePropal", "delete", el)}>Supprimer</ButtonIcon>
                                                    </>
                                                }
                                            </>
                                            : null
                                        }
                                        {!el.isSelected && <ButtonIcon icon="cart" type="blue" onClick={() => this.handleModal("endPropal", "update", el)}>Prendre</ButtonIcon>}
                                    </div>
                                    <div className={`${el.isSelected ? "bg-red-200" : "bg-gray-200"} px-2 py-0.5 text-xs rounded-md flex items-center justify-center`}>
                                        {loadData
                                            ? <span className="icon-chart-3" />
                                            : (el.isSelected ? "Pris" : "Dispo")
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    })}

                    {userId
                        ? <div className="mt-4 pt-4 flex justify-end">
                            <Button type="blue" iconLeft="add"
                                    onClick={() => this.handleModal('formPropal', 'create', null)}
                            >
                                Proposer un cadeau
                            </Button>
                        </div>
                        : null
                    }

                </div>
            </div>

            <Modal ref={this.formPropal} identifiant="form-presents" maxWidth={568} margin={10} title="Proposer un cadeau"
                   content={<div className="flex flex-col gap-4">
                       <div className="flex flex-col gap-4 sm:flex-row">
                           <div className="w-full">
                               <Input identifiant="name" valeur={name} {...params}>Nom du cadeau</Input>
                           </div>
                           <div className="w-full">
                               <Input identifiant="price" valeur={price} {...params}>Prix min ou réel</Input>
                           </div>
                           <div className="w-full">
                               <Input identifiant="priceMax" valeur={priceMax} {...params}>Prix max (facultatif)</Input>
                           </div>
                       </div>
                       <div>
                           <Input identifiant="url" valeur={url} {...params}>Lien externe</Input>
                       </div>
                       <div>
                           <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                      placeholder="Glissez et déposer une image" {...params}>
                               Illustration
                           </InputFile>
                       </div>
                       <div>
                           <TextArea identifiant="description" valeur={description} {...params}>Description</TextArea>
                       </div>
                   </div>}
                   footer={null} closeTxt="Annuler" />

            <Modal ref={this.deletePropal} identifiant='delete-presents' maxWidth={414} title="Supprimer le cadeau"
                   content={<p>Êtes-vous sûr de vouloir supprimer <b>{propal ? propal.name : ""}</b> ?</p>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.endPropal} identifiant='end-presents' maxWidth={414} title="Prendre ce cadeau"
				   content={<div className="flex flex-col gap-4">
					   <div>
						   <Input identifiant="guestName" valeur={guestName} {...params}>Qui es-tu ? (facultatif)</Input>
					   </div>
					   <p>Êtes-vous sûr de vouloir <b className="text-blue-700">prendre</b> le cadeau <b>{propal ? propal.name : ""}</b> ?</p>
				   </div>}
				   footer={null} closeTxt="Annuler" />

			<Modal ref={this.cancelPropal} identifiant='cancel-presents' maxWidth={414} title="Annuler un cadeau"
				   content={<p>Êtes-vous sûr de vouloir annuler ce cadeau ?</p>}
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
	self.formPropal.current.handleUpdateFooter(<Button type="blue" onClick={self.handleSubmitPropal}>Confirmer</Button>)
}

function modalDeletePropal (self) {
	self.deletePropal.current.handleUpdateFooter(<Button type="red" onClick={self.handleDeletePropal}>Confirmer la suppression</Button>)
}

function modalEndPropal (self) {
	self.endPropal.current.handleUpdateFooter(<Button type="green" onClick={self.handleEndPropal}>Valider</Button>)
}

function modalCancelPropal (self) {
	self.cancelPropal.current.handleUpdateFooter(<Button type="red" onClick={self.handleCancelPropal}>Confirmer l'annulation</Button>)
}
