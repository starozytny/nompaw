import React from 'react';

import { Alert } from "@commonComponents/Elements/Alert";

import { BudgetItem } from "@userPages/Budget/BudgetItem";

export function BudgetList ({ data })
{
    return <div className="list">
        <div className="list-table">
            <div className="items">
                <div className="item item-header">
                    <div className="item-content">
                        <div className="item-infos">
                            <div className="col-1">Date</div>
                            <div className="col-2">Intitulé</div>
                            <div className="col-3">Prix</div>
                            <div className="col-4 actions" />
                        </div>
                    </div>
                </div>

                {data.length > 0
                    ? data.map(elem => {
                        return <BudgetItem elem={elem} key={elem.id} />
                    })
                    : <Alert>Aucune donnée enregistrée.</Alert>
                }
            </div>
        </div>
    </div>
}