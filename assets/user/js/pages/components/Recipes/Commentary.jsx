import React, { Component } from 'react'
import PropTypes from 'prop-types';

import axios from "axios";
import parse from 'html-react-parser';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Validateur from "@commonFunctions/validateur";
import Formulaire from "@commonFunctions/formulaire";
import Sanitaze   from "@commonFunctions/sanitaze";
import Sort       from "@commonFunctions/sort";

import { TinyMCE } from "@commonComponents/Elements/TinyMCE";
import { Button }  from "@commonComponents/Elements/Button";

const URL_CREATE_ELEMENT = 'api_cook_commentaries_create';

export class Commentary extends Component {
    constructor(props) {
        super(props);

        this.state = {
            message: {value: '', html: ''},
            errors: [],
            loadData: false,
            data: props.coms
        }

        this.editorMsg = React.createRef();
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
                        self.setState({ data: [...self.state.data, ...[response.data]], message: {value: '', html: ''}, loadData: false })
                    })
                    .catch(function (error) { Formulaire.displayErrors(self, error); })
                ;
            }
        }
    }

    render () {
        const { recipe } = this.props;
        const { loadData, errors, message, data } = this.state;

        data.sort(Sort.compareCreatedAtInverse);

        return <>
            <div className="form">
                <div className="line">
                    <TinyMCE ref={this.editorMsg} type={5} identifiant='message' valeur={message.value} params={{'id': recipe.id}}
                             errors={errors} onUpdateData={this.handleChangeTinyMCE} key={loadData} />
                </div>
                <div className="line-buttons">
                    <Button onClick={this.handleSubmit} type="primary">Ajouter le commentaire</Button>
                </div>
            </div>

            <div className="commentaries">
                {data.map((elem, index) => {
                    return <div className="commentary" key={index}>
                        <div className="commentary-avatar avatar">
                            {elem.avatarFile
                                ? <img src={elem.user.avatarFile} alt={`avatar de ${elem.user.username}`}/>
                                : <div className="avatar-letter">{elem.user.lastname.slice(0,1) + elem.user.firstname.slice(0,1)}</div>
                            }
                        </div>
                        <div className="commentary-body">
                            <div className="name">{elem.user.username}</div>
                            <div className="message">{parse(elem.message)}</div>
                            <div className="date">{Sanitaze.toFormatCalendar(elem.createdAt)}</div>
                        </div>
                    </div>
                })}
            </div>
        </>
    }
}

Commentary.propTypes = {
    mode: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
    coms: PropTypes.array.isRequired,
}
