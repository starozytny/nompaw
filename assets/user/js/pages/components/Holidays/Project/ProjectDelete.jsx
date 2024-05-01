import React, { useRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

const URL_INDEX_ELEMENTS = 'user_projects_index';
const URL_DELETE_ELEMENT = 'intern_api_projects_delete';

export function ProjectDelete ({ context, id, name })
{
    let modalRef = useRef(null);

    const handleClick = () => { modalRef.current.handleClick(); }

    const handleDelete = () => {
        let self = this;

        modalRef.current.handleUpdateFooter(<Button iconLeft="chart-3" type="red">Confirmer la suppression</Button>);
        axios({ method: "DELETE", url: Routing.generate(URL_DELETE_ELEMENT, {'id': id}), data: {} })
            .then(function (response) {
                location.href = Routing.generate(URL_INDEX_ELEMENTS);
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    return <>
        {context === "read"
            ? <Button type="red" icon="trash" onClick={handleClick}>Supprimer</Button>
            : <ButtonIcon type="none" icon="trash" onClick={handleClick}>Supprimer</ButtonIcon>
        }
        {createPortal(
            <Modal ref={modalRef} identifiant={`delete-proj-${id}`} maxWidth={414} title="Supprimer le projet"
                   content={<p>Êtes-vous sûr de vouloir supprimer le projet : <b>{name}</b> ?</p>}
                   footer={<Button type="red" onClick={handleDelete}>Confirmer la suppression</Button>} closeTxt="Annuler" />
            , document.body)
        }
    </>
}

ProjectDelete.propTypes = {
    context: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
}
