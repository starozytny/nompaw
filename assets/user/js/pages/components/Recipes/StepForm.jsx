import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Modal } from "@tailwindComponents/Elements/Modal";
import { InputFile } from "@tailwindComponents/Elements/Fields";

import Formulaire from "@commonFunctions/formulaire";

const URL_DELETE_IMAGE = "intern_api_cook_instructions_delete_image";

export function StepFormulaire ({ step, recipe, element, onUpdateData, onRemoveStep }) {
	return <Form
		step={step}
		recipe={recipe}
		onUpdateData={onUpdateData}
		onRemoveStep={onRemoveStep}
		content={element ? Formulaire.setValue(element.value) : ""}
		image0File={element ? Formulaire.setValue(element.image0) : ""}
		image1File={element ? Formulaire.setValue(element.image1) : ""}
		image2File={element ? Formulaire.setValue(element.image2) : ""}
	/>
}

StepFormulaire.propTypes = {
	step: PropTypes.number.isRequired,
	recipe: PropTypes.object.isRequired,
	onUpdateData: PropTypes.func.isRequired,
	onRemoveStep: PropTypes.func.isRequired,
	content: PropTypes.string,
}

class Form extends Component {
	constructor (props) {
		super(props);

		this.state = {
			errors: [],
			loadData: true,
			loadDelete: false,
			image0File: props.image0File,
			image1File: props.image1File,
			image2File: props.image2File,
			imageToDelete: null
		}

		this.delete = React.createRef();
		this.deleteFile = React.createRef();
		this.file0 = React.createRef();
		this.file1 = React.createRef();
		this.file2 = React.createRef();
	}

	componentDidMount = () => {
		const { step, content } = this.props;

		let nContent = content ? content : "";
		let name = 'content-' + step;
		this.setState({ [name]: { value: nContent, html: nContent }, loadData: false })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
		this.props.onUpdateData(this.props.step, html);
	}

	handleRemove = () => {
		this.props.onRemoveStep(this.props.step);
		this.delete.current.handleClose();
	}

	handleRemoveFile = () => {
		const { step, recipe } = this.props;
		const { imageToDelete, loadDelete } = this.state;

		if (!loadDelete) {
			this.setState({ loadDelete: true })

			let self = this;
			axios({ method: "DELETE", url: Routing.generate(URL_DELETE_IMAGE, { 'recipe': recipe.id, 'position': step, 'nb': imageToDelete }), data: {} })
				.then(function (response) {
					toastr.info('Illustration supprimée.');

					let name = 'image' + imageToDelete + 'File';
					self.setState({ [name]: null })

					self.deleteFile.current.handleClose();
				})
				.catch(function (error) {
					Formulaire.displayErrors(self, error);
					Formulaire.loader(false);
				})
				.then(function () {
					self.setState({ loadDelete: false })
				})
			;
		}

	}

	handleDelete = () => {
		const { image0File, image1File, image2File } = this.state;

		if (image0File || image1File || image2File) {
			toastr.error('Veuillez supprimer les illustrations avant de supprimer l\'étape.');
		} else {
			this.delete.current.handleClick();
		}
	}

	handleDeleteFile = (nb) => {
		this.setState({ imageToDelete: nb })
		this.deleteFile.current.handleClick();
	}

	render () {
		const { step, recipe } = this.props;
		const { errors, loadData, loadDelete, openImage2, image0File, image1File, image2File } = this.state;

		let params = { errors: errors };

		return <div className="flex flex-col gap-4">
			<div>
				{loadData
					? <LoaderElements />
					: <TinyMCE type={4} identifiant={`content-${step}`} valeur={this.state['content-' + step].value} params={{ 'id': recipe.id }}
							   errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                        <div className="flex justify-between gap-2 mb-2">
                            <span>Étape {step}</span>
                            <ButtonIcon icon="trash" type="red" onClick={this.handleDelete}>Enlever</ButtonIcon>
                        </div>
                    </TinyMCE>
                }
            </div>

			<div className="flex flex-col gap-4 sm:flex-row">
				<div className="form-group">
					<InputFile ref={this.file0} type="simple" identifiant={"image0File-" + step} valeur={image0File}
							   placeholder="Glissez et déposer une image" {...params}>
						Illustration 1
					</InputFile>
					{image0File
						? <Button type="red" onClick={() => this.handleDeleteFile(0)} isLoader={loadDelete}>Supprimer l'illustration 1</Button>
						: null
					}
				</div>
				<div className="form-group">
					<InputFile ref={this.file1} type="simple" identifiant={"image1File-" + step} valeur={image1File}
							   placeholder="Glissez et déposer une image" {...params}>
						Illustration 2
					</InputFile>
					{image1File
						? <Button type="red" onClick={() => this.handleDeleteFile(1)} isLoader={loadDelete}>Supprimer l'illustration 2</Button>
						: null
					}
				</div>
				<div className="form-group">
					<InputFile ref={this.file2} type="simple" identifiant={"image2File-" + step} valeur={image2File}
							   placeholder="Glissez et déposer une image" {...params}>
						Illustration 3
					</InputFile>
					{image2File
						? <Button type="red" onClick={() => this.handleDeleteFile(2)} isLoader={loadDelete}>Supprimer l'illustration 3</Button>
						: null
					}
				</div>
			</div>

			<Modal ref={this.delete} identifiant={`delete-content-${step}`} maxWidth={414} title={`Supprimer l'étape ${step}`}
				   content={<p>Etes-vous sûr de vouloir supprimer cette étape ? <br /><br /> <b className="text-blue-700">Valider les modifications</b> pour que la suppression soit prise en compte. </p>}
				   footer={<Button onClick={this.handleRemove} type="red">Confirmer la suppression</Button>} />

			<Modal ref={this.deleteFile} identifiant={`delete-file-${step}`} maxWidth={568} title={`Supprimer l'illustration ${step}`}
				   content={<p>Etes-vous sûr de vouloir supprimer cette illustration ? <br /><br /> Elle sera supprimé <b>directement après avoir </b><b className="text-red-500">Confirmé la suppression</b>.</p>}
				   footer={<Button onClick={this.handleRemoveFile} type="red">Confirmer la suppression</Button>} />
		</div>
	}
}

Form.propTypes = {
	step: PropTypes.number.isRequired,
	recipe: PropTypes.object.isRequired,
	content: PropTypes.string.isRequired,
	onUpdateData: PropTypes.func.isRequired,
	onRemoveStep: PropTypes.func.isRequired,
}
