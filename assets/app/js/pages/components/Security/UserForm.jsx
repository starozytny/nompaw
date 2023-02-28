import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios   from 'axios';
import toastr  from 'toastr';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Input }    from "@commonComponents/Elements/Fields";
import { Button }   from "@commonComponents/Elements/Button";
import { Password } from "@commonComponents/Modules/User/Password";

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

const URL_LOGIN_PAGE     = "app_login";
const URL_CREATE_ELEMENT = "api_users_create";

export function UserFormulaire ()
{
    return <Form
        url={Routing.generate(URL_CREATE_ELEMENT)}
        username=""
        firstname=""
        lastname=""
        email=""
    />;
}

class Form extends Component {
    constructor(props) {
        super(props);

        this.state = {
            context: "registration",
            username: props.username,
            firstname: props.firstname,
            lastname: props.lastname,
            email: props.email,
            password: '',
            password2: '',
            critere: '',
            errors: [],
        }
    }

    handleChange = (e) => { this.setState({[e.currentTarget.name]: e.currentTarget.value}) }

    handleSubmit = (e) => {
        e.preventDefault();

        const { url } = this.props;
        const { username, firstname, lastname, password, password2, email, critere } = this.state;

        this.setState({ errors: [] });

        if(critere !== ""){
            toastr.error("Une erreur est survenue. Veuillez rafraichir la page.")
        }else{
            let paramsToValidate = [
                {type: "text",      id: 'username',  value: username},
                {type: "text",      id: 'firstname', value: firstname},
                {type: "text",      id: 'lastname',  value: lastname},
                {type: "email",     id: 'email',     value: email},
                {type: "password",  id: 'password',  value: password, idCheck: 'password2', valueCheck: password2}
            ];

            let validate = Validateur.validateur(paramsToValidate);
            if(!validate.code){
                Formulaire.showErrors(this, validate);
            }else {
                Formulaire.loader(true);
                let self = this;

                let formData = new FormData();
                formData.append("data", JSON.stringify(this.state));

                axios({ method: "POST", url: url, data: formData })
                    .then(function (response) {
                        location.href = Routing.generate(URL_LOGIN_PAGE);
                    })
                    .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
                ;
            }
        }
    }

    render () {
        const { errors, username, firstname, lastname, email, password, password2 } = this.state;

        let params = { errors: errors }
        let paramsInput0 = {...params, ...{ onChange: this.handleChange }}

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line line-2">
                    <Input identifiant="username" valeur={username} {...paramsInput0}>Nom utilisateur</Input>
                    <Input identifiant="email"    valeur={email}    {...paramsInput0} type="email">Adresse e-mail</Input>
                </div>
                <div className="line line-2">
                    <Input identifiant="firstname"  valeur={firstname}  {...paramsInput0}>Prénom</Input>
                    <Input identifiant="lastname"   valeur={lastname}   {...paramsInput0}>Nom</Input>
                </div>

                <Password template="col" password={password} password2={password2} params={paramsInput0} />

                <div className="line-buttons">
                    <Button isSubmit={true} type="primary">Enregistre moi</Button>
                </div>
            </form>
        </>
    }
}

Form.propTypes = {
    url: PropTypes.node.isRequired,
    username: PropTypes.string.isRequired,
    firstname: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
}
