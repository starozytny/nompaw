import React, { useState } from "react";
import _ from "lodash";

import Sanitaze from '@commonFunctions/sanitaze';

import moment from "moment";
import 'moment/locale/fr';

import {Avatar, Checkbox, List, Radio, Rate, Steps} from "antd";

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

const ingredients = ['Apple', 'Pear', 'Orange'];

const data = [
    {
        title: 'Ant Design Title 1',
    },
    {
        title: 'Ant Design Title 2',
    },
    {
        title: 'Ant Design Title 3',
    },
    {
        title: 'Ant Design Title 4',
    },
];

export function RecipeRead ({ elem }) {
    const [context, setContext] = useState(window.matchMedia("(min-width: 1280px)").matches ? 'ingredients' : 'instructions');

    const onChangeContext = ({ target: { value } }) => {
        setContext(value);
    };

    const onChange = (checkedValues) => { };

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
            content = <Checkbox.Group options={ingredients} defaultValue={['Apple']} onChange={onChange} />
            break;
        default:
            content = <Instructions />
            break;
    }

    return <div className="recipe-read">
        <div className="col-1">
            <img alt="example" src={`https://source.unsplash.com/random/?Food`} style={{ height: 260, objectFit: 'cover' }}/>
            <div className="recipe-instructions">
                <h1>{elem.name}</h1>
                <div className="rating">
                    <Rate disabled defaultValue={elem.rate} />
                </div>

                <div className="instructions">
                    <h2>Instructions</h2>
                    <Instructions />
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

function Instructions ({  }) {
    return <Steps
        progressDot
        current={5}
        direction="vertical"
        items={[
            {
                title: 'Finished',
                description: 'This is a description. This is a description.',
            },
            {
                title: 'Finished',
                description: 'This is a description. This is a description.',
            },
            {
                title: 'In Progress',
                description: 'This is a description. This is a description.',
            },
            {
                title: 'Waiting',
                description: 'This is a description.',
            },
            {
                title: 'Waiting',
                description: 'This is a description.',
            },
        ]}
    />
}