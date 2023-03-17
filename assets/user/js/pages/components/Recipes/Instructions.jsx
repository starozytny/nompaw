import React, { Component } from 'react';
import PropTypes from 'prop-types';

import axios from "axios";
import toastr from "toastr";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import { uid } from "uid";
import parse from "html-react-parser";

import Formulaire from "@commonFunctions/formulaire";

import { Button }           from "@commonComponents/Elements/Button";
import { LoaderTxt }        from "@commonComponents/Elements/Loader";
import { StepFormulaire }   from "@userPages/Recipes/StepForm";

const URL_UPDATE_ELEMENT = "api_instructions_update";

export class Instructions extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loadData: false,
            loadSteps: true,
        }
    }

    componentDidMount = () => {
        const { steps } = this.props;

        let nbSteps = steps.length > 0 ? steps.length : 1;

        if(steps.length > 0){
            let self = this;
            steps.forEach((s, index) => {
                self.setState({ [`step${index + 1}`]: { uid: uid(), value: s.content} })
            })
        }else{
            this.setState({ step1: { uid: uid(), value: '' } })
        }

        this.setState({ nbSteps: nbSteps, loadStep: false })
    }

    handleChangeTinyMCE = (name, html) => {
        this.setState({ [name]: {value: this.state[name].value, html: html} })
    }

    handleIncreaseStep = () => { this.setState((prevState, prevProps) => ({
        nbSteps: prevState.nbSteps + 1, [`step${(prevState.nbSteps + 1)}`]: { uid: uid(), value: '' }
    })) }

    handleUpdateContentStep = (i, content) => {
        let name = `step${i}`;
        this.setState({ [name]: { uid: this.state[name].uid, value: content } })
    }

    handleRemoveStep = (step) => {
        const { nbSteps } = this.state;

        this.setState({ loadStep: true })

        let newNbSteps = nbSteps - 1;
        if(step !== nbSteps){
            for(let i = step + 1; i <= nbSteps ; i++){
                this.setState({ [`step${i - 1}`]: { uid: uid(), value: this.state[`step${i}`].value } })
            }
        }

        this.setState({ nbSteps: newNbSteps, loadStep: false })
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { recipe } = this.props;
        const { loadData } = this.state;

        this.setState({ errors: [] });

        if(!loadData){
            this.setState({ loadData: true })
            let self = this;
            axios({ method: "PUT", url: Routing.generate(URL_UPDATE_ELEMENT, {'recipe': recipe.id}), data: this.state })
                .then(function (response) {
                    toastr.info('Recette mise à jour.');
                    self.setState({ loadData: false })
                })
                .catch(function (error) { Formulaire.displayErrors(self, error); Formulaire.loader(false); })
            ;
        }
    }

    render () {
        const { mode, recipe } = this.props;
        const { loadData, loadStep, nbSteps } = this.state;

        let steps = [];
        for(let i = 1 ; i <= nbSteps ; i++){
            let val = this.state[`step${i}`];
            steps.push(<div className="step" key={i}>
                <div className="number">{i}</div>
                {mode
                    ? <StepFormulaire key={val.uid} content={val.value} step={i} recipe={recipe}
                                     onUpdateData={this.handleUpdateContentStep}
                                     onRemoveStep={this.handleRemoveStep} />
                    : <div className="content">{parse(val.value)}</div>
                }

            </div>)
        }

        return <div className="steps">
            {loadStep
                ? <LoaderTxt />
                : <>
                    {steps}
                    {mode
                        ? <div className="line">
                            <Button outline={true} type="warning" onClick={this.handleIncreaseStep}>Ajouter une étape</Button>
                            <Button isLoader={loadData} type="primary" onClick={this.handleSubmit}>Valider les modifications</Button>
                        </div>
                        : null
                    }
                </>
            }
        </div>
    }
}

Instructions.propTypes = {
    recipe: PropTypes.object.isRequired,
    steps: PropTypes.array.isRequired,
}