import React, { useRef } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";

const URL_INDEX_ELEMENTS = 'user_aventures_groupes_index';
const URL_DELETE_ELEMENT = 'intern_api_aventures_groupes_delete';

export function GroupeDelete ({ context, id, name }) {
	let modalRef = useRef(null);

	const handleClick = () => {
		modalRef.current.handleClick();
	}

	const handleDelete = () => {
		let self = this;

		modalRef.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_ELEMENT, { 'id': id }), data: {} })
			.then(function (response) {
				location.href = Routing.generate(URL_INDEX_ELEMENTS);
			})
			.catch(function (error) {
				Formulaire.displayErrors(self, error);
				Formulaire.loader(false);
			})
		;
	}

	return <>
		{context === "read"
			? <Button iconLeft="trash" type="red" onClick={handleClick}>Supprimer</Button>
			: <ButtonIcon icon="trash" type="none" onClick={handleClick}>Supprimer</ButtonIcon>
		}
		<Modal ref={modalRef} identifiant={`delete-groupe-${id}`} maxWidth={414} title="Supprimer le groupe"
			   content={<p>Êtes-vous sûr de vouloir supprimer le groupe de randonnée : <b>{name}</b> ?</p>}
			   footer={<Button type="red" onClick={handleDelete}>Confirmer la suppression</Button>} closeTxt="Annuler" />
	</>
}

GroupeDelete.propTypes = {
	context: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
}
