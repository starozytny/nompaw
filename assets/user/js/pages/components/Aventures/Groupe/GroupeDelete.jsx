import React, { useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { Trash2 } from "lucide-react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Modal } from "@tailwindComponents/Elements/Modal";

const URL_INDEX_ELEMENTS = 'user_aventures_groupes_index';
const URL_DELETE_ELEMENT = 'intern_api_aventures_groupes_delete';

// Same CSS-only tooltip as the "Modifier" link in templates/user/pages/aventures/index.html.twig (shadcn tooltip look).
const TOOLTIP = "pointer-events-none absolute right-0 top-full z-10 mt-1.5 whitespace-nowrap rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md opacity-0 scale-95 origin-top-right transition-[opacity,transform] duration-150 ease-out group-hover/tip:opacity-100 group-hover/tip:scale-100 group-hover/tip:delay-300 group-focus-within/tip:opacity-100 group-focus-within/tip:scale-100 motion-reduce:transition-none";

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
			: <span className="relative inline-flex group/tip">
				<button type="button" onClick={handleClick} aria-label="Supprimer le groupe"
						className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm ring-offset-background transition-colors hover:bg-accent hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
					<Trash2 className="h-4 w-4" />
				</button>
				<span role="tooltip" className={TOOLTIP}>Supprimer</span>
			</span>
		}
		{/* Portal: the card's action bar fades out when not hovered, which would hide an inline modal. */}
		{createPortal(<Modal ref={modalRef} identifiant={`delete-groupe-${id}`} maxWidth={414} title="Supprimer le groupe"
			   content={<p>Êtes-vous sûr de vouloir supprimer le groupe de randonnée : <b>{name}</b> ?</p>}
		   footer={<Button type="red" onClick={handleDelete}>Confirmer la suppression</Button>} closeTxt="Annuler" />, document.body)}
</>
}

GroupeDelete.propTypes = {
	context: PropTypes.string.isRequired,
	id: PropTypes.string.isRequired,
	name: PropTypes.string.isRequired,
}
