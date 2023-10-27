import React from "react";
import PropTypes from 'prop-types';

import { Alert } from "@commonComponents/Elements/Alert";

import { CategoriesItem } from "@userPages/Budget/Categories/CategoriesItem";

export function CategoriesList ({ data, highlight, onModal }) {
    return <div className="list">
        <div className="list-table">
            <div className="items items-budget">
                <div className="item item-header">
                    <div className="item-content">
                        <div className="item-infos item-infos-categories">
                            <div className="col-1">Type</div>
                            <div className="col-2">Intitulé</div>
                            <div className="col-3">Objectif</div>
                            <div className="col-4 actions" />
                        </div>
                    </div>
                </div>

                {data.length > 0
                    ? data.map((elem) => {
                        return <CategoriesItem key={elem.id} elem={elem} highlight={highlight} onModal={onModal} />;
                    })
                    : <Alert>Aucune donnée enregistrée.</Alert>
                }
            </div>
        </div>
    </div>
}

CategoriesList.propTypes = {
    data: PropTypes.array.isRequired,
    onModal: PropTypes.func.isRequired,
    highlight: PropTypes.number,
}
