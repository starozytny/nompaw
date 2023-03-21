import React, { Component } from "react";
import PropTypes from "prop-types";

import Inputs from "@commonFunctions/inputs";

import { Button } from "@commonComponents/Elements/Button";
import { Modal } from "@commonComponents/Elements/Modal";
import { Input } from "@commonComponents/Elements/Fields";

export class RandoDate extends Component{
    constructor(props) {
        super(props);

        this.state = {
            date: '',
            errors: [],
        }

        this.modal = React.createRef();
    }

    componentDidMount = () => { Inputs.initDateInput(this.handleChangeDate, this.handleChange, new Date()) }

    handleChange = (e, picker) => {
        let name  = e.currentTarget.name;
        let value = e.currentTarget.value;

        if(name === "date"){
            value = Inputs.dateInput(e, picker, this.state[name]);
        }

        this.setState({[name]: value})
    }

    handleChangeDate = (name, value) => { this.setState({ [name]: value }) }

    handleModal = () => {
        this.modal.current.handleClick();
    }

    handleSubmitPropals = (e) => {
        e.preventDefault();

    }

    render() {
        const { mode, startAt } = this.props;
        const { errors, date } = this.state;

        let params = { errors: errors, onChange: this.handleChange }

        return <div>
            <div className="rando-card">
                <div className="rando-card-header">
                    <div className="name">{startAt ? "Date de la randonnée" : "Proposition de dates"}</div>
                </div>
                <div className="rando-card-body">
                    {startAt
                        ? <div>startAt</div>
                        : <div className="actions">
                            <Button type="primary" icon="add" onClick={this.handleModal}>Proposer une date</Button>
                        </div>
                    }
                </div>
                <div className="rando-card-footer">
                    {startAt ? null : "Fin des votes le xx/xx/xxxx à xxhxx" }
                </div>

                <Modal ref={this.modal} identifiant="form-dates" maxWidth={568} title="Proposer une date"
                       content={<div className="line">
                           <Input type="js-date" identifiant="date" valeur={date} {...params}>Date</Input>
                       </div>}
                       footer={<Button type="primary" onClick={this.handleSubmitPropals}>Confirmer</Button>} closeTxt="Annuler" />
            </div>

        </div>
    }
}

RandoDate.propTypes = {
    mode: PropTypes.bool.isRequired,
    startAt: PropTypes.string
}