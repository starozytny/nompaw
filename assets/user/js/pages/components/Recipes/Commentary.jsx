import React, { Component } from 'react'
import PropTypes from 'prop-types';

import axios from "axios";
import parse from 'html-react-parser';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Validateur from "@commonFunctions/validateur";
import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import Sort from "@commonFunctions/sort";

import { TinyMCE } from "@tailwindComponents/Elements/TinyMCE";
import { Button } from "@tailwindComponents/Elements/Button";
import { Rate } from "antd";

const URL_CREATE_ELEMENT = 'intern_api_cook_commentaries_create';

export class Commentary extends Component {
	constructor (props) {
		super(props);

		this.state = {
			message: { value: '', html: '' },
			rate: 0,
			errors: [],
			loadData: false,
			data: props.coms
		}
	}

	handleChangeRate = (value) => {
		this.setState({ rate: value })
	}

	handleChangeTinyMCE = (name, html) => {
		this.setState({ [name]: { value: this.state[name].value, html: html } })
	}

	handleSubmit = (e) => {
		e.preventDefault();

		const { recipe } = this.props;
		const { loadData, message } = this.state;

		this.setState({ errors: [] });

		let validate = Validateur.validateur([{ type: "text", id: 'message', value: message }])

		if (!validate.code) {
			Formulaire.showErrors(this, validate);
		} else {
			if (!loadData) {
				this.setState({ loadData: true })

				let self = this;
				axios({ method: 'POST', url: Routing.generate(URL_CREATE_ELEMENT, { 'recipe': recipe.id }), data: this.state })
					.then(function (response) {
						location.reload();
					})
					.catch(function (error) {
						Formulaire.displayErrors(self, error);
					})
				;
			}
		}
	}

	render () {
		const { recipe } = this.props;
		const { loadData, errors, message, data, rate } = this.state;

		data.sort(Sort.compareCreatedAtInverse);

		return <div className="bg-white p-4 border rounded-md">
            <div className="flex flex-col gap-4">
                <div>
                    <TinyMCE type={5} identifiant='message' valeur={message.value} params={{ 'id': recipe.id }}
                             errors={errors} onUpdateData={this.handleChangeTinyMCE} key={loadData} />
                </div>
                <div>
                    <Rate defaultValue={rate} onChange={this.handleChangeRate} />
                </div>
                <Button onClick={this.handleSubmit} type="blue">Ajouter le commentaire</Button>
            </div>

            {data.length > 0
                ? <div className="mt-4 pt-4 border-t">
                    {data.map((elem, index) => {
                        return <div className="flex gap-2" key={index}>
                            <div>
                                {elem.user.avatarFile
                                    ? <img src={elem.user.avatarFile} alt={`avatar de ${elem.user.username}`} className="h-8 w-8 rounded-full" />
                                    : <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center font-semibold">
                                        {elem.user.lastname.slice(0, 1) + elem.user.firstname.slice(0, 1)}
                                    </div>
                                }
                            </div>
                            <div className="w-full">
                                <div className="font-semibold text-sm">{elem.user.username}</div>
                                <div className="rating"><Rate disabled defaultValue={elem.rate} /></div>
                                <div className="text-sm">{parse(elem.message)}</div>
                                <div className="text-gray-600 text-xs text-right">{Sanitaze.toFormatCalendar(elem.createdAt)}</div>
                            </div>
                        </div>
                    })}
                </div>
            : null
            }
        </div>
    }
}

Commentary.propTypes = {
    mode: PropTypes.bool.isRequired,
    recipe: PropTypes.object.isRequired,
    coms: PropTypes.array.isRequired,
}
