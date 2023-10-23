import React from 'react';

import Sanitaze from '@commonFunctions/sanitaze';

import { ButtonIcon } from "@commonComponents/Elements/Button";

export function BudgetItem ({ elem })
{
    return <div className="item">
        <div className="item-content">
            <div className="item-infos">
                <div className="col-1">
                    <div className="infos">
                        <div className="name">
                            <span>{Sanitaze.toDateFormat(elem.dateAt, 'Do MMM')}</span>
                        </div>
                    </div>
                </div>
                <div className="col-2">
                    <div className="name"><span>{elem.name}</span></div>
                </div>
                <div className="col-3">
                    {Sanitaze.toFormatCurrency(elem.price)}
                </div>
                <div className="col-4 actions">
                    <ButtonIcon outline={true} icon="pencil" onClick={null}>Modifier</ButtonIcon>
                    <ButtonIcon outline={true} icon="trash" onClick={null}>Supprimer</ButtonIcon>
                </div>
            </div>
        </div>
    </div>
}
