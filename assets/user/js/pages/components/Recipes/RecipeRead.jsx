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

import { Ingredients } from "@userPages/Recipes/Ingredients";
import { Input } from "@commonComponents/Elements/Fields";
import { ButtonIcon } from "@commonComponents/Elements/Button";

const URL_UPDATE_DATA = 'api_recipes_update_data';

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

export class RecipeRead extends Component {
    constructor(props) {
        super(props);

        const elem = props.elem;

        this.state = {
            context: window.matchMedia("(min-width: 1280px)").matches ? 'ingredients' : 'ingredients',
            nbPerson: Formulaire.setValue(elem.nbPerson),
            errors: [],
            loadData: false,
        }
    }

    handleChangeContext = (context) => { this.setState({ context }) }

    handleChange = (e) => { this.setState({ [e.currentTarget.name]: e.currentTarget.value }) }

    handleSubmit = (e, type, name) => {
        e.preventDefault();

        const { elem } = this.props;
        const { loadData } = this.state;

        this.setState({ errors: [] });

        let value = this.state[name];
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
                        self.setState({ [name]: value, loadData: false })
                    })
                    .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
                ;
            }
        }
    }

    render () {
        const { mode, elem, steps, ingre } = this.props;
        const { context, errors, loadData, nbPerson } = this.state;

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
                content = <Instructions steps={steps} />
                break;
        }

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
                        <Instructions steps={steps} />
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
                        {elem.durationPrepare && <div className="recipe-data-item">
                            <span className="icon-time"></span>
                            <span>{Sanitaze.toDateFormat(elem.durationPrepare, 'LT')} minutes de préparation</span>
                        </div>}

                        {elem.durationCooking && <div className="recipe-data-item">
                            <span className="icon-time"></span>
                            <span>{Sanitaze.toDateFormat(elem.durationCooking, 'LT')} minutes de cuisson</span>
                        </div>}

                        {(mode || elem.nbPerson) && <div className="recipe-data-item">
                            <span className="icon-group"></span>
                            {mode
                                ? <div className="form-input">
                                    <Input identifiant="nbPerson" valeur={nbPerson} placeholder="Pour combien de pers." {...paramsInput0} />
                                    {loadData
                                        ? <ButtonIcon icon='chart-3' isLoader={true} />
                                        : <ButtonIcon icon='check1'
                                                      onClick={(e) => this.handleSubmit(e, 'text', 'nbPerson')}>
                                            Enregistrer
                                        </ButtonIcon>
                                    }
                                </div>
                                : <span>{nbPerson} personnes</span>
                            }
                        </div>}
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