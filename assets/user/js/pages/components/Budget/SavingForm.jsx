import React, { Component } from 'react';

import Formulaire  from "@commonFunctions/formulaire";
import Validateur  from "@commonFunctions/validateur";
import Inputs      from "@commonFunctions/inputs";

import { Input } from "@commonComponents/Elements/Fields";
import { Button } from "@commonComponents/Elements/Button";

export class SavingForm extends Component {
    constructor(props) {
        super(props);

        this.state = {
            total: '',
            errors: [],
        }
    }
    componentDidMount = () => {
        if(!!this.props.saving){
            let body = document.querySelector("body");
            let modal = document.getElementById(this.props.identifiant);
            let btns = document.querySelectorAll(".close-modal");

            btns.forEach(btn => {
                btn.addEventListener('click', () => {
                    body.style.overflow = "auto";
                    modal.style.display = "none";
                })
            })
        }
    }

    handleCloseModal = () => {
        let body = document.querySelector("body");
        let modal = document.getElementById(this.props.identifiant);

        body.style.overflow = "auto";
        modal.style.display = "none";
    }

    handleChange = (e) => {
        let name = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "total"){
            value = Inputs.textMoneyMinusInput(value, this.state.total);
        }

        this.setState({[name]: value})
    }

    handleSubmit = (e) => {
        e.preventDefault();

        const { saving } = this.props;
        const { total } = this.state;

        this.setState({ errors: [] });

        let validate = Validateur.validateur([{type: "text", id: 'total', value: total}])
        if(!validate.code){
            Formulaire.showErrors(this, validate);
        }else {
            this.props.onUseSaving(saving, total)
        }
    }

    render () {
        const { saving } = this.props;
        const { errors, total } = this.state;

        let params = { errors: errors, onChange: this.handleChange };

        return <>
            <div className="modal-body">
                <p style={{marginBottom: '12px'}}>Combien souhaitez-vous utiliser depuis les économies de : <b>{saving ? saving.name : ""}</b> ?</p>
                <form onSubmit={this.handleSubmit}>
                    <div className="line">
                        <Input identifiant="total" valeur={total} {...params}>Solde à utiliser</Input>
                    </div>
                </form>
            </div>
            <div className="modal-footer">
                <Button type="primary" onClick={this.handleSubmit}>Confirmer</Button>
                <div className="close-modal"><Button type="reverse" onClick={this.handleCloseModal}>Annuler</Button></div>
            </div>
        </>
    }
}
