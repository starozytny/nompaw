import React from 'react';

import Sanitaze from '@commonFunctions/sanitaze';

import { ButtonIcon } from "@commonComponents/Elements/Button";

export function BudgetItem ({ elem, onEdit, onModal, onActive, onCancel })
{
    return <div className={`item${!elem.isActive ? " item-prev" : ""}${elem.type === 3 ? " item-trash" : ""}`}>
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
                    <div className="badges">
                        {!elem.isActive && <div className="badge badge-action badge-0" onClick={() => onActive(elem)}>Prévisionnel</div>}
                        {elem.recurrenceId && <div className="badge badge-0">Récurrence</div>}
                        {elem.type !== 4 && elem.category && <div className={`badge badge-type-${elem.category.type}`}>{elem.category.name}</div>}
                    </div>
                </div>
                <div className="col-3">
                    <div className={`type-${elem.type}`}>
                        <span className={`icon-${elem.typeIcon}`}></span> {Sanitaze.toFormatCurrency(elem.price)}
                    </div>
                </div>
                <div className="col-4 actions" style={{textDecoration: 'initial'}}>
                    {elem.type === 3
                        ? <ButtonIcon outline={true} icon="refresh1" onClick={() => onCancel(elem)} tooltipWidth={150}>Annuler la suppression</ButtonIcon>
                        : <>
                            {elem.type !== 4 && <ButtonIcon outline={true} icon="pencil" onClick={() => onEdit(elem)}>Modifier</ButtonIcon>}
                            <ButtonIcon outline={true} icon="trash" onClick={() => onModal('deleteRef', elem)}>Supprimer</ButtonIcon>
                        </>
                    }
                </div>
            </div>
        </div>
    </div>
}

export function BudgetItemRecurrent ({ elem, onModal, onActive })
{
    return <div className="item item-prev">
        <div className="item-content">
            <div className="item-infos">
                <div className="col-1">
                    <div className="infos">
                        <div className="name">
                            <span>-</span>
                        </div>
                    </div>
                </div>
                <div className="col-2">
                    <div className="name"><span>{elem.name}</span></div>
                    <div className="badge badge-0" onClick={() => onActive(elem)}>Activer cette récurrence</div>
                </div>
                <div className="col-3">
                    <div className={`type-${elem.type}`}>
                        <span className={`icon-${elem.typeIcon}`}></span> {Sanitaze.toFormatCurrency(elem.price)}
                    </div>
                </div>
                <div className="col-4 actions">
                    <ButtonIcon outline={true} icon="trash" onClick={() => onModal('trashRef', elem)}>Supprimer</ButtonIcon>
                </div>
            </div>
        </div>
    </div>
}
