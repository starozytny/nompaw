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
import Inputs     from "@commonFunctions/inputs";

import moment from "moment";
import 'moment/locale/fr';

import { Radio, Rate } from "antd";
import { Input, Radiobox } from "@commonComponents/Elements/Fields";
import { ButtonIcon } from "@commonComponents/Elements/Button";
import { TinyMCE } from "@commonComponents/Elements/TinyMCE";

import { Ingredients }  from "@userPages/Recipes/Ingredients";
import { Instructions } from "@userPages/Recipes/Instructions";
import {Commentary} from "@userPages/Recipes/Commentary";

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

export class RecipeRead extends Component {
    constructor(props) {
        super(props);

        const elem = props.elem;
        let description = elem.content ? elem.content : "";

        this.state = {
            context: window.matchMedia("(min-width: 1280px)").matches ? 'ingredients' : 'instructions',
            elem: elem,
            nbPerson: Formulaire.setValue(elem.nbPerson),
            difficulty: Formulaire.setValue(elem.difficulty),
            durationCooking: Formulaire.setValueTime(elem.durationCooking),
            durationPrepare: Formulaire.setValueTime(elem.durationPrepare),
            description: { value: description, html: description },
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

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleSubmit = (e, type, name, nValue = null) => {
        e.preventDefault();

        const { elem } = this.props;
        const { loadData } = this.state;

        this.setState({ errors: [] });

        let value = nValue ? nValue : this.state[name];
        let paramsToValidate = [{type: type, id: name, value: value}];
        if(type === "textarea"){
            paramsToValidate = [{type: 'text', id: name, value: value.html}];
        }

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
        const { context, errors, loadData, nbPerson, difficulty, durationCooking, durationPrepare, description } = this.state;

        let content;
        switch (context){
            case "avis":
                content = <Commentary mode={mode} recipe={elem} />
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
                    {(mode || elem.content) && <p className="recipe-description">
                        {mode
                            ? <div className="form-input">
                                <TinyMCE type={4} identifiant='description' valeur={description.value} params={{'id': elem.id}}
                                         errors={errors} onUpdateData={this.handleChangeTinyMCE} />
                                {loadData
                                    ? <ButtonIcon icon='chart-3' isLoader={true} />
                                    : <ButtonIcon icon='check1' type="primary"
                                                  onClick={(e) => this.handleSubmit(e, 'textarea', 'description')}>
                                        Enregistrer
                                    </ButtonIcon>
                                }
                            </div>
                            : parse(elem.content)
                        }
                    </p>}
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
                        {(mode || elem.durationPrepare) ? <div className="recipe-data-item">
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
                        </div> : null}
                        {(mode || elem.durationCooking) ? <div className="recipe-data-item">
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
                        </div> : null}
                        {(mode || elem.nbPerson) ? <div className="recipe-data-item">
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
                        </div> : null}
                        {(mode || elem.difficulty) ? <div className="recipe-data-item">
                            <span className="icon-flash"></span>
                            {mode
                                ? <div className="form-input" style={{ marginTop: '5px' }}>
                                    <Radiobox items={difficultyItems} identifiant="difficulty" valeur={difficulty} {...paramsInput0} />
                                </div>
                                : <span>Difficulté {elem.difficultyString.toLowerCase()}</span>
                            }
                        </div> : null}
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