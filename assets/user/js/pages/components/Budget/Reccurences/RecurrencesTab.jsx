import React, { useEffect, useState } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Search } from "@tailwindComponents/Elements/Search";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Card, CardHeader, CardTitle, CardContent } from "@shadcnComponents/ui/card";
import { Badge } from "@shadcnComponents/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";

import { RecurrentFormulaire } from "@userPages/Budget/Reccurences/RecurrentForm";

const TYPE_COLOR = ['var(--cat-expense)', 'var(--cat-income)', 'var(--cat-saving)'];
const TYPE_SOFT = ['var(--cat-expense-soft)', 'var(--cat-income-soft)', 'var(--cat-saving-soft)'];
const URL_LIST = "intern_api_budget_recurrences_list";
const URL_DELETE = "intern_api_budget_recurrences_delete";

export function RecurrencesTab () {
	const [loading, setLoading] = useState(true);
	const [items, setItems] = useState([]);
	const [categories, setCategories] = useState([]);
	const [element, setElement] = useState(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [toDelete, setToDelete] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [load, setLoad] = useState(false);
	const [search, setSearch] = useState("");

	const fetchData = () => {
		setLoading(true);
		return Promise.all([
			axios.get(Routing.generate(URL_LIST)),
			axios.get(Routing.generate("intern_api_budget_categories_list")),
		]).then(([r, c]) => {
			setItems(r.data);
			setCategories(c.data);
			setLoading(false);
		});
	}

	useEffect(() => { fetchData(); }, []);

	const handleOpenCreate = () => { setElement(null); setSheetOpen(true); }
	const handleEdit = (elem) => { setElement(elem); setSheetOpen(true); }
	const handleSheetOpenChange = (open) => { setSheetOpen(open); if (!open) setElement(null); }
	const handleSaved = () => { fetchData(); }

	const handleDelete = () => {
		if (!load && toDelete) {
			setLoad(true);
			axios({ method: "DELETE", url: Routing.generate(URL_DELETE, { id: toDelete.id }) })
				.then(() => fetchData())
				.then(() => { setToDelete(null); setDeleteOpen(false); })
				.catch((error) => Formulaire.displayErrors(null, error))
				.then(() => setLoad(false))
			;
		}
	}

	let searchLower = search.trim().toLowerCase();
	let filteredItems = searchLower ? items.filter(elem => elem.name.toLowerCase().includes(searchLower)) : items;

	return <Card>
		<CardHeader className="flex flex-col gap-3 space-y-0 pb-3">
			<div className="flex items-center justify-between gap-3">
				<CardTitle className="text-sm">Récurrences <span className="font-normal text-muted-foreground">({filteredItems.length})</span></CardTitle>
				<Button type="blue" onClick={handleOpenCreate}>
					<span className="icon-add mr-1"></span>Ajouter
				</Button>
			</div>
			<Search placeholder="Rechercher une récurrence..." onSearch={setSearch} />
		</CardHeader>
		<CardContent className="p-0">
			{loading
				? <div className="p-6"><LoaderElements /></div>
				: items.length === 0
					? <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune récurrence pour l'instant.</div>
					: filteredItems.length === 0
						? <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune récurrence ne correspond à la recherche.</div>
						: <div className="flex flex-col">
						{filteredItems.map(elem => (
							<div key={elem.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/50">
								<div className="flex h-9 w-9 flex-none items-center justify-center rounded-lg" style={{ background: TYPE_SOFT[elem.type], color: TYPE_COLOR[elem.type] }}>
									<span className={`icon-${elem.typeIcon}`}></span>
								</div>
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm truncate">{elem.name}</div>
									<div className="flex flex-wrap items-center gap-1 mt-1">
										<span className="text-xs text-muted-foreground">Débute {elem.initMonth}/{elem.initYear} · {elem.months.length}/12 mois</span>
										{elem.category && <Badge variant="outline" style={{ borderColor: TYPE_COLOR[elem.category.type] + '55', color: TYPE_COLOR[elem.category.type] }}>{elem.category.name}</Badge>}
									</div>
								</div>
								<div className="text-sm font-semibold tabular-nums whitespace-nowrap" style={{ color: TYPE_COLOR[elem.type] }}>
									{Sanitaze.toFormatCurrency(elem.price)}
								</div>
								<div className="flex gap-0.5 flex-shrink-0">
									<ButtonIcon type="default" icon="pencil" onClick={() => handleEdit(elem)}>Modifier</ButtonIcon>
									<ButtonIcon type="default" icon="trash" onClick={() => { setToDelete(elem); setDeleteOpen(true); }}>Supprimer</ButtonIcon>
								</div>
							</div>
						))}
					</div>
			}
		</CardContent>

		<RecurrentFormulaire context={element ? "update" : "create"} categories={categories} element={element}
							 open={sheetOpen} onOpenChange={handleSheetOpenChange} onSaved={handleSaved} />

		<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Supprimer cette récurrence</DialogTitle>
					<DialogDescription>
						Souhaitez-vous supprimer définitivement <b>{toDelete ? toDelete.name : ""}</b> ? Les opérations déjà activées à partir de cette récurrence resteront inchangées.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button type="default" onClick={() => setDeleteOpen(false)}>Annuler</Button>
					<Button type="red" onClick={handleDelete} iconLeft={load ? "chart-3" : ""}>Confirmer la suppression</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</Card>;
}
