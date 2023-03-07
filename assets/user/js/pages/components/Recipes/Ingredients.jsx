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

    handleReset = () => { this.setState({
        ingreId: '',
        ingreUnit: '',
        ingreNombre: '',
        ingreName: '',
        errors: []
    }) }

    handleChange = (e) => { this.setState({ [e.currentTarget.name]: e.currentTarget.value }) }

    handleUpdate = (context, element) => {
        const { ingredients } = this.state;

        let nIngredients = [];
        ingredients.forEach((ingre) => {
            if(ingre.id === element.id){
                ingre.context = context
            }

            nIngredients.push(ingre);
        })

        this.handleReset();

        this.setState({
            context: context,
            ingredients: nIngredients,
        })

        if(context === 'update'){
            this.setState({
                ingreId: element.id,
                ingreUnit: Formulaire.setValue(element.unit),
                ingreNombre: Formulaire.setValue(element.nombre),
                ingreName: Formulaire.setValue(element.name),
            })
        }
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
            let data = {recipeId: recipe.id, id: ingreId, nombre: ingreNombre, unit: ingreUnit, name: ingreName, context: context}

            let url, method, nIngredients = [];
            switch (context){
                case 'create':
                    method = 'POST';
                    url = Routing.generate(URL_CREATE_ELEMENT);
                    nIngredients = [...ingredients, ...[data]];
                    break;
                case 'update':
                    method = 'PUT';
                    url = Routing.generate(URL_UPDATE_ELEMENT, {'id': ingreId});
                    ingredients.forEach((ingre) => {
                        if(ingre.id === ingreId){
                            ingre = data;
                        }

                        nIngredients.push(ingre);
                    })
                    break;
                default:
                    nIngredients = ingredients;
                    break;
            }

            let self = this;
            axios({ method: method, url: url, data: data })
                .then(function (response) {
                    self.handleReset();

                    self.setState({
                        ingredients: nIngredients,
                        context: 'create',
                    })
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
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
                        {mode && ingre.context !== 'delete'
                            ? <>
                                <ButtonIcon onClick={() => this.handleUpdate('update', ingre)} icon="pencil">Modifier</ButtonIcon>
                                <ButtonIcon onClick={() => this.handleUpdate('delete', ingre)} icon="trash">Supprimer</ButtonIcon>
                            </>
                            : <ButtonIcon onClick={() => this.handleUpdate('revert', ingre)} icon="refresh1">Annuler</ButtonIcon>
                        }

                    </div>
                </div>
            })}
        </div>
    }
}

Ingredients.propTypes = {
    mode: PropTypes.number.isRequired,
    recipe: PropTypes.object.isRequired,
    ingre: PropTypes.array.isRequired,
}
