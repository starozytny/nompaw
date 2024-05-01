import React, { useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_READ_GROUPE = 'user_aventures_groupes_read';
const URL_DELETE_ELEMENT = 'intern_api_aventures_randos_delete';

export function RandoDelete ({ context, id, name, groupeSlug }) {
	let modalRef = useRef(null);

	const handleClick = () => {
		modalRef.current.handleClick();
	}

	const handleDelete = () => {
		let self = this;

		modalRef.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
		axios({ method: "DELETE", url: Routing.generate(URL_DELETE_ELEMENT, { id: id }), data: {} })
			.then(function (response) {
				location.href = Routing.generate(URL_READ_GROUPE, { slug: groupeSlug });
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
			: <ButtonIcon icon="trash" type="default" onClick={handleClick}>Supprimer</ButtonIcon>
		}
		{createPortal(
			<Modal ref={modalRef} identifiant={`delete-rando-${id}`} maxWidth={414} title="Supprimer la randonnée"
				   content={<p>Êtes-vous sûr de vouloir supprimer la randonnée : <b>{name}</b> ?</p>}
				   footer={<Button type="red" onClick={handleDelete}>Confirmer la suppression</Button>} closeTxt="Annuler" />
			, document.body)
		}
	</>
}

RandoDelete.propTypes = {
	context: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
	groupeSlug: PropTypes.string.isRequired,
}
