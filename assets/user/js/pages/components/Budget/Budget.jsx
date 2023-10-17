import React, { useState } from 'react';

const TYPE_EXPENSE = 0;
const TYPE_INCOME = 1;
const TYPE_SAVING = 2;

export function Budget () {

    let today = new Date()

    const [year, setYear] = useState(today.getFullYear())
    const [month, setMonth] = useState(today.getMonth() + 1)

    console.log(month, today.getMonth() + 1)

    return <div className="page-default">

        <div className="budget">

            <div className="budget-planning">
                <Year year={year} onSelect={setYear} />
                <Months active={month} onSelect={setMonth} useShortName={false} />
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

function Months ({ active, onSelect, useShortName }) {
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
            {/*<div>{Sanitaze.toFormatCurrency(totaux[elem.id])}</div>*/}
        </div>
    })

    return <>
        <div className="planning">
            {items}
        </div>
    </>
}