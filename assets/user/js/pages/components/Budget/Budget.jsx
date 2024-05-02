import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import List from "@commonFunctions/list";
import Sort from "@commonFunctions/sort";
import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

import { BudgetFormulaire } from "@userPages/Budget/BudgetForm";
import { BudgetList } from "@userPages/Budget/BudgetList";
import { SavingForm } from "@userPages/Budget/SavingForm";

const SORTER = Sort.compareDateAtInverseThenId;

const URL_INDEX_PAGE = "user_budget_index"
const URL_DELETE_ELEMENT = "intern_api_budget_items_delete"
const URL_ACTIVE_ELEMENT = "intern_api_budget_items_active"
const URL_CANCEL_ELEMENT = "intern_api_budget_items_cancel"
const URL_ACTIVE_RECURRENCE = "intern_api_budget_recurrences_active"
const URL_TRASH_RECURRENCE = "intern_api_budget_recurrences_trash"
const URL_USE_SAVING = "intern_api_budget_categories_use";

export function Budget ({ donnees, categories, savings, savingsItems, savingsUsed, y, m, yearMin, initTotal, recurrences }) {
	const deleteRef = useRef(null)
	const trashRef = useRef(null)
	const savingRef = useRef(null)
	const [year, setYear] = useState(parseInt(y))
	const [month, setMonth] = useState(parseInt(m))
	const [data, setData] = useState(JSON.parse(donnees))
	const [nSavingsItems, setNSavingsItems] = useState(JSON.parse(savingsItems))
	const [nSavingsUsed, setNSavingsUsed] = useState(JSON.parse(savingsUsed))
	const [element, setElement] = useState(null)
	const [elementToDelete, setElementToDelete] = useState(null)
	const [saving, setSaving] = useState(null)
	const [load, setLoad] = useState(false)

	let handleUpdateList = (elem, context) => {
		setData(List.updateDataMuta(elem, context, data, SORTER));
		if (elem.type === 2) { // saving type
			setNSavingsItems(List.updateDataMuta(elem, context, nSavingsItems));
		}
		setElement(null);
	}

	let handleCancelEdit = () => {
		setElement(null)
	}

	let handleEdit = (elem) => {
		setElement(elem);
	}

	let handleModal = (identifiant, elem) => {
		let ref;
		switch (identifiant) {
			case 'deleteRef':
				ref = deleteRef;
				setElementToDelete(elem);
				deleteRef.current.handleUpdateFooter(<Button type="red" onClick={() => handleDelete(elem)}>Confirmer la suppression</Button>)
				break;
			case 'trashRef':
				ref = trashRef;
				setElementToDelete(elem);
				trashRef.current.handleUpdateFooter(<Button type="red" onClick={() => handleDeleteRecurrence(elem)}>Confirmer la suppression</Button>)
				break;
			case 'savingRef':
				ref = savingRef;
				setSaving(elem);
				break;
			default:
				break;
		}
		if (ref) {
			ref.current.handleClick();
		}
	}

	let handleDelete = (elem) => {
		if (!load) {
			setLoad(true)
			deleteRef.current.handleUpdateFooter(<Button type="red" iconLeft="chart-3">Confirmer la suppression</Button>)

			axios({ method: "DELETE", url: Routing.generate(URL_DELETE_ELEMENT, { id: elem.id }), data: {} })
				.then(function (response) {
					if (elem.recurrenceId) {
						handleUpdateList(response.data, "update")
					} else {
						handleUpdateList(elem, "delete")
						setNSavingsUsed(List.updateDataMuta(elem, "delete", nSavingsUsed));
					}

					setElementToDelete(null);
					deleteRef.current.handleClose();
				})
				.catch(function (error) {
					Formulaire.displayErrors(null, error);
				})
				.then(function () {
					setLoad(false)
				})
			;
		}
	}

	let handleActive = (elem) => {
		if (!load) {
			setLoad(true)

			axios({ method: "PUT", url: Routing.generate(URL_ACTIVE_ELEMENT, { id: elem.id }), data: {} })
				.then(function (response) {
					handleUpdateList(response.data, "update")
				})
				.catch(function (error) {
					Formulaire.displayErrors(null, error);
				})
				.then(function () {
					setLoad(false)
				})
			;
		}
	}

	let handleActiveRecurrence = (elem) => {
		if (!load) {
			setLoad(true)

			axios({ method: "PUT", url: Routing.generate(URL_ACTIVE_RECURRENCE, { id: elem.id }), data: { year: year, month: month } })
				.then(function (response) {
					handleUpdateList(response.data, "create")
				})
				.catch(function (error) {
					Formulaire.displayErrors(null, error);
				})
				.then(function () {
					setLoad(false)
				})
			;
		}
	}

	let handleDeleteRecurrence = (elem) => {
		if (!load) {
			setLoad(true)
			trashRef.current.handleUpdateFooter(<Button type="red" iconLeft="chart-3">Confirmer la suppression</Button>)

			axios({ method: "DELETE", url: Routing.generate(URL_TRASH_RECURRENCE, { id: elem.id }), data: { year: year, month: month } })
				.then(function (response) {
					handleUpdateList(response.data, "create")
					setElementToDelete(null);
					trashRef.current.handleClose();
				})
				.catch(function (error) {
					Formulaire.displayErrors(null, error);
				})
				.then(function () {
					setLoad(false)
				})
			;
		}
	}

	let handleCancelTrash = (elem) => {
		if (!load) {
			setLoad(true)

			axios({ method: "PUT", url: Routing.generate(URL_CANCEL_ELEMENT, { id: elem.id }), data: {} })
				.then(function (response) {
					handleUpdateList(response.data, "update")
				})
				.catch(function (error) {
					Formulaire.displayErrors(null, error);
				})
				.then(function () {
					setLoad(false)
				})
			;
		}
	}

	let handleUseSaving = (sa, total) => {
		if (!load) {
			setLoad(true)
			Formulaire.loader(true)

			let self = this;
			axios({ method: "PUT", url: Routing.generate(URL_USE_SAVING, { id: sa.id }), data: { year: year, month: month, total: total } })
				.then(function (response) {
					handleUpdateList(response.data, "create")
					setNSavingsUsed(List.updateDataMuta(response.data, "create", nSavingsUsed));
					setSaving(null);
					savingRef.current.handleClose();
				})
				.catch(function (error) {
					Formulaire.displayErrors(self, error);
				})
				.then(function () {
					setLoad(false);
					Formulaire.loader(false);
				})
			;
		}
	}

	let recurrencesData = JSON.parse(recurrences);
	let nSavings = JSON.parse(savings);
	let totauxExpense = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
	let totauxIncome = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

	let totalExpense = 0, totalIncome = 0, totalSaving = 0;
	let nData = [], nRecurrencesData = [];

	// set totaux with recurrences
	for (let i = 0 ; i < 12 ; i++) {
		recurrencesData.forEach(d => {
			if (year > d.initYear || (d.initYear === year && i + 1 >= d.initMonth)) {
				if (d.months.includes(i + 1)) {
					switch (d.type) {
						case 0:
						case 2:
							totauxExpense[i] += d.price;
							break;
						case 1:
							totauxIncome[i] += d.price;
							break;
						default:
							break;
					}
				}
			}
		})

		if (i + 1 === month) {
			recurrencesData.forEach(d => {
				if (year > d.initYear || (d.initYear === year && i + 1 >= d.initMonth)) {
					if (d.months.includes(i + 1)) {
						switch (d.type) {
							case 0:
								totalExpense += d.price;
								break;
							case 1:
								totalIncome += d.price;
								break;
							case 2:
								totalSaving += d.price;
								break;
							default:
								break;
						}
					}
				}
			})
		}
	}

	// add only recurrences eligible
	recurrencesData.forEach(r => {
		if (year > r.initYear || (r.initYear === year && month >= r.initMonth)) {
			if (r.months.includes(month)) {
				nRecurrencesData.push(r);
			}
		}
	})

	// update totaux with items and update with itemRecurrence
	data.forEach(d => {
		if (d.month === month) {
			switch (d.type) {
				case 0:
					totalExpense += d.price;
					break;
				case 1:
					totalIncome += d.price;
					break;
				case 2:
					totalSaving += d.price;
					break;
				default:
					break;
			}

			nData.push(d);
			if (d.recurrenceId) {
				nRecurrencesData = nRecurrencesData.filter(r => r.id !== d.recurrenceId);
				switch (d.type) {
					case 0:
						totalExpense -= d.recurrencePrice;
						break;
					case 1:
						totalIncome -= d.recurrencePrice;
						break;
					case 2:
						totalSaving -= d.recurrencePrice;
						break;
					default:
						break;
				}
			}
		}

		switch (d.type) {
			case 0:
			case 2:
				totauxExpense[d.month - 1] += d.price;
				break;
			case 1:
				totauxIncome[d.month - 1] += d.price;
				break;
			default:
				break;
		}

		if (d.recurrenceId) {
			switch (d.type) {
				case 0:
				case 2:
					totauxExpense[d.month - 1] -= d.recurrencePrice;
					break;
				case 1:
					totauxIncome[d.month - 1] -= d.recurrencePrice;
					break;
				default:
					break;
			}
		}
	})

	let totaux = [];
	for (let i = 0 ; i < 12 ; i++) {
		let tmpDispo = (i === 0 ? parseFloat(initTotal) : 0) + totauxIncome[i] - totauxExpense[i];
		totaux.push(i <= 0 ? tmpDispo : totaux[i - 1] + tmpDispo);
	}

	let initial = month !== 1 ? totaux[month - 2] : parseFloat(initTotal);
	let totalDispo = initial + totalIncome - (totalExpense + totalSaving);

	let cards = [
		{ value: 0, name: "Budget disponible", total: totalDispo, initial: initial, icon: "cart" },
		{ value: 1, name: "Dépenses", total: totalExpense, initial: null, icon: "minus" },
		{ value: 2, name: "Revenus", total: totalIncome, initial: null, icon: "add" },
		{ value: 3, name: "Économies", total: totalSaving, initial: null, icon: "time" },
	]

	nData.sort(SORTER);

	return <div className="page-default">
		<div className="flex flex-col items-center justify-center gap-4 lg:w-[calc(100%-14rem)] lg:mx-auto">
			<div>
				<Year year={year} yearMin={parseInt(yearMin)} />
			</div>
			<div>
				<Months year={year} active={month} onSelect={setMonth} totaux={totaux} />
			</div>
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
					<BudgetFormulaire context={element ? "update" : "create"} categories={JSON.parse(categories)}
									  element={element} year={year} month={month}
									  onCancel={handleCancelEdit} onUpdateList={handleUpdateList}
									  key={month + "-" + (element ? element.id : 0)} />
					{nSavings.length !== 0 && <div className="savings">
						<h3>Utilisation des économies</h3>
						<div className="savings-list">
							{nSavings.map(sa => {

								let total = 0, used = 0;
								nSavingsItems.forEach(s => {
									if (s.category && s.category.id === sa.id) {
										if (s.year <= year) {
											if (s.year < year || (s.year === year && s.month <= month)) {
												total += s.price;
											}
										}
									}
								})
								nSavingsUsed.forEach(s => {
									if (s.category && s.category.id === sa.id) {
										if (s.year <= year) {
											if (s.year < year || (s.year === year && s.month <= month)) {
												used += s.price;
											}
										}
									}
								})

								return <div className="savings-item" key={sa.id}>
									<div className="name">{sa.name}</div>
									<div className="total">
										<div className="goal">{Sanitaze.toFormatCurrency(total - used)} / {Sanitaze.toFormatCurrency(sa.goal)}</div>
										<div className="sub">Utilisée : {Sanitaze.toFormatCurrency(used)}</div>
									</div>
									<div className="actions">
										<ButtonIcon type="default" icon="credit-card" onClick={() => handleModal('savingRef', sa)}>Utiliser</ButtonIcon>
									</div>
								</div>
							})}
						</div>
					</div>}
				</div>
				<div className="col-2">
					<BudgetList data={nData} recurrencesData={nRecurrencesData}
								onEdit={handleEdit} onModal={handleModal} onActive={handleActive} onCancel={handleCancelTrash}
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

		{createPortal(
			<Modal ref={trashRef} identifiant="trashRecurrence" maxWidth={568} title="Supprimer un élément"
				   content={<p>Souhaitez-vous supprimer cet élément récurrent : <b>{elementToDelete ? elementToDelete.name : ""}</b> ?</p>}
				   footer={null}
			/>
			, document.body)
		}

		{createPortal(
			<Modal ref={savingRef} identifiant="useSaving" maxWidth={568} title="Utiliser vos économies" isForm={true}
				   content={<SavingForm saving={saving} onUseSaving={handleUseSaving} />}
				   footer={null}
			/>
			, document.body)
		}
	</div>
}

function Year ({ year, yearMin }) {
	return <div className="flex items-center gap-4">
		{year - 1 >= yearMin
			? <a className="cursor-pointer flex items-center justify-center rounded-md text-lg px-2 py-2 shadow-sm bg-white text-gray-900 hover:bg-gray-50 ring-1 ring-inset ring-gray-300"
				 href={Routing.generate(URL_INDEX_PAGE, { year: year - 1 })}>
				<span className="icon-left-arrow" />
			</a>
			: <div className="cursor-not-allowed flex items-center justify-center rounded-md text-lg px-2 py-2 shadow-sm bg-gray-100 text-gray-400 hover:bg-gray-50 ring-1 ring-inset ring-gray-300">
				<span className="icon-left-arrow" />
			</div>
		}
		<div className="p-2 font-medium text-lg text-blue-600">{year}</div>
		<a className="cursor-pointer flex items-center justify-center rounded-md text-lg px-2 py-2 shadow-sm bg-white text-gray-900 hover:bg-gray-50 ring-1 ring-inset ring-gray-300"
		   href={Routing.generate(URL_INDEX_PAGE, { year: year + 1 })}>
			<span className="icon-right-arrow" />
		</a>
	</div>
}

function Months ({ year, active, onSelect, totaux }) {
	let data = [
		{ id: 1, name: 'Janvier', shortName: 'Jan.' },
		{ id: 2, name: 'Février', shortName: 'Fev.' },
		{ id: 3, name: 'Mars', shortName: 'Mar.' },
		{ id: 4, name: 'Avril', shortName: 'Avr.' },
		{ id: 5, name: 'Mai', shortName: 'Mai.' },
		{ id: 6, name: 'Juin', shortName: 'Jui.' },
		{ id: 7, name: 'Juillet', shortName: 'Jui.' },
		{ id: 8, name: 'Août', shortName: 'Aoû.' },
		{ id: 9, name: 'Septembre', shortName: 'Sep.' },
		{ id: 10, name: 'Octobre', shortName: 'Oct.' },
		{ id: 11, name: 'Novembre', shortName: 'Nov.' },
		{ id: 12, name: 'Décembre', shortName: 'Dèc.' },
	];

	let today = new Date();

	return <div className="flex items-center gap-4 overflow-auto border-y py-4 lg:flex-wrap lg:justify-center">
		{data.map(elem => {
			let todayMonth = (elem.id === today.getMonth() + 1 && year === today.getFullYear());
			let activeMonth = elem.id === active;
			let statutMonth = totaux[elem.id - 1] < 0;
			return <div className={`cursor-pointer rounded-md p-2 font-medium text-center 2xl:min-w-20 ${todayMonth ? "bg-white" : "hover:bg-gray-50"} ${activeMonth ? (statutMonth ? "!bg-red-300" : "!bg-blue-300") : ""}`}
						onClick={() => onSelect(elem.id)}
						key={elem.id}>
				<div className="text-sm">
					<span className="xl:hidden">{elem.shortName}</span>
					<span className="hidden xl:inline-block">{elem.name}</span>
				</div>
				<div className="text-xs text-gray-600">{Sanitaze.toFormatCurrency(totaux[elem.id - 1])}</div>
			</div>
		})}
	</div>
}
