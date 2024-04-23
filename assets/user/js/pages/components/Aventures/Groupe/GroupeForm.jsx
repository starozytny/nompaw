import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { Input, InputFile, Radiobox } from "@tailwindComponents/Elements/Fields";
import { Button }           from "@tailwindComponents/Elements/Button";
import { TinyMCE }          from "@tailwindComponents/Elements/TinyMCE";

import Formulaire           from "@commonFunctions/formulaire";
import Validateur           from "@commonFunctions/validateur";

const URL_INDEX_PAGE        = "user_aventures_groupes_read";
const URL_CREATE_ELEMENT    = "intern_api_aventures_groupes_create";
const URL_UPDATE_ELEMENT    = "intern_api_aventures_groupes_update";
const TEXT_CREATE           = "Ajouter le groupe";
const TEXT_UPDATE           = "Enregistrer les modifications";

export function GroupeFormulaire ({ context, element, users, members })
{
    let url = Routing.generate(URL_CREATE_ELEMENT);

    if(context === "update"){
        url = Routing.generate(URL_UPDATE_ELEMENT, {'id': element.id});
    }

    let form = <Form
        context={context}
        url={url}
        name={element ? Formulaire.setValue(element.name) : ""}
        isVisible={element ? Formulaire.setValue(element.isVisible ? 1 : 0) : 0}
        level={element ? Formulaire.setValue(element.level) : 0}
        description={element ? Formulaire.setValue(element.description) : ""}
        imageFile={element ? Formulaire.setValue(element.imageFile) : ""}

        members={members}
        users={users}
    />

    return <div className="formulaire">{form}</div>;
}

GroupeFormulaire.propTypes = {
    context: PropTypes.string.isRequired,
    users: PropTypes.array.isRequired,
    members: PropTypes.array.isRequired,
    element: PropTypes.object,
}

class Form extends Component {
    constructor(props) {
        super(props);

        let description = props.description ? props.description : "";

        this.state = {
            name: props.name,
            isVisible: props.isVisible,
            level: props.level,
            description: { value: description, html: description },
            members: props.members,
            errors: [],
        }

        this.file = React.createRef();
    }

    handleChange = (e) => { this.setState({ [e.currentTarget.name]: e.currentTarget.value }) }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleClickUser = (userId) => {
        const { members } = this.state;

        let find = false;
        members.forEach(member => {
            if(member === userId) find = true;
        })
        let nMembers;
        if(find){
            nMembers = members.filter(m => { return m !== userId });
        }else{
            nMembers = members;
            nMembers.push(userId);
        }

        this.setState({ members: nMembers });
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { url } = this.props;
        const { name, isVisible, level, description } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'name', value: name},
            {type: "text",  id: 'isVisible', value: isVisible},
            {type: "text",  id: 'level', value: level},
            {type: "text",  id: 'description', value: description.html},
        ];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            Formulaire.loader(true);
            let self = this;

            let formData = new FormData();
            formData.append("data", JSON.stringify(this.state));

            let file = this.file.current;
            if(file.state.files.length > 0){
                formData.append("image", file.state.files[0]);
            }

            axios({ method: "POST", url: url, data: formData, headers: {'Content-Type': 'multipart/form-data'} })
                .then(function (response) {
                    toastr.info('Données enregistrées.');
                    location.href = Routing.generate(URL_INDEX_PAGE, {'slug': response.data.slug});
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    render () {
        const { context, imageFile, users } = this.props;
        const { errors, name, isVisible, level, description, members } = this.state;

        let params  = { errors: errors, onChange: this.handleChange };

        let isVisibleItems = [
            { value: 0, label: 'Aux membres', identifiant: 'visible-0' },
            { value: 1, label: 'Par tous',    identifiant: 'visible-1' },
        ]

        let levelItems = [
            { value: 0, label: 'Aucun',             identifiant: 'level-0' },
            { value: 1, label: 'Facile',            identifiant: 'level-1' },
            { value: 2, label: 'Moyen',             identifiant: 'level-2' },
            { value: 3, label: 'Difficile',         identifiant: 'level-3' },
            { value: 4, label: 'Très difficile',    identifiant: 'level-4' },
            { value: 5, label: 'Extrême',           identifiant: 'level-5' },
        ]

        return <>
            <form onSubmit={this.handleSubmit}>
                <div className="line-container">
                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Informations générales</div>
                        </div>
                        <div className="line-col-2">
                            <div className="line line-fat-box">
                                <Radiobox items={isVisibleItems} identifiant="isVisible" valeur={isVisible} {...params}>
                                    Visibilité *
                                </Radiobox>
                            </div>
                            <div className="line">
                                <Input identifiant="name" valeur={name} {...params}>Nom du groupe *</Input>
                            </div>
                            <div className="line line-2 line-fat-box">
                                <Radiobox items={levelItems} identifiant="level" valeur={level} {...params}>
                                    Niveau *
                                </Radiobox>
                                <InputFile ref={this.file} type="simple" identifiant="image" valeur={imageFile}
                                           placeholder="Glissez et déposer une image" {...params}>
                                    Illustration
                                </InputFile>
                            </div>
                            <div className="line">
                                <TinyMCE type={6} identifiant='description' valeur={description.value}
                                         errors={errors} onUpdateData={this.handleChangeTinyMCE}>
                                    Description du groupe
                                </TinyMCE>
                            </div>
                        </div>
                    </div>

                    <div className="line">
                        <div className="line-col-1">
                            <div className="title">Membres du groupe</div>
                            <div className="subtitle">
                                Sélectionnez les membres du groupe d'aventures
                            </div>
                        </div>
                        <div className="line-col-2">
                            <div className="users-select">
                                {users.map(user => {
                                    let selected = false;
                                    members.forEach(member => {
                                        if(member === user.id) selected = true;
                                    })

                                    return <div className={`user-select${selected ? " active" : ""}`} key={user.id}
                                                onClick={() => this.handleClickUser(user.id)}>
                                        <div className="avatar">
                                            {user.avatarFile
                                                ? <img src={user.avatarFile} alt={`avatar de ${user.username}`}/>
                                                : <div className="avatar-letter">{user.lastname.slice(0,1) + user.firstname.slice(0,1)}</div>
                                            }
                                        </div>
                                        <div className="username">{user.displayName}</div>
                                        {selected && <div className="item-selected"><span className="icon-check-1" /></div>}
                                    </div>
                                })}
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
    name: PropTypes.string.isRequired,
    isVisible: PropTypes.number.isRequired,
    level: PropTypes.number.isRequired,
    description: PropTypes.string.isRequired,
    imageFile: PropTypes.string.isRequired,
    users: PropTypes.array.isRequired,
    members: PropTypes.array.isRequired,
}
