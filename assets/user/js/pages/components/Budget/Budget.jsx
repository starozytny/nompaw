import React, { useState } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sort from "@commonFunctions/sort";
import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";

import { Button } from "@tailwindComponents/Elements/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@shadcnComponents/ui/card";
import { Progress } from "@shadcnComponents/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";
import { cn } from "@shadcnComponents/lib/utils";

import { BudgetFormulaire } from "@userPages/Budget/BudgetForm";
import { BudgetList } from "@userPages/Budget/BudgetList";
import { SavingForm } from "@userPages/Budget/SavingForm";
import { BudgetTrendChart } from "@userPages/Budget/BudgetTrendChart";
import { RecurrencesTab } from "@userPages/Budget/Reccurences/RecurrencesTab";
import { CategoriesTab } from "@userPages/Budget/Categories/CategoriesTab";

const SORTER = Sort.compareDateAtInverseThenId;

const URL_INDEX_PAGE = "user_budget_index"
const URL_PLANNING = "intern_api_budget_planning_index"
const URL_DELETE_ELEMENT = "intern_api_budget_items_delete"
const URL_ACTIVE_ELEMENT = "intern_api_budget_items_active"
const URL_CANCEL_ELEMENT = "intern_api_budget_items_cancel"
const URL_ACTIVE_RECURRENCE = "intern_api_budget_recurrences_active"
const URL_TRASH_RECURRENCE = "intern_api_budget_recurrences_trash"
const URL_USE_SAVING = "intern_api_budget_categories_use";

const MONTHS_SHORT = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const TODAY = new Date();

export default function Budget (props) {
	const [activeTab, setActiveTab] = useState('planning');

	return <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-1">
		<TabsList className="self-start">
			<TabsTrigger value="planning">Planning</TabsTrigger>
			<TabsTrigger value="recurrences">Récurrences</TabsTrigger>
			<TabsTrigger value="categories">Catégories</TabsTrigger>
		</TabsList>

		<TabsContent value="planning" forceMount className={activeTab === 'planning' ? '' : 'hidden'}>
			<PlanningTab {...props} />
		</TabsContent>
		<TabsContent value="recurrences">
			<RecurrencesTab />
		</TabsContent>
		<TabsContent value="categories">
			<CategoriesTab />
		</TabsContent>
	</Tabs>
}

function PlanningTab ({ donnees, categories, savings, recurrences, y, m, yearMin, monthlyBalances, monthlySummaries, savingsSummaries }) {
	const [year, setYear] = useState(parseInt(y))
	const [month, setMonth] = useState(parseInt(m))
	const [data, setData] = useState(JSON.parse(donnees))
	const [nRecurrencesData, setNRecurrencesData] = useState(JSON.parse(recurrences))
	const [nSavings, setNSavings] = useState(JSON.parse(savings))
	const [balances, setBalances] = useState(JSON.parse(monthlyBalances))
	const [summaries, setSummaries] = useState(JSON.parse(monthlySummaries))
	const [savingsSummariesData, setSavingsSummariesData] = useState(JSON.parse(savingsSummaries))
	const [element, setElement] = useState(null)
	const [sheetOpen, setSheetOpen] = useState(false)
	const [elementToDelete, setElementToDelete] = useState(null)
	const [deleteOpen, setDeleteOpen] = useState(false)
	const [trashOpen, setTrashOpen] = useState(false)
	const [saving, setSaving] = useState(null)
	const [savingOpen, setSavingOpen] = useState(false)
	const [load, setLoad] = useState(false)

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

	let handleOpenCreate = () => {
		setElement(null);
		setSheetOpen(true);
	}

	let handleEdit = (elem) => {
		setElement(elem);
		setSheetOpen(true);
	}

	let handleSheetOpenChange = (open) => {
		setSheetOpen(open);
		if (!open) setElement(null);
	}

	let handleModal = (identifiant, elem) => {
		setElementToDelete(elem);
		if (identifiant === 'deleteRef') setDeleteOpen(true);
		if (identifiant === 'trashRef') setTrashOpen(true);
		if (identifiant === 'savingRef') { setSaving(elem); setSavingOpen(true); }
	}

	let handleDelete = () => {
		if (!load && elementToDelete) {
			setLoad(true)

			axios({ method: "DELETE", url: Routing.generate(URL_DELETE_ELEMENT, { id: elementToDelete.id }), data: {} })
				.then(function () {
					return refetchPlanning(year);
				})
				.then(function () {
					setElementToDelete(null);
					setDeleteOpen(false);
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

	let handleDeleteRecurrence = () => {
		if (!load && elementToDelete) {
			setLoad(true)

			axios({ method: "DELETE", url: Routing.generate(URL_TRASH_RECURRENCE, { id: elementToDelete.id }), data: { year: year, month: month } })
				.then(function () {
					return refetchPlanning(year);
				})
				.then(function () {
					setElementToDelete(null);
					setTrashOpen(false);
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

			axios({ method: "PUT", url: Routing.generate(URL_USE_SAVING, { id: sa.id }), data: { year: year, month: month, total: total } })
				.then(function () {
					return refetchPlanning(year);
				})
				.then(function () {
					setSaving(null);
					setSavingOpen(false);
				})
				.catch(function (error) {
					Formulaire.displayErrors(null, error);
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
		{ value: 0, name: "Budget disponible", total: currentSummary.totalDispo, total2: currentSummary.totalDispoNow, initial: currentSummary.initial, icon: "cart", status: true },
		{ value: 1, name: "Dépenses", total: currentSummary.totalExpense, total2: currentSummary.totalExpenseReal, icon: "minus", cat: "expense" },
		{ value: 2, name: "Revenus", total: currentSummary.totalIncome, total2: currentSummary.totalIncomeReal, icon: "add", cat: "income" },
		{ value: 3, name: "Économies", total: currentSummary.totalSaving, total2: currentSummary.totalSavingReal, icon: "time", cat: "saving" },
	]

	const CAT_TYPE_COLOR = ['var(--cat-expense)', 'var(--cat-income)', 'var(--cat-saving)'];
	let categoryBreakdown = (() => {
		let byCategory = new Map();
		nData.forEach(elem => {
			if (elem.type === 3 || elem.type === 4) return;
			let key = elem.category ? elem.category.id : 'none';
			let row = byCategory.get(key);
			if (!row) {
				row = {
					key,
					name: elem.category ? elem.category.name : 'Sans catégorie',
					color: elem.category ? CAT_TYPE_COLOR[elem.category.type] : 'hsl(var(--muted-foreground))',
					total: 0,
				};
				byCategory.set(key, row);
			}
			row.total += elem.price;
		});

		let rows = Array.from(byCategory.values()).sort((a, b) => b.total - a.total).slice(0, 6);
		let max = rows.length ? rows[0].total : 1;
		return rows.map(r => ({ ...r, pct: max ? Math.max((r.total / max) * 100, 3) : 0 }));
	})();

	return <div className="flex flex-col gap-5">
		<div className="flex flex-wrap items-end justify-between gap-3">
			<div className="text-sm text-muted-foreground">Année {year}</div>
			<div className="flex items-center gap-1 rounded-lg bg-muted p-1">
				{year - 1 >= yearMin
					? <a className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-card" href={Routing.generate(URL_INDEX_PAGE, { year: year - 1 })}>
						<span className="icon-left-arrow text-sm" />
					</a>
					: <div className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground/40">
						<span className="icon-left-arrow text-sm" />
					</div>
				}
				<span className="px-2 text-sm font-semibold tabular-nums">{year}</span>
				<a className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-card" href={Routing.generate(URL_INDEX_PAGE, { year: year + 1 })}>
					<span className="icon-right-arrow text-sm" />
				</a>
			</div>
		</div>

		<div className="grid grid-cols-12 gap-1.5 overflow-x-auto pb-1">
			{MONTHS_SHORT.map((label, i) => {
				const isActive = i + 1 === month;
				const isToday = year === TODAY.getFullYear() && i + 1 === TODAY.getMonth() + 1;
				const isNeg = balances[i] < 0;
				return <button key={i} type="button" onClick={() => setMonth(i + 1)}
					title={isToday ? "Mois actuel" : undefined}
					className={cn(
						"col-span-1 min-w-[58px] flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-center transition-colors",
						isActive ? "border-foreground bg-foreground text-background" : "bg-gray-50 hover:bg-whiter hover:border-foreground/30",
						isToday && !isActive && "ring-1 ring-inset ring-foreground/35"
					)}
				>
					<span className={cn("flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide", isActive ? "text-background/70" : "text-muted-foreground")}>
						{label}
						{isToday && <span className={cn("h-1 w-1 rounded-full", isActive ? "bg-background/70" : "bg-foreground/60")} />}
					</span>
					<span className={cn("text-xs font-semibold tabular-nums", isActive ? (isNeg ? "text-red-300" : "text-background") : (isNeg ? "text-[var(--status-critical)]" : ""))}>
						{Sanitaze.toFormatCurrency(balances[i], true)}
					</span>
				</button>
			})}
		</div>

		<div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
			<div className="xl:col-span-5 flex flex-col gap-5">
				<Card>
					<CardContent className="p-4">
						<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Solde disponible · tendance sur l'année</div>
						<BudgetTrendChart balances={balances} activeMonth={month} onSelectMonth={setMonth} />
					</CardContent>
				</Card>

				<div className="grid grid-cols-2 gap-3">
					{cards.map(card => {
						const isNeg = card.total < 0;
						const catColor = card.cat ? `var(--cat-${card.cat})` : null;
						const catSoft = card.cat ? `var(--cat-${card.cat}-soft)` : null;
						return <Card
							key={card.value}
							className={cn(card.value === 0 && "col-span-2", card.status && (isNeg ? "border-[var(--status-critical)]" : ""))}
							style={card.status && isNeg ? { background: 'var(--status-critical-soft)' } : undefined}
						>
							<CardContent className="p-4 flex flex-col gap-2">
								<div className="flex items-start justify-between gap-2">
									<div>
										<div className="text-xs text-muted-foreground">{card.name}</div>
										<div className={cn("font-bold tabular-nums", card.value === 0 ? "text-2xl" : "text-lg", card.status && isNeg && "text-[var(--status-critical)]")}>
											{Sanitaze.toFormatCurrency(card.total)}
										</div>
									</div>
									<div
										className="flex h-7 w-7 flex-none items-center justify-center rounded-lg"
										style={{
											background: card.status ? (isNeg ? 'var(--status-critical)' : 'var(--status-good-soft)') : catSoft,
											color: card.status ? (isNeg ? '#fff' : 'var(--status-good)') : catColor,
										}}
									>
										<span className={`icon-${card.icon} text-sm`}></span>
									</div>
								</div>
								{card.total2 !== 0 && (
									<div className="flex items-center justify-between text-xs">
										<span className="text-muted-foreground">Aujourd'hui</span>
										<span className="font-semibold tabular-nums">{Sanitaze.toFormatCurrency(card.total2)}</span>
									</div>
								)}
								{card.initial !== undefined && (
									<div className="flex items-center justify-between border-t pt-2 text-xs">
										<span className="text-muted-foreground">Solde initial</span>
										<span className="font-medium tabular-nums">{Sanitaze.toFormatCurrency(card.initial)}</span>
									</div>
								)}
							</CardContent>
						</Card>
					})}
				</div>

				{categoryBreakdown.length !== 0 && <Card>
					<CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b p-4">
						<CardTitle className="text-sm">Répartition par catégorie</CardTitle>
						<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{categoryBreakdown.length} catégorie{categoryBreakdown.length > 1 ? "s" : ""}</span>
					</CardHeader>
					<CardContent className="flex flex-col gap-3 p-4">
						{categoryBreakdown.map(row => (
							<div key={row.key} className="flex flex-col gap-1">
								<div className="flex items-center justify-between gap-2">
									<span className="flex items-center gap-1.5 text-xs font-medium">
										<span className="h-2 w-2 flex-none rounded-full" style={{ background: row.color }} />
										{row.name}
									</span>
									<span className="text-xs font-semibold tabular-nums">{Sanitaze.toFormatCurrency(row.total)}</span>
								</div>
								<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
									<div className="h-full rounded-full transition-all" style={{ width: `${row.pct}%`, background: row.color }} />
								</div>
							</div>
						))}
					</CardContent>
				</Card>}

				{itemsSavings.length !== 0 && <Card>
					<CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b p-4">
						<CardTitle className="text-sm">Utilisation des économies</CardTitle>
						<span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{itemsSavings.length} catégorie{itemsSavings.length > 1 ? "s" : ""}</span>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 pt-4">
						{itemsSavings.map(sa => {
							let available = sa.total - sa.used;
							let progress = sa.goal ? (available / sa.goal) * 100 : 0;
							return <div key={sa.id} className="flex flex-col gap-1.5">
								<div className="flex items-baseline justify-between gap-2">
									<span className="text-sm font-medium">{sa.name}</span>
									<span className="text-xs text-muted-foreground">{progress.toFixed(0)}%</span>
								</div>
								<Progress value={progress} indicatorStyle={{ background: 'var(--cat-saving-gradient)' }} />
								<div className="flex items-center justify-between text-xs text-muted-foreground">
									<span>Disponible <b className="text-foreground tabular-nums">{Sanitaze.toFormatCurrency(available)}</b></span>
									<div className="flex items-center gap-2">
										<span>Objectif {Sanitaze.toFormatCurrency(sa.goal)}</span>
										<button type="button" className="text-xs font-semibold text-[var(--cat-saving)] hover:underline" onClick={() => handleModal('savingRef', sa)}>Utiliser</button>
									</div>
								</div>
							</div>
						})}
						<div className="flex items-center justify-between border-t pt-3">
							<span className="text-xs text-muted-foreground">Total économies disponibles</span>
							<span className="font-bold tabular-nums">{Sanitaze.toFormatCurrency(totSavingAll - totSavingAllUsed)}</span>
						</div>
					</CardContent>
				</Card>}
			</div>

			<div className="xl:col-span-7">
				<Card className="overflow-hidden">
					<CardHeader className="flex-row items-center justify-between gap-3 space-y-0 border-b p-4">
						<CardTitle className="text-sm">
							Opérations du mois <span className="font-normal text-muted-foreground">({nData.length + visibleRecurrences.length})</span>
						</CardTitle>
						<Button type="blue" onClick={handleOpenCreate}>
							<span className="icon-add mr-1"></span>Ajouter
						</Button>
					</CardHeader>
					<CardContent className="p-0">
						<BudgetList data={nData} recurrencesData={visibleRecurrences}
									onEdit={handleEdit} onModal={handleModal} onActive={handleActive} onCancel={handleCancelTrash}
									onActiveRecurrence={handleActiveRecurrence} />
					</CardContent>
				</Card>
			</div>
		</div>

		<BudgetFormulaire context={element ? "update" : "create"}
						  categories={JSON.parse(categories)}
						  element={element} year={year} month={month}
						  open={sheetOpen} onOpenChange={handleSheetOpenChange}
						  onUpdateList={handleUpdateList} />

		<SavingForm open={savingOpen} onOpenChange={setSavingOpen} saving={saving} onUseSaving={handleUseSaving} />

		<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Supprimer un élément</DialogTitle>
					<DialogDescription>
						Souhaitez-vous supprimer définitivement <b>{elementToDelete ? elementToDelete.name : ""}</b> ?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="default" onClick={() => setDeleteOpen(false)}>Annuler</Button>
					<Button type="red" onClick={handleDelete} iconLeft={load ? "chart-3" : ""}>Confirmer la suppression</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<Dialog open={trashOpen} onOpenChange={setTrashOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Supprimer un élément récurrent</DialogTitle>
					<DialogDescription>
						Souhaitez-vous supprimer cet élément récurrent <b>{elementToDelete ? elementToDelete.name : ""}</b> pour ce mois ?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="default" onClick={() => setTrashOpen(false)}>Annuler</Button>
					<Button type="red" onClick={handleDeleteRecurrence} iconLeft={load ? "chart-3" : ""}>Confirmer la suppression</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
}
