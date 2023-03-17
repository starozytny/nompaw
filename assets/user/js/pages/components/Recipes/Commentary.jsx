import React, { Component } from 'react'
import PropTypes from 'prop-types';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Validateur from "@commonFunctions/validateur";
import Formulaire from "@commonFunctions/formulaire";

import { Avatar, List } from "antd";
import { TinyMCE } from "@commonComponents/Elements/TinyMCE";
import { Button }  from "@commonComponents/Elements/Button";

const data = [
    {title: 'Ant Design Title 1',},
    {title: 'Ant Design Title 2',},
    {title: 'Ant Design Title 3',},
    {title: 'Ant Design Title 4',},
];

const URL_CREATE_ELEMENT = 'api_commentaries_create';

export class Commentary extends Component {
    constructor(props) {
        super(props);

        this.state = {
            message: {value: '', html: ''},
            errors: [],
            loadData: false,
            data: []
        }
    }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { recipe } = this.props;
        const { loadData, message } = this.state;

        this.setState({ errors: [] });

        let validate = Validateur.validateur([{type: "text",  id: 'message', value: message}])
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            if(!loadData){
                this.setState({ loadData: true })

                let self = this;
                axios({ method: 'POST', url: Routing.generate(URL_CREATE_ELEMENT, {'recipe': recipe.id}), data: this.state })
                    .then(function (response) {
                        self.setState({ data: [...self.state.data, ...[response.data]] })
                    })
                    .catch(function (error) { Formulaire.displayErrors(self, error); })
                ;
            }
        }
    }

    render () {
        const { recipe } = this.props;
        const { errors, message, data } = this.state;

        console.log(data);

        return <>
            <List
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

            <div className="form">
                <div className="line">
                    <TinyMCE type={5} identifiant='message' valeur={message.value} params={{'id': recipe.id}}
                             errors={errors} onUpdateData={this.handleChangeTinyMCE} />
                </div>
                <div className="line-buttons">
                    <Button onClick={this.handleSubmit} type="primary">Ajouter le commentaire</Button>
                </div>
            </div>

        </>
    }
}

Commentary.propTypes = {
    mode: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
}