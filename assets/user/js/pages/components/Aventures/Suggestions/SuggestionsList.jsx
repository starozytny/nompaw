import React, { useEffect, useState } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import { Plus } from 'lucide-react';

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Button } from "@shadcnComponents/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";

import { SuggestionCard } from "@userPages/Aventures/Suggestions/SuggestionCard";
import { SuggestionForm } from "@userPages/Aventures/Suggestions/SuggestionForm";

const URL_LIST = "intern_api_rando_suggestions_list";
const URL_DELETE = "intern_api_rando_suggestions_delete";

export function SuggestionsList () {
	const [loading, setLoading] = useState(true);
	const [items, setItems] = useState([]);
	const [element, setElement] = useState(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [toDelete, setToDelete] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [load, setLoad] = useState(false);

	const fetchData = () => {
		setLoading(true);
		return axios.get(Routing.generate(URL_LIST)).then((r) => {
			setItems(r.data);
			setLoading(false);
		});
	};

	useEffect(() => { fetchData(); }, []);

	const handleOpenCreate = () => { setElement(null); setSheetOpen(true); };
	const handleEdit = (elem) => { setElement(elem); setSheetOpen(true); };
	const handleSheetOpenChange = (open) => { setSheetOpen(open); if (!open) setElement(null); };
	const handleSaved = () => { fetchData(); };

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
	};

	return <div className="flex flex-col gap-5">
		<div className="flex items-center justify-between gap-3">
			<div>
				<h1 className="text-lg font-semibold">Suggestions</h1>
				<p className="text-sm text-muted-foreground">{items.length} idée{items.length === 1 ? '' : 's'} de randonnée ou de bivouac</p>
			</div>
			<Button onClick={handleOpenCreate}>
				<Plus className="h-4 w-4" /> Ajouter
			</Button>
		</div>

		{loading
			? <div className="p-6"><LoaderElements /></div>
			: items.length === 0
				? <div className="px-4 py-12 text-center text-sm text-muted-foreground border rounded-lg bg-muted/40">
					Aucune suggestion pour l'instant — demande à Claude de t'en proposer une via le connecteur Nompaw, ou ajoutes-en une toi-même.
				</div>
				: <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{items.map(elem => (
						<SuggestionCard key={elem.id} elem={elem} onEdit={handleEdit}
							onDelete={(e) => { setToDelete(e); setDeleteOpen(true); }} />
					))}
				</div>
		}

		<SuggestionForm element={element} open={sheetOpen} onOpenChange={handleSheetOpenChange} onSaved={handleSaved} />

		<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Supprimer cette suggestion</DialogTitle>
					<DialogDescription>
						Souhaites-tu supprimer définitivement <b>{toDelete ? toDelete.name : ""}</b> ?
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button variant="outline" onClick={() => setDeleteOpen(false)}>Annuler</Button>
					<Button variant="destructive" onClick={handleDelete} disabled={load}>Confirmer la suppression</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>;
}
