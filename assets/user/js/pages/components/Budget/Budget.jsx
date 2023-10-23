import React, { useState } from 'react';

import Sanitaze from "@commonFunctions/sanitaze";
import List from "@commonFunctions/list";
import Sort from "@commonFunctions/sort";

import { BudgetFormulaire } from "@userPages/Budget/BudgetForm";
import { BudgetList } from "@userPages/Budget/BudgetList";

const SORTER = Sort.compareDateAtInverse;

export function Budget ({ donnees, y, m })
{
    const [year, setYear] = useState(parseInt(y))
    const [month, setMonth] = useState(parseInt(m))
    const [data, setData] = useState(JSON.parse(donnees))

    let handleUpdateList = (elem, context) => {
        setData(List.updateDataMuta(elem, context, data, SORTER));
    }

    let totauxExpense = [0,0,0,0,0,0,0,0,0,0,0,0];
    let totauxIncome  = [0,0,0,0,0,0,0,0,0,0,0,0];

    let totalExpense = 0, totalIncome = 0, totalSaving = 0;
    data.forEach(d => {
        if(d.month === month){
            switch (d.type){
                case 0: totalExpense += d.price; break;
                case 1: totalIncome += d.price; break;
                case 2: totalSaving += d.price; break;
                default:break;
            }
        }

        switch (d.type){
            case 0: case 2: totauxExpense[d.month - 1] += d.price; break;
            case 1: totauxIncome[d.month - 1] += d.price; break;
            default:break;
        }
    })

    let totaux = [];
    for(let i = 0; i < 12 ; i++){
        let tmpDispo = totauxIncome[i] - totauxExpense[i];
        totaux.push(i <= 0 ? tmpDispo : totaux[i - 1] + tmpDispo);
    }

    let initial = month !== 1 ? totaux[month - 2] : 0;
    let totalDispo = initial + totalIncome - (totalExpense + totalSaving);

    let cards = [
        { value: 0, name: "Budget disponible",  total: totalDispo,    initial: initial, icon: "credit-card" },
        { value: 1, name: "Dépenses",           total: totalExpense,  initial: null,    icon: "minus" },
        { value: 2, name: "Revenus",            total: totalIncome,   initial: null,    icon: "add" },
        { value: 3, name: "Economies",          total: totalSaving,   initial: null,    icon: "time" },
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
                    <BudgetFormulaire context="create" element={null} year={year} month={month}
                                      onUpdateList={handleUpdateList}
                                      key={month} />
                </div>
                <div className="col-2">
                    <BudgetList data={data} />
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
            <div className="totaux">{Sanitaze.toFormatCurrency(totaux[elem.id - 1])}</div>
        </div>
    })

    return <>
        <div className="planning">
            {items}
        </div>
    </>
}
