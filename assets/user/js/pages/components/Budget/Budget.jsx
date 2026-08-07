import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort from "@commonFunctions/sort";
import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";

import { Modal } from "@tailwindComponents/Elements/Modal";
import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";

import { BudgetFormulaire } from "@userPages/Budget/BudgetForm";
import { BudgetList } from "@userPages/Budget/BudgetList";
import { SavingForm } from "@userPages/Budget/SavingForm";
import { cn } from "@shadcnComponents/lib/utils";

const SORTER = Sort.compareDateAtInverseThenId;

const URL_INDEX_PAGE = "user_budget_index"
const URL_PLANNING = "intern_api_budget_planning_index"
const URL_DELETE_ELEMENT = "intern_api_budget_items_delete"
const URL_ACTIVE_ELEMENT = "intern_api_budget_items_active"
const URL_CANCEL_ELEMENT = "intern_api_budget_items_cancel"
const URL_ACTIVE_RECURRENCE = "intern_api_budget_recurrences_active"
const URL_TRASH_RECURRENCE = "intern_api_budget_recurrences_trash"
const URL_USE_SAVING = "intern_api_budget_categories_use";

function Budget ({ donnees, categories, savings, recurrences, y, m, yearMin, monthlyBalances, monthlySummaries, savingsSummaries }) {
	const deleteRef = useRef(null)
	const trashRef = useRef(null)
	const savingRef = useRef(null)
	const [year, setYear] = useState(parseInt(y))
	const [month, setMonth] = useState(parseInt(m))
	const [data, setData] = useState(JSON.parse(donnees))
	const [nRecurrencesData, setNRecurrencesData] = useState(JSON.parse(recurrences))
	const [nSavings, setNSavings] = useState(JSON.parse(savings))
	const [balances, setBalances] = useState(JSON.parse(monthlyBalances))
	const [summaries, setSummaries] = useState(JSON.parse(monthlySummaries))
	const [savingsSummariesData, setSavingsSummariesData] = useState(JSON.parse(savingsSummaries))
	const [element, setElement] = useState(null)
	const [elementToDelete, setElementToDelete] = useState(null)
	const [saving, setSaving] = useState(null)
	const [load, setLoad] = useState(false)
	const [openSaving, setOpenSaving] = useState(false)

	// Every mutation below re-fetches the whole planning payload rather than patching local state:
	// the totals are computed server-side (recurrences, cancelled instances, savings balances, ...)
	// and re-deriving them client-side would just re-introduce the untested duplicate logic this
	// component used to have.
	let refetchPlanning = (targetYear) => {
		return axios({ method: "GET", url: Routing.generate(URL_PLANNING, { year: targetYear }) })
			.then(function (response) {
				let d = response.data;
				setData(d.donnees);
				setNRecurrencesData(d.recurrences);
				setNSavings(d.savings);
				setBalances(d.monthlyBalances);
				setSummaries(d.monthlySummaries);
				setSavingsSummariesData(d.savingsSummaries);
			})
		;
	}

	let handleUpdateList = () => {
		refetchPlanning(year).then(() => setElement(null));
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
				.then(function () {
					return refetchPlanning(year);
				})
				.then(function () {
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
				.then(function () {
					return refetchPlanning(year);
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
				.then(function () {
					return refetchPlanning(year);
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
				.then(function () {
					return refetchPlanning(year);
				})
				.then(function () {
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
				.then(function () {
					return refetchPlanning(year);
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
				.then(function () {
					return refetchPlanning(year);
				})
				.then(function () {
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

	let currentSummary = summaries[month - 1];

	let nData = data.filter(d => d.month === month).sort(SORTER);
	let visibleRecurrences = nRecurrencesData.filter(r => {
		let eligible = (year > r.initYear || (r.initYear === year && month >= r.initMonth)) && r.months.includes(month);
		if (!eligible) return false;

		// A real item for this month already represents this recurrence (activated or cancelled).
		return !nData.some(d => d.recurrenceId === r.id);
	});

	let itemsSavings = nSavings.map(sa => {
		let summary = savingsSummariesData.find(s => s.id === sa.id);
		let total = summary ? summary.totalByMonth[month - 1] : 0;
		let used = summary ? summary.usedByMonth[month - 1] : 0;

		return { ...sa, total, used };
	});
	let totSavingAll = itemsSavings.reduce((acc, sa) => acc + sa.total, 0);
	let totSavingAllUsed = itemsSavings.reduce((acc, sa) => acc + sa.used, 0);

	let cards = [
		{ value: 0, name: "Budget disponible", total: currentSummary.totalDispo, total2: currentSummary.totalDispoNow, initial: currentSummary.initial, icon: "cart", classCustom: 'text-green-500 bg-green-200' },
		{ value: 1, name: "Dépenses", total: currentSummary.totalExpense, total2: currentSummary.totalExpenseReal, initial: null, icon: "minus", classCustom: 'text-red-500 bg-red-100' },
		{ value: 2, name: "Revenus", total: currentSummary.totalIncome, total2: currentSummary.totalIncomeReal, initial: null, icon: "add", classCustom: 'text-blue-700 bg-blue-100' },
		{ value: 3, name: "Économies", total: currentSummary.totalSaving, total2: currentSummary.totalSavingReal, initial: null, icon: "time", classCustom: 'text-yellow-600 bg-yellow-100' },
	]

	return <div className="flex flex-col gap-6">
		<div className="flex flex-col items-center justify-center gap-4 w-full lg:mx-auto">
			<div className="px-4 sm:px-6 lg:px-8">
				<Year year={year} yearMin={parseInt(yearMin)} />
			</div>
			<div className="overflow-hidden w-screen lg:w-full lg:px-8">
				<Months year={year} active={month} onSelect={setMonth} totaux={balances} />
			</div>
		</div>

		<div className="flex flex-col gap-6 lg:px-8 2xl:grid 2xl:grid-cols-6">
			<div className="flex flex-col gap-6 2xl:flex-row 2xl:col-span-3">
				<div className="overflow-hidden w-screen lg:w-full 2xl:min-w-52 2xl:max-w-72">
					<div className="flex gap-4 overflow-auto px-4 sm:px-6 lg:px-0 2xl:flex-col">
						{cards.map(item => {
							const isNegative = item.total < 0;
							const isPositive = item.value === 0 && item.total > 0;

							return <div
								className={`relative min-w-[90%] sm:min-w-72 max-w-72 2xl:min-w-52 overflow-hidden rounded-xl border-2 transition-all ${
									item.value === 0
										? (isPositive ? "bg-gradient-to-br from-green-50 to-green-100 border-green-300" : "bg-gradient-to-br from-red-50 to-red-100 border-red-400")
										: "bg-white border-gray-200"
								}`}
								key={item.value}
							>
								<div className="p-6">
									<div className="flex items-start justify-between mb-4">
										<div className="flex-1">
											<p className="text-sm font-medium text-gray-600 mb-1">{item.name}</p>
											<p className={`text-3xl font-bold ${isNegative ? 'text-red-600' : 'text-gray-900'}`}>
												{Sanitaze.toFormatCurrency(item.total)}
											</p>
										</div>
										<div className={`w-12 h-12 rounded-lg flex items-center justify-center ${item.classCustom}`}>
											<span className={`icon-${item.icon} text-2xl`}></span>
										</div>
									</div>

									{item.total2 !== 0 && (
										<div className="mb-2">
											<div className="flex items-center justify-between text-sm">
												<span className="text-gray-600">Aujourd'hui :</span>
												<span className="font-semibold text-gray-900">{Sanitaze.toFormatCurrency(item.total2)}</span>
											</div>
										</div>
									)}

									{item.initial !== null && (
										<div className="flex items-center justify-between text-sm border-t border-gray-200 pt-2 mt-2">
											<span className="text-gray-600">Solde initial :</span>
											<span className="font-medium text-gray-700">{Sanitaze.toFormatCurrency(item.initial)}</span>
										</div>
									)}
								</div>
							</div>
						})}
					</div>
				</div>

				<div className="w-full flex flex-col gap-6 px-4 sm:px-6 lg:px-0">
					<div className="bg-white border rounded-xl shadow-md p-4">
						<BudgetFormulaire context={element ? "update" : "create"}
										  categories={JSON.parse(categories)}
										  element={element} year={year} month={month}
										  onCancel={handleCancelEdit} onUpdateList={handleUpdateList}
										  key={month + "-" + (element ? element.id : 0)} />
					</div>
					{itemsSavings.length !== 0 && <div className="bg-gray-50 rounded-xl border">
						<div className="cursor-pointer p-4 flex justify-between hover:opacity-80" onClick={() => setOpenSaving(!openSaving)}>
							<h3 className="font-semibold">Utilisation des économies</h3>
							<div className="lg:hidden">
								<span className={`icon-${openSaving ? "minus" : "add"}`}></span>
							</div>
						</div>
						<div className={`flex flex-col gap-4 border-t bg-white rounded-b-md ${openSaving ? "opacity-100 h-auto p-4" : "h-0 opacity-0 lg:h-auto lg:opacity-100 lg:p-4"}`}>
							{itemsSavings.map(sa => {
								let total = sa.total;
								let used = sa.used;
								let available = total - used;
								let progress = sa.goal ? (available / sa.goal) * 100 : 0;

								return <div className="saving-item flex items-start justify-between gap-2" key={sa.id}>
									<div className="col-1 font-medium text-sm">
										<div className="flex justify-between items-center">
											<div>{sa.name}</div>
											<div className="text-xs font-normal text-gray-500">({progress.toFixed(0)}%)</div>
										</div>
										<div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
											<div
												className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all"
												style={{ width: `${Math.min(progress, 100)}%` }}
											></div>
										</div>
									</div>
									<div className="col-2">
										<div className="font-medium text-sm">{Sanitaze.toFormatCurrency(total - used)} / {Sanitaze.toFormatCurrency(sa.goal)}</div>
										<div className="text-xs text-gray-600">Utilisée : {Sanitaze.toFormatCurrency(used)}</div>
									</div>
									<div className="col-3">
										<ButtonIcon type="default" icon="credit-card" onClick={() => handleModal('savingRef', sa)}>Utiliser</ButtonIcon>
									</div>
								</div>
							})}
						</div>

						<div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 rounded-b-xl overflow-hidden border-t flex items-center justify-between">
							<span className="text-sm font-medium text-gray-700">Total économies disponibles</span>
							<div className="text-right">
								<div className="font-bold text-lg text-yellow-700">{Sanitaze.toFormatCurrency(totSavingAll - totSavingAllUsed)}</div>
								<div className="text-xs text-gray-600">{Sanitaze.toFormatCurrency(totSavingAllUsed)} utilisé</div>
							</div>
						</div>
					</div>}
				</div>
			</div>
			<div className="flex flex-col gap-6 px-4 sm:px-6 lg:px-0 2xl:col-span-3">
				<div className="bg-white border rounded-xl shadow-md overflow-hidden">
					<div className="p-4 bg-gray-50 border-b">
						<h3 className="font-semibold text-gray-900 flex items-center gap-2">
							<span className="icon-cart text-blue-600"></span>
							Opérations du mois
							<span className="text-sm font-normal text-gray-600">({nData.length + visibleRecurrences.length})</span>
						</h3>
					</div>
					<div className="flex flex-col gap-6">
						<BudgetList data={nData} recurrencesData={visibleRecurrences}
									onEdit={handleEdit} onModal={handleModal} onActive={handleActive} onCancel={handleCancelTrash}
									onActiveRecurrence={handleActiveRecurrence} key={month} />
					</div>
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
				   content={<SavingForm identifiant="useSaving" saving={saving} onUseSaving={handleUseSaving} />}
				   footer={null}
			/>
			, document.body)
		}
	</div>
}

export default Budget

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

	return <div className="flex items-center gap-4 overflow-auto border-y py-4 px-4 sm:px-6 lg:px-0 lg:flex-wrap lg:justify-center">
		{data.map(elem => {
			let todayMonth = (elem.id === today.getMonth() + 1 && year === today.getFullYear());
			let activeMonth = elem.id === active;
			let statutMonth = totaux[elem.id - 1] < 0;
			return <div onClick={() => onSelect(elem.id)} key={elem.id}
						className={cn(
				"cursor-pointer rounded-md p-2 font-medium text-center min-w-20",
				todayMonth ? "bg-white border-2 border-gray-300 shadow-md" : "hover:bg-gray-50",
				activeMonth ? (statutMonth ? "bg-red-500 text-white border-2 border-red-600 shadow-lg scale-105 hover:bg-red-500" : "bg-blue-500 text-white border-2 border-blue-600 shadow-lg scale-105 hover:bg-blue-500") : ""
			)}>
				<div className="text-sm">
					{elem.name}
				</div>
				<div className={`text-xs font-medium ${activeMonth ? '' : (statutMonth ? 'text-red-600' : 'text-gray-600')}`}>
					{Sanitaze.toFormatCurrency(totaux[elem.id - 1])}
				</div>
			</div>
		})}
	</div>
}
