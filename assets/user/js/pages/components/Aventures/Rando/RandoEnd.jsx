import React, { useRef } from "react";
import PropTypes from "prop-types";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@commonComponents/Elements/Button";
import { Modal } from "@commonComponents/Elements/Modal";

const URL_READ_GROUPE = 'user_aventures_groupes_read';
const URL_END_ELEMENT = 'api_aventures_randos_end';

export function RandoEnd ({ context, id, name, groupeSlug })
{
    let modalRef = useRef(null);

    const handleClick = () => { modalRef.current.handleClick(); }

    const handleDelete = () => {
        let self = this;

        modalRef.current.handleUpdateFooter(<Button isLoader={true} type="success">Confirmer</Button>);
        axios({ method: "PUT", url: Routing.generate(URL_END_ELEMENT, {'id': id}), data: {} })
            .then(function (response) {
                location.href = Routing.generate(URL_READ_GROUPE, {'slug': groupeSlug});
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    return <>
        {context === "read"
            ? <Button icon="flag" type="success" onClick={handleClick}>Terminer</Button>
            : <ButtonIcon icon="flag" type="success" onClick={handleClick}>Terminer</ButtonIcon>
        }
        <Modal ref={modalRef} identifiant={`end-rando-${id}`} maxWidth={414} title="Randonnée terminée"
               content={<p>Etes-vous sûr de vouloir mettre fin à la randonnée : <b>{name}</b> ?</p>}
               footer={<Button type="success" onClick={handleDelete}>Confirmer</Button>} closeTxt="Annuler" />
    </>
}

RandoEnd.propTypes = {
    context: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    groupeSlug: PropTypes.string.isRequired,
}
