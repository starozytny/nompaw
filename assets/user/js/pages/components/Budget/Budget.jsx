import React, { useState } from 'react';

import Sanitaze from "@commonFunctions/sanitaze";
import {BudgetFormulaire} from "@userPages/Budget/BudgetForm";

const TYPE_EXPENSE = 0;
const TYPE_INCOME = 1;
const TYPE_SAVING = 2;

export function Budget ()
{
    let today = new Date()

    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth() + 1)

    let totaux = [0,0,0,0,0,0,0,0,0,0,0,0];

    let cards = [
        { value: 0, name: "Budget disponible",  total: 0,  initial: 0, icon: "credit-card" },
        { value: 1, name: "Dépenses",           total: 0,  initial: null, icon: "minus" },
        { value: 2, name: "Revenus",            total: 0,  initial: null, icon: "add" },
        { value: 3, name: "Economies",          total: 0,  initial: null, icon: "time" },
    ]

    return <div className="page-default">

        <div className="budget-planning">
            <Year year={year} onSelect={setYear} />
            <Months active={month} onSelect={setMonth} useShortName={false} totaux={totaux} />
        </div>

        <div className="budget">
            <div className="col-1">
                <div className="cards">
                    {cards.map(item => {
                        return <div className="card" key={item.value}>
                            <div className="card-icon">
                                <span className={`icon-${item.icon}`}></span>
                            </div>
                            <div className="card-body">
                                <div className="name">{item.name}</div>
                                <div className="total">{Sanitaze.toFormatCurrency(item.total)}</div>
                                {item.initial !== null && <div className="initial">Initial : {Sanitaze.toFormatCurrency(item.initial)}</div>}
                            </div>
                        </div>
                    })}
                </div>
            </div>
            <div className="col-2">
                <div className="col-1">
                    <BudgetFormulaire context="create" element={null} year={year} month={month}/>
                </div>
                <div className="col-2">
                    Liste des items
                </div>
            </div>
        </div>

    </div>
}

function Year ({ year, onSelect }){
    return <div className="planning">
        <div className="planning-item" onClick={() => onSelect(year - 1)}>
            <span className="icon-left-arrow" />
        </div>
        <div className="planning-item active">{year}</div>
        <div className="planning-item" onClick={() => onSelect(year + 1)}>
            <span className="icon-right-arrow" />
        </div>
    </div>
}

function Months ({ active, onSelect, useShortName, totaux }) {
    let data = [
        { id: 1, name: 'Janvier',        shortName: 'Jan' },
        { id: 2, name: 'Février',        shortName: 'Fev' },
        { id: 3, name: 'Mars',           shortName: 'Mar' },
        { id: 4, name: 'Avril',          shortName: 'Avr' },
        { id: 5, name: 'Mai',            shortName: 'Mai' },
        { id: 6, name: 'Juin',           shortName: 'Jui' },
        { id: 7, name: 'Juillet',        shortName: 'Jui' },
        { id: 8, name: 'Août',           shortName: 'Aoû' },
        { id: 9, name: 'Septembre',      shortName: 'Sep' },
        { id: 10, name: 'Octobre',       shortName: 'Oct' },
        { id: 11, name: 'Novembre',      shortName: 'Nov' },
        { id: 12, name: 'Décembre',      shortName: 'Dèc' },
    ];

    let items = data.map(elem => {
        return <div className={"planning-item" + (elem.id === active ? " active" : "")}
                    onClick={() => onSelect(elem.id)}
                    key={elem.id}>
            <div>{useShortName ? elem.shortName : elem.name}</div>
            <div className="totaux">{Sanitaze.toFormatCurrency(totaux[elem.id])}</div>
        </div>
    })

    return <>
        <div className="planning">
            {items}
        </div>
    </>
}
