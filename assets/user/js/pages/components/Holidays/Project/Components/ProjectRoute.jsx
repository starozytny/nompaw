import React, { Component } from "react";
import { createPortal } from "react-dom";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import Inputs from "@commonFunctions/inputs";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Input } from "@tailwindComponents/Elements/Fields";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Button } from "@tailwindComponents/Elements/Button";

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
		this.formText.current.handleUpdateFooter(<Button iconLeft="chart-3" type="blue">Confirmer</Button>);
		axios({
			method: "PUT", url: Routing.generate(URL_UPDATE_PROJECT, { type: 'route', id: projectId }),
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

		return <div className="space-y-6">
			<div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-slate-800">
						<span className="icon-map !font-semibold text-xl"></span>
						<span className="ml-2">Itinéraire du voyage</span>
					</h3>
					{userId
						? <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium" onClick={() => this.handleModal("formText")}>
							Modifier
						</button>
						: null
					}
				</div>

				{textRoute
					? <div className="mb-4 p-4 bg-slate-50 rounded-lg">
						<div className="text-sm text-slate-700">
							<div dangerouslySetInnerHTML={{ __html: textRoute }}></div>
						</div>
					</div>
					: null
				}

				<div className="relative h-[450px] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
					{iframeRoute
						? <div className="w-full project-route" dangerouslySetInnerHTML={{ __html: iframeRoute }}></div>
						: <div className="text-center text-slate-500">
							<span className="icon-map text-2xl"></span>
							<p className="mt-2 font-medium">Carte</p>
							<p className="text-sm">Renseigner une iframe pour voir la carte.</p>
						</div>
					}
					<div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
						<div className="font-medium text-yellow-500">
							{Sanitaze.toFormatCurrency(priceRoute)}
						</div>
					</div>
				</div>
			</div>

			{createPortal(
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
					   footer={null} closeTxt="Annuler" />,
				document.body
			)}
		</div>
	}
}

function modalFormText (self) {
	self.formText.current.handleUpdateFooter(<Button type="blue" onClick={self.handleSubmitText}>Confirmer</Button>)
}
