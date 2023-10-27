import React from 'react';

import Sanitaze from '@commonFunctions/sanitaze';

import { ButtonIcon } from "@commonComponents/Elements/Button";

export function BudgetItem ({ elem, onEdit, onModal, onActive })
{
    return <div className={`item${!elem.isActive ? " item-prev" : ""}`}>
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
                    {!elem.isActive && <div className="badge badge-0" onClick={() => onActive(elem)}>Prévisionnel</div>}
                </div>
                <div className="col-3">
                    <div className={`type-${elem.type}`}>
                        <span className={`icon-${elem.typeIcon}`}></span> {Sanitaze.toFormatCurrency(elem.price)}
                    </div>
                </div>
                <div className="col-4 actions">
                    <ButtonIcon outline={true} icon="pencil" onClick={() => onEdit(elem)}>Modifier</ButtonIcon>
                    <ButtonIcon outline={true} icon="trash" onClick={() => onModal('deleteRef', elem)}>Supprimer</ButtonIcon>
                </div>
            </div>
        </div>
    </div>
}
