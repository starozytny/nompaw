import React, { Component } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import Inputs from "@commonFunctions/inputs";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_UPDATE_PROJECT = 'intern_api_projects_update_text';

export class ProjectRoute extends Component {
	constructor (props) {
		super(props);

		this.state = {
			texte: { value: Formulaire.setValue(props.texte), html: Formulaire.setValue(props.texte) },
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
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;

		if (name === "price") {
			value = Inputs.textMoneyMinusInput(value, this.state[name])
		}

		this.setState({ [name]: value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
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
		this.formText.current.handleUpdateFooter(<Button isLoader={true} type="blue">Confirmer</Button>);
		axios({
			method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, { 'type': 'route', 'id': projectId }),
			data: { texte: texte, iframe: iframe, price: price }
		})
			.then(function (response) {
				self.formText.current.handleClose();

				let data = response.data;
				self.setState({
					texte: { value: Formulaire.setValue(data.textRoute), html: Formulaire.setValue(data.textRoute) },
					iframe: Formulaire.setValue(data.iframeRoute),
					price: Formulaire.setValue(data.priceRoute),
					iframeRoute: Formulaire.setValue(data.iframeRoute),
					textRoute: Formulaire.setValue(data.textRoute),
					priceRoute: Formulaire.setValue(data.priceRoute),
				})
			})
			.catch(function (error) {
				modalFormText(self);
				Formulaire.displayErrors(self, error);
				Formulaire.loader(false);
			})
		;
	}

	render () {
		const { userId } = this.props;
		const { errors, texte, iframe, price, textRoute, iframeRoute, priceRoute } = this.state;

		let params = { errors: errors, onChange: this.handleChange }

		if (!userId && priceRoute === "" && textRoute === "" && iframeRoute === "") {
			return null;
		}

		return <div className="bg-white border rounded-md max-w-screen-lg">
            <div className="p-4 bg-color0/80 text-slate-50 rounded-t-md flex justify-between gap-2">
                <div className="font-semibold text-xl">🚓 Trajet</div>
                {userId
                    ? <div>
                        <Button type="yellow" iconLeft="pencil" onClick={() => this.handleModal("formText")}>
                            Modifier
                        </Button>
                    </div>
                    : null
                }
            </div>
            <div className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                    <div className="w-full" dangerouslySetInnerHTML={{ __html: textRoute }}></div>
                    {/*<div className="w-full" dangerouslySetInnerHTML={{ __html: iframeRoute }}></div>*/}
                </div>
            </div>

            <div className="flex flex-col gap-2 justify-center items-center p-4 bg-color0/10 rounded-b-md">
                <div className="text-xl font-bold text-yellow-500">
                    {Sanitaze.toFormatCurrency(priceRoute)}
                </div>
            </div>

			<Modal ref={this.formText} identifiant="form-route" maxWidth={768} margin={5} title="Modifier la partie Route"
				   content={<div className="flex flex-col gap-4">
					   <div>
						   <TinyMCE type={8} identifiant="texte" valeur={texte.value} errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                               Texte
						   </TinyMCE>
					   </div>
					   <div>
						   <Input identifiant="iframe" valeur={iframe} {...params}>Iframe</Input>
					   </div>
					   <div>
						   <Input identifiant="price" valeur={price} {...params}>Prix</Input>
					   </div>
				   </div>}
				   footer={null} closeTxt="Annuler" />
		</div>
	}
}

ProjectRoute.propTypes = {
	projectId: PropTypes.string.isRequired
}

function modalFormText (self) {
	self.formText.current.handleUpdateFooter(<Button type="blue" onClick={self.handleSubmitText}>Confirmer</Button>)
}
