import React, { Component } from "react";
import PropTypes from "prop-types";

import _ from "lodash";
import parse from "html-react-parser"
import axios  from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze   from '@commonFunctions/sanitaze';
import Formulaire from '@commonFunctions/formulaire';
import Validateur from "@commonFunctions/validateur";

import moment from "moment";
import 'moment/locale/fr';

import { Avatar, List, Radio, Rate } from "antd";
import {Input, Radiobox} from "@commonComponents/Elements/Fields";
import { ButtonIcon } from "@commonComponents/Elements/Button";

import { Ingredients }  from "@userPages/Recipes/Ingredients";
import { Instructions } from "@userPages/Recipes/Instructions";
import Inputs from "@commonFunctions/inputs";

const URL_UPDATE_DATA = 'api_recipes_update_data';

const menu = [
    { label: 'Instructions', value: 'instructions' },
    { label: 'Ingrédients',  value: 'ingredients' },
    { label: 'Avis',  value: 'avis' },
];

const menuTiny = [
    { label: 'Ingrédients',  value: 'ingredients' },
    { label: 'Avis',  value: 'avis' },
];

const data = [
    {title: 'Ant Design Title 1',},
    {title: 'Ant Design Title 2',},
    {title: 'Ant Design Title 3',},
    {title: 'Ant Design Title 4',},
];

export class RecipeRead extends Component {
    constructor(props) {
        super(props);

        const elem = props.elem;

        this.state = {
            context: window.matchMedia("(min-width: 1280px)").matches ? 'ingredients' : 'ingredients',
            elem: elem,
            nbPerson: Formulaire.setValue(elem.nbPerson),
            difficulty: Formulaire.setValue(elem.difficulty),
            durationCooking: Formulaire.setValueTime(elem.durationCooking),
            durationPrepare: Formulaire.setValueTime(elem.durationPrepare),
            errors: [],
            loadData: false,
        }
    }

    handleChangeContext = (e) => { console.log(e); this.setState({ context: e.target.value }) }

    handleChange = (e) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name !== "difficulty"){
            if(name === 'durationPrepare' || name === 'durationCooking'){
                value = Inputs.timeInput(e, this.state[name]);
            }

            this.setState({ [name]: value });
        }else{
            this.handleSubmit(e, 'text', 'difficulty', value);
        }
    }

    handleSubmit = (e, type, name, nValue = null) => {
        e.preventDefault();

        const { elem } = this.props;
        const { loadData } = this.state;

        this.setState({ errors: [] });

        let value = nValue ? nValue : this.state[name];
        let paramsToValidate = [{type: type,  id: name, value: value}];

        let validate = Validateur.validateur(paramsToValidate)
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            if(!loadData){
                this.setState({ loadData: true })
                let self = this;
                axios({ method: "PUT", url: Routing.generate(URL_UPDATE_DATA, {'id': elem.id}), data: {name: name, value: value} })
                    .then(function (response) {
                        toastr.info('Recette mise à jour.');
                        self.setState({ [name]: value, elem: response.data, loadData: false })
                    })
                    .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
                ;
            }
        }
    }

    render () {
        const { mode, elem, steps, ingre } = this.props;
        const { context, errors, loadData, nbPerson, difficulty, durationCooking, durationPrepare } = this.state;

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
                content = <Ingredients mode={mode} recipe={elem} ingre={ingre} />
                break;
            default:
                content = <Instructions mode={mode} recipe={elem} steps={steps} />
                break;
        }

        let difficultyItems = [
            { value: 0, label: 'Facile',     identifiant: 'type-0' },
            { value: 1, label: 'Moyen',      identifiant: 'type-1' },
            { value: 2, label: 'Difficile',  identifiant: 'type-2' },
        ]

        const paramsInput0 = {errors: errors, onChange: this.handleChange};

        return <div className="recipe-read">
            <div className="col-1">
                <img alt="example" src={elem.imageFile} style={{ height: 260, objectFit: 'cover' }}/>
                <div className="recipe-instructions">
                    <p className="recipe-description">{parse(elem.content)}</p>
                    <div className="rating">
                        {/*<Rate disabled defaultValue={elem.rate} />*/}
                        <Rate disabled defaultValue={3} />
                    </div>

                    <div className="instructions">
                        <h2>Instructions</h2>
                        <Instructions mode={mode} recipe={elem} steps={steps} />
                    </div>
                </div>
            </div>
            <div className="col-2">
                <div className="recipe-menu">
                    <Radio.Group
                        options={menu}
                        onChange={this.handleChangeContext}
                        value={context}
                        optionType="button"
                        buttonStyle="solid"
                    />
                </div>
                <div className="recipe-menu-tiny">
                    <Radio.Group
                        options={menuTiny}
                        onChange={this.handleChangeContext}
                        value={context}
                        optionType="button"
                        buttonStyle="solid"
                    />
                </div>

                <div className="menu-content">
                    <div className="recipe-data">
                        {(mode || elem.durationPrepare) && <div className="recipe-data-item">
                            <span className="icon-time"></span>
                            {mode
                                ? <div className="form-input">
                                    <Input identifiant="durationPrepare" valeur={durationPrepare} placeholder="00h00 préparation" {...paramsInput0} />
                                    {loadData
                                        ? <ButtonIcon icon='chart-3' isLoader={true} />
                                        : <ButtonIcon icon='check1' type="primary"
                                                      onClick={(e) => this.handleSubmit(e, 'time', 'durationPrepare')}>
                                            Enregistrer
                                        </ButtonIcon>
                                    }
                                </div>
                                : <span>{Sanitaze.toFormatDuration(Sanitaze.toDateFormat(elem.durationPrepare, 'LT'))} minutes de préparation</span>
                            }
                        </div>}
                        {(mode || elem.durationCooking) && <div className="recipe-data-item">
                            <span className="icon-time"></span>
                            {mode
                                ? <div className="form-input">
                                    <Input identifiant="durationCooking" valeur={durationCooking} placeholder="00h00 cuisson" {...paramsInput0} />
                                    {loadData
                                        ? <ButtonIcon icon='chart-3' isLoader={true} />
                                        : <ButtonIcon icon='check1' type="primary"
                                                      onClick={(e) => this.handleSubmit(e, 'time', 'durationCooking')}>
                                            Enregistrer
                                        </ButtonIcon>
                                    }
                                </div>
                                : <span>{Sanitaze.toFormatDuration(Sanitaze.toDateFormat(elem.durationCooking, 'LT'))} minutes de cuisson</span>
                            }
                        </div>}
                        {(mode || elem.nbPerson) && <div className="recipe-data-item">
                            <span className="icon-group"></span>
                            {mode
                                ? <div className="form-input">
                                    <Input identifiant="nbPerson" valeur={nbPerson} placeholder="Pour combien de pers." {...paramsInput0} />
                                    {loadData
                                        ? <ButtonIcon icon='chart-3' isLoader={true} />
                                        : <ButtonIcon icon='check1' type="primary"
                                                      onClick={(e) => this.handleSubmit(e, 'text', 'nbPerson')}>
                                            Enregistrer
                                        </ButtonIcon>
                                    }
                                </div>
                                : <span>{nbPerson} personnes</span>
                            }
                        </div>}
                        {(mode || elem.difficulty) && <div className="recipe-data-item">
                            <span className="icon-flash"></span>
                            {mode
                                ? <div className="form-input">
                                    <Radiobox items={difficultyItems} identifiant="difficulty" valeur={difficulty} {...paramsInput0} />
                                </div>
                                : <span>Difficulté {elem.difficultyString.toLowerCase()}</span>
                            }
                        </div>}
                    </div>

                    <h2>{_.capitalize(context)}</h2>

                    {content}
                </div>
            </div>

        </div>
    }
}

RecipeRead.propTypes = {
    elem: PropTypes.object.isRequired,
    steps: PropTypes.array.isRequired,
}