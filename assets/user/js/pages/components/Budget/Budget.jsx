import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Sanitaze from "@commonFunctions/sanitaze";
import List from "@commonFunctions/list";
import Sort from "@commonFunctions/sort";

import { Modal } from "@commonComponents/Elements/Modal";
import { Button } from "@commonComponents/Elements/Button";

import { BudgetFormulaire } from "@userPages/Budget/BudgetForm";
import { BudgetList } from "@userPages/Budget/BudgetList";

const SORTER = Sort.compareDateAtInverseThenId;

const URL_INDEX_PAGE = "user_budget_index"
const URL_DELETE_ELEMENT = "intern_api_budget_items_delete"
const URL_ACTIVE_ELEMENT = "intern_api_budget_items_active"
const URL_ACTIVE_RECURRENCE = "intern_api_recurrences_active"

export function Budget ({ donnees, y, m, yearMin, initTotal, recurrences })
{
    const deleteRef = useRef(null)
    const [year, setYear] = useState(parseInt(y))
    const [month, setMonth] = useState(parseInt(m))
    const [data, setData] = useState(JSON.parse(donnees))
    const [element, setElement] = useState(null)
    const [elementToDelete, setElementToDelete] = useState(null)
    const [load, setLoad] = useState(false)

    let handleUpdateList = (elem, context) => {
        setData(List.updateDataMuta(elem, context, data, SORTER));
        setElement(null);
    }

    let handleCancelEdit = () => { setElement(null) }

    let handleEdit = (elem) => { setElement(elem); }

    let handleModal = (identifiant, elem) => {
        let ref;
        switch (identifiant){
            case 'deleteRef':
                ref = deleteRef;
                setElementToDelete(elem);
                deleteRef.current.handleUpdateFooter(<Button type="danger" onClick={() => handleDelete(elem)}>Confirmer la suppression</Button>)
                break;
            default:break;
        }
        if(ref){
            ref.current.handleClick();
        }
    }

    let handleDelete = (elem) => {
        if(!load){
            setLoad(true)
            deleteRef.current.handleUpdateFooter(<Button type="danger" isLoader={true}>Confirmer la suppression</Button>)

            axios({ method: "DELETE", url: Routing.generate(URL_DELETE_ELEMENT, {'id': elem.id}), data: {} })
                .then(function (response) {
                    handleUpdateList(elem, "delete")
                    setElementToDelete(null);
                    deleteRef.current.handleClose();
                })
                .catch(function (error) { Formulaire.displayErrors(null, error); })
                .then(function () { setLoad(false) })
            ;
        }
    }

    let handleActive = (elem) => {
        if(!load){
            setLoad(true)

            axios({ method: "PUT", url: Routing.generate(URL_ACTIVE_ELEMENT, {'id': elem.id}), data: {} })
                .then(function (response) { handleUpdateList(response.data, "update") })
                .catch(function (error) { Formulaire.displayErrors(null, error); })
                .then(function () { setLoad(false) })
            ;
        }
    }

    let handleActiveRecurrence = (elem) => {
        if(!load){
            setLoad(true)

            axios({ method: "PUT", url: Routing.generate(URL_ACTIVE_RECURRENCE, {'id': elem.id}), data: {'year': year, 'month': month} })
                .then(function (response) { handleUpdateList(response.data, "create") })
                .catch(function (error) { Formulaire.displayErrors(null, error); })
                .then(function () { setLoad(false) })
            ;
        }
    }

    let recurrencesData = JSON.parse(recurrences);
    let totauxExpense = [0,0,0,0,0,0,0,0,0,0,0,0];
    let totauxIncome  = [0,0,0,0,0,0,0,0,0,0,0,0];

    let totalExpense = 0, totalIncome = 0, totalSaving = 0;
    let nData = [], nRecurrencesData = recurrencesData;

    // set totaux with recurrences
    for(let i = 0; i < 12 ; i++){
        recurrencesData.forEach(d => {
            if(d.initYear > year || (d.initYear === year && i + 1 >= d.initMonth) ){
                switch (d.type){
                    case 0: case 2: totauxExpense[i] += d.price; break;
                    case 1: totauxIncome[i] += d.price; break;
                    default:break;
                }
            }
        })

        if(i + 1 === month){
            recurrencesData.forEach(d => {
                if(d.initYear > year || (d.initYear === year && i + 1 >= d.initMonth) ){
                    switch (d.type){
                        case 0: totalExpense += d.price; break;
                        case 1: totalIncome += d.price; break;
                        case 2: totalSaving += d.price; break;
                        default:break;
                    }
                }
            })
        }
    }

    // update totaux with items and update with itemRecurrence
    data.forEach(d => {
        if(d.month === month){
            switch (d.type){
                case 0: totalExpense += d.price; break;
                case 1: totalIncome += d.price; break;
                case 2: totalSaving += d.price; break;
                default:break;
            }

            nData.push(d);
            if(d.recurrenceId){
                nRecurrencesData = nRecurrencesData.filter(r => r.id !== d.recurrenceId);
                recurrencesData.forEach(r => {
                    if(r.id === d.recurrenceId){
                        switch (r.type){
                            case 0: totalExpense -= r.price; break;
                            case 1: totalIncome -= r.price; break;
                            case 2: totalSaving -= r.price; break;
                            default:break;
                        }
                    }
                })
            }
        }

        switch (d.type){
            case 0: case 2: totauxExpense[d.month - 1] += d.price; break;
            case 1: totauxIncome[d.month - 1] += d.price; break;
            default:break;
        }

        if(d.recurrenceId){
            recurrencesData.forEach(r => {
                if(r.id === d.recurrenceId){
                    switch (r.type){
                        case 0: case 2: totauxExpense[d.month - 1] -= r.price; break;
                        case 1: totauxIncome[d.month - 1] -= r.price; break;
                        default:break;
                    }
                }
            })
        }
    })

    let totaux = [];
    for(let i = 0; i < 12 ; i++){
        let tmpDispo = (i === 0 ? parseFloat(initTotal) : 0) + totauxIncome[i] - totauxExpense[i];
        totaux.push(i <= 0 ? tmpDispo : totaux[i - 1] + tmpDispo);
    }

    let initial = month !== 1 ? totaux[month - 2] : parseFloat(initTotal);
    let totalDispo = initial + totalIncome - (totalExpense + totalSaving);

    let cards = [
        { value: 0, name: "Budget disponible",  total: totalDispo,    initial: initial, icon: "credit-card" },
        { value: 1, name: "Dépenses",           total: totalExpense,  initial: null,    icon: "minus" },
        { value: 2, name: "Revenus",            total: totalIncome,   initial: null,    icon: "add" },
        { value: 3, name: "Economies",          total: totalSaving,   initial: null,    icon: "time" },
    ]

    nData.sort(SORTER);

    return <div className="page-default">
        <div className="budget-planning">
            <Year year={year} yearMin={parseInt(yearMin)} />
            <Months year={year} active={month} onSelect={setMonth} totaux={totaux}
                    useShortName={window.matchMedia("(max-width: 768px)").matches} />
        </div>

        <div className="budget">
            <div className="col-1">
                <div className="cards">
                    {cards.map(item => {
                        return <div className={`card ${item.value === 0 ? item.total > 0 : ""}`} key={item.value}>
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
                    <BudgetFormulaire context={element ? "update" : "create"} element={element} year={year} month={month}
                                      onCancel={handleCancelEdit} onUpdateList={handleUpdateList}
                                      key={month + "-" + (element ? element.id : 0)} />
                </div>
                <div className="col-2">
                    <BudgetList data={nData} recurrencesData={nRecurrencesData}
                                onEdit={handleEdit} onModal={handleModal} onActive={handleActive}
                                onActiveRecurrence={handleActiveRecurrence} key={month} />
                </div>
            </div>
        </div>

        {createPortal(
            <Modal ref={deleteRef} identifiant="deleteItem" maxWidth={568} title="Supprimer un élément"
                 content={<p>Souhaitez-vous supprimer définitivement : <b>{elementToDelete ? elementToDelete.name : ""}</b> ?</p>}
                 footer={null}
            />
            , document.body)
        }
    </div>
}

function Year ({ year, yearMin }){
    return <div className="planning">
        {year - 1 >= yearMin
            ? <a className="planning-item" href={Routing.generate(URL_INDEX_PAGE, {'year': year - 1})}>
                <span className="icon-left-arrow" />
            </a>
            : <div className="planning-item disabled">
                <span className="icon-left-arrow" />
            </div>
        }
        <div className="planning-item active">{year}</div>
        <a className="planning-item" href={Routing.generate(URL_INDEX_PAGE, {'year': year + 1})}>
            <span className="icon-right-arrow" />
        </a>
    </div>
}

function Months ({ year, active, onSelect, useShortName, totaux }) {
    let data = [
        { id: 1, name: 'Janvier',        shortName: 'Jan.' },
        { id: 2, name: 'Février',        shortName: 'Fev.' },
        { id: 3, name: 'Mars',           shortName: 'Mar.' },
        { id: 4, name: 'Avril',          shortName: 'Avr.' },
        { id: 5, name: 'Mai',            shortName: 'Mai.' },
        { id: 6, name: 'Juin',           shortName: 'Jui.' },
        { id: 7, name: 'Juillet',        shortName: 'Jui.' },
        { id: 8, name: 'Août',           shortName: 'Aoû.' },
        { id: 9, name: 'Septembre',      shortName: 'Sep.' },
        { id: 10, name: 'Octobre',       shortName: 'Oct.' },
        { id: 11, name: 'Novembre',      shortName: 'Nov.' },
        { id: 12, name: 'Décembre',      shortName: 'Dèc.' },
    ];

    let today = new Date();

    let items = data.map(elem => {
        let activeMonth = elem.id === active ? " active" : "";
        let todayMonth = (elem.id === today.getMonth() + 1 && year === today.getFullYear()) ? " today" : "";
        let statutMonth = totaux[elem.id - 1] < 0 ? " danger" : "";
        return <div className={"planning-item" + todayMonth + activeMonth + statutMonth}
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
