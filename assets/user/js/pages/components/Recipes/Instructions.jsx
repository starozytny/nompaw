import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { uid } from "uid";
import parse from "html-react-parser";

import Formulaire from "@commonFunctions/formulaire";

import { Button } from "@tailwindComponents/Elements/Button";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { StepFormulaire } from "@userPages/Recipes/StepForm";

const URL_UPDATE_ELEMENT = "intern_api_cook_instructions_update";

export class Instructions extends Component {
	constructor (props) {
		super(props);

		this.state = {
			loadData: false,
			loadSteps: true,
		}
	}

	componentDidMount = () => {
		const { steps } = this.props;

		let nbSteps = steps.length > 0 ? steps.length : 1;

		if (steps.length > 0) {
			let self = this;
			steps.forEach((s, index) => {
				self.setState({
					[`step${index + 1}`]: {
						uid: uid(), value: s.content,
						image0: s.image0File, image1: s.image1File, image2: s.image2File
					}
				})
			})
		} else {
			this.setState({ step1: { uid: uid(), value: '' } })
		}

		this.setState({ nbSteps: nbSteps, loadStep: false })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleIncreaseStep = () => {
		this.setState((prevState, prevProps) => ({
			nbSteps: prevState.nbSteps + 1, [`step${(prevState.nbSteps + 1)}`]: { uid: uid(), value: '' }
		}))
	}

	handleUpdateContentStep = (i, content) => {
		let name = `step${i}`;
		this.setState({ [name]: { uid: this.state[name].uid, value: content } })
	}

	handleRemoveStep = (step) => {
		const { nbSteps } = this.state;

		this.setState({ loadStep: true })

		let newNbSteps = nbSteps - 1;
		if (step !== nbSteps) {
			for (let i = step + 1 ; i <= nbSteps ; i++) {
				let s = this.state[`step${i}`];
				this.setState({
					[`step${i - 1}`]: {
						uid: uid(), value: s.value, oldPosition: i,
						image0: s.image0, image1: s.image1, image2: s.image2
					}
				})
			}
		}

		this.setState({ nbSteps: newNbSteps, loadStep: false })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { recipe } = this.props;
		const { loadData, nbSteps } = this.state;

		this.setState({ errors: [] });

		if (!loadData) {
			this.setState({ loadData: true })
			let self = this;
			let url = Routing.generate(URL_UPDATE_ELEMENT, { 'recipe': recipe.id });

			let formData = new FormData();
			formData.append("data", JSON.stringify(this.state));

			for (let i = 1 ; i <= nbSteps ; i++) {
				for (let j = 0 ; j <= 2 ; j++) {
					let name = 'image' + j + 'File-' + i;
					let stepsImage = document.getElementsByName(name);
					if (stepsImage) {
						stepsImage.forEach(inputImg => {
							if (inputImg.files[0]) {
								formData.append(name, inputImg.files[0]);
							}
						})
					}
				}
			}

			axios({ method: "POST", url: url, data: formData, headers: { 'Content-Type': 'multipart/form-data' } })
				.then(function (response) {
					toastr.info('Recette mise à jour.');
					self.setState({ loadData: false })
				})
				.catch(function (error) {
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
			;
		}
	}

	render () {
		const { mode, recipe } = this.props;
		const { loadData, loadStep, nbSteps } = this.state;

		let steps = [];
		for (let i = 1 ; i <= nbSteps ; i++) {
			let val = this.state[`step${i}`];
			steps.push(<div className="flex gap-2" key={i}>
				<div className="h-12 w-12 rounded-md bg-color0 text-slate-50 flex items-center justify-center text-xl">{i}</div>
                <div className="w-[calc(100%-3rem)] bg-white p-4 rounded-md border">
                    {mode
                        ? <StepFormulaire key={val.uid} element={val} step={i} recipe={recipe}
                                          onUpdateData={this.handleUpdateContentStep}
                                          onRemoveStep={this.handleRemoveStep} />
                        : <div className="flex flex-col gap-2">
                            <div>{parse(val.value)}</div>
                            <div className="flex flex-wrap gap-2">
                                {val.image0
                                    ? <div className="h-64 bg-gray-100">
                                        <img src={val.image0} alt={'etape-' + i + "-illustration"} className="h-64 w-full object-contain" />
                                    </div>
                                    : null
                                }
                                {val.image1
                                    ? <div className="h-64 bg-gray-100">
                                        <img src={val.image1} alt={'etape-' + i + "-illustration"} className="h-64 w-full object-contain" />
                                    </div>
                                    : null
                                }
                                {val.image2
                                    ? <div className="h-64 bg-gray-100">
                                        <img src={val.image2} alt={'etape-' + i + "-illustration"} className="h-64 w-full object-contain" />
                                    </div>
                                    : null
                                }
                            </div>
                        </div>
                    }
                </div>
			</div>)
		}

		return <div className="flex flex-col gap-4">
			{loadStep
				? <LoaderElements />
				: <>
					{steps}
					{mode
						? <div className="flex justify-end gap-1">
							<Button type="default" onClick={this.handleIncreaseStep}>Ajouter une étape</Button>
							<Button type="blue" icon={loadData ? 'chart-3' : 'check1'} onClick={this.handleSubmit}>Valider les modifications</Button>
						</div>
						: null
					}
				</>
			}
		</div>
	}
}

Instructions.propTypes = {
	recipe: PropTypes.object.isRequired,
	steps: PropTypes.array.isRequired,
}
