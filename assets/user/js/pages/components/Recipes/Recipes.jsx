import React, { Component } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";

import { EyeOutlined, HeartOutlined } from "@ant-design/icons";
import { Avatar, Card } from "antd";

import { LoaderTxt } from "@commonComponents/Elements/Loader";

const { Meta } = Card;

const URL_GET_DATA = "api_recipes_list"

export class Recipes extends Component {
    constructor(props) {
        super(props);

        this.state = {
            data: [],
            loadData: true
        }
    }

    componentDidMount = () => {
        let self = this;
        axios({ method: "GET", url: Routing.generate(URL_GET_DATA), data: {} })
            .then(function (response) {
                self.setState({ data: response.data, loadData: false })
            })
            .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
        ;
    }

    render () {
        const { loadData, data } = this.state;

        return <div className="main-content">
            <div className="list-recipes">
                {loadData
                    ? <LoaderTxt />
                    : (data.map((elem, index) => {
                        return <Card
                            cover={
                                <img alt="example" src={`https://source.unsplash.com/random/?Food&${index}`} style={{ height: 260, objectFit: 'cover' }}/>
                            }
                            actions={[
                                <a href={Routing.generate('user_recipes_read', {'slug': elem.slug})}>
                                    <EyeOutlined key="voir" />
                                </a>,
                                <HeartOutlined key="favoris" />
                            ]}
                            key={index}
                        >
                            <Meta
                                avatar={<Avatar src="https://joesch.moe/api/v1/random" />}
                                title={elem.name}
                                description={elem.content}
                            />
                        </Card>
                    }))
                }
            </div>
        </div>
    }
}