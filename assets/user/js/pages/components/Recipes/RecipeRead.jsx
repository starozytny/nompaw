import React, { useState } from "react";
import _ from "lodash";

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

export function RecipeRead () {
    const [context, setContext] = useState('instructions');

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
            content = <Steps
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
            break;
    }

    return <div className="recipe-read">
        <div className="col-1">
            <img alt="example" src={`https://source.unsplash.com/random/?Food`} style={{ height: 260, objectFit: 'cover' }}/>
            <div className="recipe-instructions">
                <h1>Crêpe au nutella</h1>
                <div className="rating">
                    <Rate disabled defaultValue={3} />
                </div>

                <div className="recipe-menu">
                    <Radio.Group
                        options={menu}
                        onChange={onChangeContext}
                        value={context}
                        optionType="button"
                        buttonStyle="solid"
                    />
                </div>

                <div className="instructions">
                    <h2>{_.capitalize(context)}</h2>
                    {content}
                </div>
            </div>
        </div>
        <div className="col-2">

        </div>

    </div>
}