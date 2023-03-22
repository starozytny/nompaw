import React, { Component } from "react";
import PropTypes from "prop-types";;

export class RandoAdventure extends Component {
    render() {
        const { haveAdventure } = this.props;

        return <div className="rando-card">
            <div className="rando-card-header">
                <div className="name">{haveAdventure ? "Aventure sélectionnée" : "Proposition d'aventures"}</div>
            </div>
            <div className={`rando-card-body${haveAdventure ? " selected" : ""}`}>
                {haveAdventure
                    ? <div className="propals">
                        <div className="propal selected">
                            Aventure
                        </div>
                    </div>
                    : <>
                        <div className="propals">
                            propals
                        </div>
                    </>
                }
            </div>
            {haveAdventure === ""
                ? <div className="rando-card-footer" onClick={() => this.handleModal('formPropal', 'create', null)}>
                    <div style={{display: 'flex', gap: '4px'}}>
                        <span className="icon-add"></span>
                        <span>Proposer une aventure</span>
                    </div>
                </div>
                :  <div className="rando-card-footer rando-card-footer-danger" onClick={() => this.handleModal('cancelDate', 'delete', null)}>
                    <div style={{display: 'flex', gap: '4px'}}>
                        <span className="icon-close"></span>
                        <span>Annuler l'aventure sélectionnée</span>
                    </div>
                </div>
            }
        </div>
    }
}

RandoAdventure.propTypes = {
    mode: PropTypes.bool.isRequired,
    haveAdventure: PropTypes.bool.isRequired,
    userId: PropTypes.string.isRequired,
    randoId: PropTypes.string.isRequired,
}
