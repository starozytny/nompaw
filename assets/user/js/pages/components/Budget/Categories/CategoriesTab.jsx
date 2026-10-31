import React, { useEffect, useState } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { Search } from "@tailwindComponents/Elements/Search";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Card, CardHeader, CardTitle, CardContent } from "@shadcnComponents/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";

import { CategoryFormulaire } from "@userPages/Budget/Categories/CategoryForm";
import { TypeColumns } from "@userPages/Budget/TypeColumns";

const URL_LIST = "intern_api_budget_categories_list";
const URL_DELETE = "intern_api_budget_categories_delete";

export function CategoriesTab () {
	const [loading, setLoading] = useState(true);
	const [items, setItems] = useState([]);
	const [element, setElement] = useState(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [toDelete, setToDelete] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [load, setLoad] = useState(false);
	const [search, setSearch] = useState("");

	const fetchData = () => {
		setLoading(true);
		return axios.get(Routing.generate(URL_LIST)).then((r) => {
			setItems(r.data);
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
				<CardTitle className="text-sm">Catégories <span className="font-normal text-muted-foreground">({filteredItems.length})</span></CardTitle>
				<Button type="blue" onClick={handleOpenCreate}>
					<span className="icon-add mr-1"></span>Ajouter
				</Button>
			</div>
			<Search placeholder="Rechercher une catégorie..." onSearch={setSearch} />
		</CardHeader>
		<CardContent className="p-0">
			{loading
				? <div className="p-6"><LoaderElements /></div>
				: items.length === 0
					? <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune catégorie pour l'instant.</div>
					: filteredItems.length === 0
						? <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune catégorie ne correspond à la recherche.</div>
						: <TypeColumns items={filteredItems} emptyLabel="Aucune catégorie de ce type." renderItem={elem => (
							<div key={elem.id} className="flex items-center gap-2 border-b px-3 py-2.5 last:border-b-0 hover:bg-accent/50">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm truncate">{elem.name}</div>
								</div>
								{elem.goal ? (
									<div className="text-xs font-semibold tabular-nums whitespace-nowrap text-muted-foreground">
										{Sanitaze.toFormatCurrency(elem.goal)}
									</div>
								) : null}
								<div className="flex gap-0.5 flex-shrink-0">
									<ButtonIcon type="default" icon="pencil" onClick={() => handleEdit(elem)}>Modifier</ButtonIcon>
									<ButtonIcon type="default" icon="trash" onClick={() => { setToDelete(elem); setDeleteOpen(true); }}>Supprimer</ButtonIcon>
								</div>
							</div>
						)} />
			}
		</CardContent>

		<CategoryFormulaire context={element ? "update" : "create"} element={element}
							open={sheetOpen} onOpenChange={handleSheetOpenChange} onSaved={handleSaved} />

		<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Supprimer cette catégorie</DialogTitle>
					<DialogDescription>
						Souhaitez-vous supprimer définitivement <b>{toDelete ? toDelete.name : ""}</b> ? Les opérations liées ne seront pas supprimées, seulement détachées de la catégorie.
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
