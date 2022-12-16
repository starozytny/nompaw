import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios   from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Checkbox, Input } from "@commonComponents/Elements/Fields";
import { Button } from "@commonComponents/Elements/Button";

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

const URL_CREATE_ELEMENT = "api_users_create";
const URL_UPDATE_GROUP   = "api_users_update";
const TEXT_CREATE        = "Ajouter l'utilisateur";
const TEXT_UPDATE        = "Enregistrer les modifications";

export function UserFormulaire ({ context, element })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_GROUP, {'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}
        username={element ? Formulaire.setValue(element.username) : ""}
        firstname={element ? Formulaire.setValue(element.firstname) : ""}
        lastname={element ? Formulaire.setValue(element.lastname) : ""}
        email={element ? Formulaire.setValue(element.email) : ""}
        avatar={element ? Formulaire.setValue(element.avatarFile) : null}
        roles={element ? Formulaire.setValue(element.roles, []) : []}
    />

    return <div className="formulaire">{form}</div>;
}

UserFormulaire.propTypes = {
    context: PropTypes.string.isRequired,
    element: PropTypes.object.isRequired,
}

class Form extends Component {
    constructor(props) {
        super(props);

        this.state = {
            username: props.username,
            firstname: props.firstname,
            lastname: props.lastname,
            email: props.email,
            roles: props.roles,
            avatar: props.avatar,
            password: '',
            password2: '',
            errors: []
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChange = (e) => {
        const { roles } = this.state

        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "roles"){
            value = Formulaire.updateValueCheckbox(e, roles, value);
        }

        this.setState({[name]: value})
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, url } = this.props;
        const { username, firstname, lastname, password, passwordConfirm, email, roles } = this.state;

        this.setState({ errors: [], success: false })

        let paramsToValidate = [
            {type: "text",  id: 'username',  value: username},
            {type: "text",  id: 'firstname', value: firstname},
            {type: "text",  id: 'lastname',  value: lastname},
            {type: "email", id: 'email',     value: email},
            {type: "array", id: 'roles',     value: roles}
        ];
        if(context === "create"){
            if(password !== ""){
                paramsToValidate = [...paramsToValidate,
                    ...[{type: "password", id: 'password', value: password, idCheck: 'passwordConfirm', valueCheck: passwordConfirm}]
                ];
            }
        }

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            Formulaire.loader(true);
            let self = this;

            let formData = new FormData();
            formData.append("data", JSON.stringify(this.state));

            axios({ method: "POST", url: url, data: formData, headers: {'Content-Type': 'multipart/form-data'} })
                .then(function (response) {
                    let data = response.data;
                })
                .catch(function (error) {
                    Formulaire.displayErrors(self, error);
                })
                .then(() => {
                    Formulaire.loader(false);
                })
            ;
        }
    }

    render () {
        const { context } = this.props;
        const { errors, username, firstname, lastname, email, password, password2, roles, avatar } = this.state;

        let rolesItems = [
            { value: 'ROLE_ADMIN',      label: 'Admin',          identifiant: 'admin' },
            { value: 'ROLE_USER',       label: 'Utilisateur',    identifiant: 'utilisateur' },
        ]

        let params = { errors: errors }
        let paramsInput0 = {...params, ...{ onChange: this.handleChange }}

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Identifiants</div>
                            <div className="subtitle">Les deux informations peuvent être utilisées pour se connecter.</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-2">
                                <Input identifiant="username" valeur={username} {...paramsInput0}>Nom utilisateur</Input>
                                <Input identifiant="email"    valeur={email}    {...paramsInput0} type="email">Adresse e-mail</Input>
                            </div>
                        </div>
                    </div>
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Informations personnelles</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-2">
                                <Input identifiant="firstname"  valeur={firstname}  {...paramsInput0}>Prénom</Input>
                                <Input identifiant="lastname"   valeur={lastname}   {...paramsInput0}>Nom</Input>
                            </div>
                        </div>
                    </div>
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Profil utilisateur</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-fat-box">
                                <Checkbox items={rolesItems} identifiant="roles" valeur={roles} {...paramsInput0}>
                                    Rôles
                                </Checkbox>
                            </div>
                        </div>
                    </div>
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Mot de passe</div>
                            <div className="subtitle">
                                {context === "create"
                                    ? "Laisser les champs vides pour générer un mot de passe aléatoire."
                                    : "Laisser les champs vides pour ne pas modifier le mot de passe."
                                }
                            </div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-2">
                                <Input identifiant="password"  valeur={password}  {...paramsInput0}
                                       password={true} type="password" autocomplete="new-password">
                                    Mot de passe
                                </Input>
                                <Input identifiant="password2" valeur={password2} {...paramsInput0}
                                       password={true} type="password" autocomplete="new-password">
                                    Confirmer le mot de passe
                                </Input>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="line-buttons">
                    <Button isSubmit={true} type="primary">{context === "create" ? TEXT_CREATE : TEXT_UPDATE}</Button>
                </div>
            </form>
        </>
    }
}

Form.propTypes = {
    context: PropTypes.string.isRequired,
    url: PropTypes.node.isRequired,
    username: PropTypes.string.isRequired,
    firstname: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    avatar: PropTypes.string.isRequired,
    roles: PropTypes.array.isRequired,
}