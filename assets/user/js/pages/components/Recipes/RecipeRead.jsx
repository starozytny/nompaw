import React, { Component, useState } from "react";
import PropTypes from "prop-types";

import _ from "lodash";
import { uid } from 'uid';
import parse from "html-react-parser"

import Sanitaze   from '@commonFunctions/sanitaze';
import Formulaire from '@commonFunctions/formulaire';
import Validateur from '@commonFunctions/validateur';

import moment from "moment";
import 'moment/locale/fr';

import { Avatar, List, Radio, Rate } from "antd";
import { Input } from "@commonComponents/Elements/Fields";
import { ButtonIcon } from "@commonComponents/Elements/Button";

const menu = [
    {
        label: 'Instructions',
        value: 'instructions',
    },
    {
        label: 'Ingrédients',
        value: 'ingredients',
    },
    {
        label: 'Avis',
        value: 'avis',
    },
];

const menuTiny = [
    {
        label: 'Ingrédients',
        value: 'ingredients',
    },
    {
        label: 'Avis',
        value: 'avis',
    },
];

const data = [
    {title: 'Ant Design Title 1',},
    {title: 'Ant Design Title 2',},
    {title: 'Ant Design Title 3',},
    {title: 'Ant Design Title 4',},
];

export function RecipeRead ({ elem, steps, ingre }) {
    const [context, setContext] = useState(window.matchMedia("(min-width: 1280px)").matches ? 'ingredients' : 'ingredients');

    const onChangeContext = ({ target: { value } }) => {
        setContext(value);
    };

    let content;
    switch (context){
        case "avis":
            content = <List
                itemLayout="horizontal"
                dataSource={data}
                renderItem={(item) => (
                    <List.Item>
                        <List.Item.Meta
                            avatar={<Avatar src="https://joesch.moe/api/v1/random" />}
                            title={<a href="https://ant.design">{item.title}</a>}
                            description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                        />
                    </List.Item>
                )}
            />
            break;
        case "ingredients":
            content = <Ingredients ingre={ingre} />
            break;
        default:
            content = <Instructions steps={steps} />
            break;
    }

    return <div className="recipe-read">
        <div className="col-1">
            <img alt="example" src={`https://source.unsplash.com/random/?Food`} style={{ height: 260, objectFit: 'cover' }}/>
            <div className="recipe-instructions">
                <p className="recipe-description">{parse(elem.content)}</p>
                <div className="rating">
                    {/*<Rate disabled defaultValue={elem.rate} />*/}
                    <Rate disabled defaultValue={3} />
                </div>

                <div className="instructions">
                    <h2>Instructions</h2>
                    <Instructions steps={steps} />
                </div>
            </div>
        </div>
        <div className="col-2">
            <div className="recipe-menu">
                <Radio.Group
                    options={menu}
                    onChange={onChangeContext}
                    value={context}
                    optionType="button"
                    buttonStyle="solid"
                />
            </div>
            <div className="recipe-menu-tiny">
                <Radio.Group
                    options={menuTiny}
                    onChange={onChangeContext}
                    value={context}
                    optionType="button"
                    buttonStyle="solid"
                />
            </div>

            <div className="menu-content">
                <div className="recipe-data">
                    {elem.durationPrepare && <div className="recipe-data-item">
                        <span className="icon-time"></span>
                        <span>{Sanitaze.toDateFormat(elem.durationPrepare, 'LT')} minutes de préparation</span>
                    </div>}

                    {elem.durationCooking && <div className="recipe-data-item">
                        <span className="icon-time"></span>
                        <span>{Sanitaze.toDateFormat(elem.durationCooking, 'LT')} minutes de cuisson</span>
                    </div>}

                    <div className="recipe-data-item">
                        <span className="icon-group"></span>
                        <span>2 personnes</span>
                    </div>
                    <div className="recipe-data-item">
                        <span className="icon-flash"></span>
                        <span>Difficulté {elem.difficultyString.toLowerCase()}</span>
                    </div>
                </div>

                <h2>{_.capitalize(context)}</h2>

                {content}
            </div>
        </div>

    </div>
}

RecipeRead.propTypes = {
    elem: PropTypes.object.isRequired,
    steps: PropTypes.array.isRequired,
}

function Instructions ({ steps })
{
    let items = [];
    steps.forEach((st, index) => {
        items.push(<div className="step" key={index}>
            <div className="number">{st.position}</div>
            <div className="content">{parse(st.content)}</div>
        </div>)
    })

    return <div className="steps">{items}</div>
}

class Ingredients extends Component
{
    constructor(props) {
        super(props);

        this.state = {
            context: 'create',
            ingredients: props.ingre,
            ingreUid: uid(),
            ingreUnit: "",
            ingreNombre: "",
            ingreName: "",
            errors: []
        }
    }

    handleReset = () => { this.setState({
        ingreUid: uid(),
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
            if(ingre.uid === element.uid){
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
                ingreUid: element.uid,
                ingreUnit: Formulaire.setValue(element.unit),
                ingreNombre: Formulaire.setValue(element.nombre),
                ingreName: Formulaire.setValue(element.name),
            })
        }
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { context, ingredients, ingreUid, ingreUnit, ingreNombre, ingreName } = this.state;

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
            let data = {uid: ingreUid, nombre: ingreNombre, unit: ingreUnit, name: ingreName, context: context}

            let nIngredients = [];
            switch (context){
                case 'create':
                    nIngredients = [...ingredients, ...[data]];
                    break;
                case 'update':
                    ingredients.forEach((ingre) => {
                        if(ingre.uid === ingreUid){
                            ingre = data;
                        }

                        nIngredients.push(ingre);
                    })
                    break;
                default:
                    nIngredients = ingredients;
                    break;
            }

            this.handleReset();

            this.setState({
                ingredients: nIngredients,
                context: 'create',
            })
        }
    }

    render () {
        const { context, errors, ingredients, ingreNombre, ingreUnit, ingreName } = this.state;

        const paramsInput0 = {errors: errors, onChange: this.handleChange};

        return <div className="ingredients">
            {ingredients.map((ingre, index) => {
                return <div className="item" key={index}>
                    <div className="item-box"></div>
                    <div className="item-data">
                        <span>{ingre.nombre}</span>
                        <span>{ingre.unit}</span>
                        <span>{ingre.name}</span>
                    </div>
                    <div className="item-actions">
                        {ingre.context !== 'delete'
                            ? <>
                                <ButtonIcon onClick={() => this.handleUpdate('update', ingre)} icon="pencil">Modifier</ButtonIcon>
                                <ButtonIcon onClick={() => this.handleUpdate('delete', ingre)} icon="trash">Supprimer</ButtonIcon>
                            </>
                            : <ButtonIcon onClick={() => this.handleUpdate('revert', ingre)} icon="refresh1">Annuler</ButtonIcon>
                        }

                    </div>
                </div>
            })}
            <div className="form">
                <div className="line line-3">
                    <Input identifiant='ingreNombre' valeur={ingreNombre} placeholder='0' {...paramsInput0} />
                    <Input identifiant='ingreUnit' valeur={ingreUnit} placeholder='unité' {...paramsInput0} />
                    <Input identifiant='ingreName' valeur={ingreName} placeholder="Ingrédient" {...paramsInput0} />
                    {context === "create"
                        ? <ButtonIcon onClick={this.handleSubmit} icon="add">Ajouter</ButtonIcon>
                        : <ButtonIcon onClick={this.handleSubmit} icon="pencil">Modifier</ButtonIcon>
                    }
                </div>
            </div>
        </div>
    }
}