import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";

import { ButtonIcon } from "@commonComponents/Elements/Button";
import { Input } from "@commonComponents/Elements/Fields";

const URL_CREATE_ELEMENT = 'api_ingredients_create';
const URL_UPDATE_ELEMENT = 'api_ingredients_update';
const URL_DELETE_ELEMENT = 'api_ingredients_delete';

export class Ingredients extends Component
{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            ingredients: props.ingre,
            ingreId: '',
            ingreUnit: "",
            ingreNombre: "",
            ingreName: "",
            errors: []
        }
    }

    handleReset = (ingredients) => { this.setState({
        context: 'create',
        ingredients: ingredients,
        ingreId: '',
        ingreUnit: '',
        ingreNombre: '',
        ingreName: '',
        errors: []
    }) }

    handleChange = (e) => { this.setState({ [e.currentTarget.name]: e.currentTarget.value }) }

    handleUpdate = (element) => {
        this.setState({
            context: 'update',
            ingreId: element.id,
            ingreUnit: Formulaire.setValue(element.unit),
            ingreNombre: Formulaire.setValue(element.nombre),
            ingreName: Formulaire.setValue(element.name),
        })
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { recipe } = this.props;
        const { context, ingredients, ingreId, ingreUnit, ingreNombre, ingreName } = this.state;

        this.setState({ errors: [] });

        let paramsToValidate = [
            {type: "text",  id: 'ingreUnit', value: ingreUnit},
            {type: "text",  id: 'ingreNombre', value: ingreNombre},
            {type: "text",  id: 'ingreName', value: ingreName},
        ];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            let data = {recipeId: recipe.id, id: ingreId, nombre: ingreNombre, unit: ingreUnit, name: ingreName}

            let method    = context === "create" ? 'POST' : 'PUT',
                url       = context === 'create'
                    ? Routing.generate(URL_CREATE_ELEMENT)
                    : Routing.generate(URL_UPDATE_ELEMENT, {'id': ingreId});

            let self = this;
            axios({ method: method, url: url, data: data })
                .then(function (response) {
                    let nIngredients = [];

                    if(context === "update"){
                        ingredients.forEach((ingre) => {
                            if(ingre.id === response.data.id){
                                ingre = data;
                            }

                            nIngredients.push(ingre);
                        })
                    }else{
                        nIngredients = ingredients;
                        nIngredients.push({...data, ...{id: response.data.id}})
                    }

                    self.handleReset(nIngredients);
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    handleDelete = (element) => {
        const { ingredients } = this.state;

        let self = this;
        axios({ method: 'DELETE', url: Routing.generate(URL_DELETE_ELEMENT, {'id': element.id}), data: {} })
            .then(function (response) {

                let nIngredients = [];
                ingredients.forEach((ingre) => {
                    if(ingre.id !== element.id){
                        nIngredients.push(ingre);
                    }
                })

                self.handleReset(nIngredients);
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    render () {
        const { mode } = this.props;
        const { context, errors, ingredients, ingreNombre, ingreUnit, ingreName } = this.state;

        const paramsInput0 = {errors: errors, onChange: this.handleChange};

        return <div className="ingredients">
            {mode && <div className="form">
                <div className="line line-3">
                    <Input identifiant='ingreNombre' valeur={ingreNombre} placeholder='0' {...paramsInput0} />
                    <Input identifiant='ingreUnit' valeur={ingreUnit} placeholder='unité' {...paramsInput0} />
                    <Input identifiant='ingreName' valeur={ingreName} placeholder="Ingrédient" {...paramsInput0} />
                    {context === "create"
                        ? <ButtonIcon onClick={this.handleSubmit} icon="add">Ajouter</ButtonIcon>
                        : <ButtonIcon onClick={this.handleSubmit} icon="pencil">Modifier</ButtonIcon>
                    }
                </div>
            </div>}
            {ingredients.map((ingre, index) => {
                return <div className="item" key={index}>
                    <div className="item-box"></div>
                    <div className="item-data">
                        <span>{ingre.nombre}</span>
                        <span>{ingre.unit}</span>
                        <span>{ingre.name}</span>
                    </div>
                    <div className="item-actions">
                        {mode && <>
                            <ButtonIcon onClick={() => this.handleUpdate(ingre)} icon="pencil">Modifier</ButtonIcon>
                            <ButtonIcon onClick={() => this.handleDelete(ingre)} icon="trash">Supprimer</ButtonIcon>
                        </>}
                    </div>
                </div>
            })}
        </div>
    }
}

Ingredients.propTypes = {
    mode: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
    ingre: PropTypes.array.isRequired,
}
