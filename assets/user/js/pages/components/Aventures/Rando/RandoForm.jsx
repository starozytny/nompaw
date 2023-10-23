import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Input, Radiobox, Select } from "@commonComponents/Elements/Fields";
import { Button }           from "@commonComponents/Elements/Button";
import { TinyMCE }          from "@commonComponents/Elements/TinyMCE";

import Formulaire           from "@commonFunctions/formulaire";
import Validateur           from "@commonFunctions/validateur";

const URL_INDEX_PAGE        = "user_aventures_randos_read";
const URL_CREATE_ELEMENT    = "intern_api_aventures_randos_create";
const URL_UPDATE_ELEMENT    = "intern_api_aventures_randos_update";
const TEXT_CREATE           = "Ajouter la randonnée";
const TEXT_UPDATE           = "Enregistrer les modifications";

export function RandoFormulaire ({ context, element, groupeId, users, userId })
{
    let url = Routing.generate(URL_CREATE_ELEMENT, {'groupe': groupeId});

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'groupe': groupeId, 'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        description={element ? Formulaire.setValue(element.description) : ""}
        status={element ? Formulaire.setValue(element.status) : 0}
        level={element ? Formulaire.setValue(element.level) : ""}
        altitude={element ? Formulaire.setValue(element.altitude) : ""}
        devPlus={element ? Formulaire.setValue(element.devPlus) : ""}
        distance={element ? Formulaire.setValue(element.distance) : ""}
        adventure={element ? element.adventure : null}
        referent={element ? Formulaire.setValue(element.author.id) : userId}
        googlePhotos={element ? Formulaire.setValue(element.googlePhotos) : ""}

        users={users}
    />

    return <div className="formulaire">{form}</div>;
}

RandoFormulaire.propTypes = {
    context: PropTypes.string.isRequired,
    groupeId: PropTypes.number.isRequired,
    users: PropTypes.array.isRequired,
    element: PropTypes.object,
}

class Form extends Component {
    constructor(props) {
        super(props);

        let description = props.description ? props.description : "";

        this.state = {
            name: props.name,
            description: { value: description, html: description },
            level: props.level,
            altitude: props.altitude,
            devPlus: props.devPlus,
            distance: props.distance,
            referent: props.referent,
            googlePhotos: props.googlePhotos,
            errors: [],
        }
    }

    handleChange = (e) => { this.setState({ [e.currentTarget.name]: e.currentTarget.value }) }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { name } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [ {type: "text",  id: 'name', value: name} ];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            Formulaire.loader(true);
            let self = this;
            axios({ method: context === "create" ? "POST" : "PUT", url: url, data: this.state })
                .then(function (response) {
                    toastr.info('Données enregistrées.');
                    location.href = Routing.generate(URL_INDEX_PAGE, {'slug': response.data.slug});
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    render () {
        const { context, status, adventure, users } = this.props;
        const { errors, name, description, level, altitude, devPlus, distance, referent, googlePhotos } = this.state;

        let params  = { errors: errors, onChange: this.handleChange };

        let levelItems = [
            { value: 0, label: 'Aucun',             identifiant: 'level-0' },
            { value: 1, label: 'Facile',            identifiant: 'level-1' },
            { value: 2, label: 'Moyen',             identifiant: 'level-2' },
            { value: 3, label: 'Difficile',         identifiant: 'level-3' },
            { value: 4, label: 'Très difficile',    identifiant: 'level-4' },
            { value: 5, label: 'Extrême',           identifiant: 'level-5' },
        ]

        let referentsItem = [];
        users.forEach(us => {
            referentsItem.push({ value: us.id, label: us.displayName, identifiant: 'us-' + us.id })
        })

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Informations générales</div>
                            <div className="subtitle">La personnalisation se fera après cette étape.</div>
                        </div>
                        <div className="line-col-2">
                            <Select identifiant="referent" valeur={referent} items={referentsItem} noEmpty={true} noErrors={true} {...params}>
                                Référent
                            </Select>
                            <div className="line">
                                <Input identifiant="name" valeur={name} {...params}>Nom de l'aventure *</Input>
                            </div>
                            <div className="line">
                                <TinyMCE type={7} identifiant='description' valeur={description.value}
                                         errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                    Petite description
                                </TinyMCE>
                            </div>
                        </div>
                    </div>

                    {status !== 0 && <div className="line">
                        <div className="line-col-1">
                            <div className="title">Informations complémentaire</div>
                            <div className="subtitle">Ajouter des informations complémentaires à propos de l'aventure sélectionnée.</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line">
                                <div className="form-group">
                                    <label>Nom de l'aventure sélectionnée</label>
                                    <div>{adventure.name}</div>
                                </div>
                            </div>
                            <div className="line line-3">
                                <Input type="number" identifiant="distance" valeur={distance} {...params}>Distance</Input>
                                <Input type="number" identifiant="devPlus" valeur={devPlus} {...params}>Dénivelé +</Input>
                                <Input type="number" identifiant="altitude" valeur={altitude} {...params}>Altitude</Input>
                            </div>
                            <div className="line line-fat-box">
                                <Radiobox items={levelItems} identifiant="level" valeur={level} {...params}>
                                    Niveau *
                                </Radiobox>
                            </div>
                            <div className="line line-3">
                                <Input identifiant="googlePhotos" valeur={googlePhotos} {...params}>Lien Google photos</Input>
                                <div className="form-group" />
                                <div className="form-group" />
                            </div>
                        </div>
                    </div>}
                </div>

                <div className="line-buttons">
                    <Button isSubmit={true} type="primary">{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
                </div>
            </form>
        </>
    }
}

Form.propTypes = {
    users: PropTypes.array.isRequired,
    context: PropTypes.string.isRequired,
    url: PropTypes.node.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.number.isRequired,
    level: PropTypes.node,
    altitude: PropTypes.node,
    devPlus: PropTypes.node,
    distance: PropTypes.node,
    adventure: PropTypes.object,
    referent: PropTypes.node,
}
