import React from "react";
import PropTypes from 'prop-types';

import { Alert } from "@tailwindComponents/Elements/Alert";

import { RecurrencesItem } from "@userPages/Budget/Reccurences/RecurrencesItem";

export function RecurrencesList ({ data, highlight, onModal }) {
    return <div className="list">
        <div className="list-table">
            <div className="items items-budget">
                <div className="item item-header">
                    <div className="item-content">
                        <div className="item-infos">
                            <div className="col-1">Type</div>
                            <div className="col-2">Intitulé</div>
                            <div className="col-3">Prix</div>
                            <div className="col-4 actions" />
                        </div>
                    </div>
                </div>

                {data.length > 0
                    ? data.map((elem) => {
                        return <RecurrencesItem key={elem.id} elem={elem} highlight={highlight} onModal={onModal} />;
                    })
                    : <Alert>Aucune donnée enregistrée.</Alert>
                }
            </div>
        </div>
    </div>
}

RecurrencesList.propTypes = {
    data: PropTypes.array.isRequired,
    onModal: PropTypes.func.isRequired,
    highlight: PropTypes.number,
}
