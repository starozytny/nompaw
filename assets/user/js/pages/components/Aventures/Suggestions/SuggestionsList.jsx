import React, { useEffect, useState } from 'react';

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import { List, Map as MapIcon } from 'lucide-react';

import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Button } from "@shadcnComponents/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";

import { SuggestionCard } from "@userPages/Aventures/Suggestions/SuggestionCard";
import { SuggestionsMap } from "@userPages/Aventures/Suggestions/SuggestionsMap";
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
	const [view, setView] = useState('list'); // list | map

	const fetchData = () => {
		setLoading(true);
		return axios.get(Routing.generate(URL_LIST)).then((r) => {
			setItems(r.data);
			setLoading(false);
		});
	};

	useEffect(() => { fetchData(); }, []);

	const handleOpenCreate = () => { setElement(null); setSheetOpen(true); };

	// The « Ajouter » button lives in the Twig page header (next to the title), outside this React tree.
	useEffect(() => {
		const btn = document.getElementById('suggestion-add');
		btn?.addEventListener('click', handleOpenCreate);
		return () => btn?.removeEventListener('click', handleOpenCreate);
	}, []);
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
				<p className="text-sm text-muted-foreground">{items.length} idée{items.length === 1 ? '' : 's'} de randonnée ou de bivouac</p>
			</div>
			<div className="flex items-center gap-2">
				<div className="inline-flex h-9 items-center rounded-md bg-muted p-1" role="tablist" aria-label="Affichage">
					{[['list', List, 'Liste'], ['map', MapIcon, 'Carte']].map(([key, Icon, label]) => (
						<button key={key} type="button" role="tab" aria-selected={view === key} onClick={() => setView(key)}
							className={`inline-flex h-7 items-center gap-1.5 rounded px-3 text-sm font-medium ${view === key ? 'bg-background text-foreground shadow-sm' : 'text-foreground/70 hover:text-foreground'}`}>
							<Icon className="h-4 w-4" /> {label}
						</button>
					))}
				</div>
			</div>
		</div>

		{loading
			? <div className="p-6"><LoaderElements /></div>
			: items.length === 0
				? <div className="px-4 py-12 text-center text-sm text-muted-foreground border rounded-lg bg-muted/40">
					Aucune suggestion pour l'instant — demande à Claude de t'en proposer une via le connecteur Nompaw, ou ajoutes-en une toi-même.
				</div>
				: view === 'map'
				? <SuggestionsMap items={items} />
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
