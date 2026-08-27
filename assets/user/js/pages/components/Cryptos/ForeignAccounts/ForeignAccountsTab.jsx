import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Sanitaze from "@commonFunctions/sanitaze";
import Formulaire from "@commonFunctions/formulaire";

import { Button, ButtonIcon } from "@tailwindComponents/Elements/Button";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";
import { Card, CardHeader, CardTitle, CardContent } from "@shadcnComponents/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@shadcnComponents/ui/dialog";

import { ForeignAccountFormulaire } from "@userPages/Cryptos/ForeignAccounts/ForeignAccountForm";

const URL_LIST = "intern_api_cryptos_foreign_accounts_list";
const URL_DELETE = "intern_api_cryptos_foreign_accounts_delete";
const URL_EXPORT = "intern_api_cryptos_foreign_accounts_export";

export function ForeignAccountsTab () {
	const [loading, setLoading] = useState(true);
	const [items, setItems] = useState([]);
	const [element, setElement] = useState(null);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [toDelete, setToDelete] = useState(null);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [load, setLoad] = useState(false);
	const [exporting, setExporting] = useState(false);

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

	const handleExport = (e) => {
		e.preventDefault();
		if (exporting) return;

		setExporting(true);
		axios({ method: "GET", url: Routing.generate(URL_EXPORT), data: {} })
			.then(function (response) {
				const link = document.createElement('a');
				link.href = response.data.url;
				link.setAttribute('download', 'comptes-etrangers-3916bis.xlsx');
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);

				setExporting(false);
			})
			.catch(function (error) {
				Formulaire.displayErrors(null, error);
				setExporting(false);
			})
		;
	}

	return <Card>
		<CardHeader className="flex flex-col gap-3 space-y-0 pb-3">
			<div className="flex items-center justify-between gap-3">
				<div>
					<CardTitle className="text-sm">Comptes détenus à l'étranger <span className="font-normal text-muted-foreground">({items.length})</span></CardTitle>
					<div className="text-xs text-muted-foreground">Pour le formulaire 3916-BIS — déduits automatiquement des plateformes importées, à compléter/corriger toi-même (adresse, dates).</div>
				</div>
				<div className="flex items-center gap-2 flex-none">
					<Button type="default" iconLeft="download" onClick={handleExport}>Excel</Button>
					<Button type="blue" onClick={handleOpenCreate}>
						<span className="icon-add mr-1"></span>Ajouter
					</Button>
				</div>
			</div>
		</CardHeader>
		<CardContent className="p-0">
			{loading
				? <div className="p-6"><LoaderElements /></div>
				: items.length === 0
					? <div className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun compte détecté pour l'instant — importe des transactions ou ajoutes-en un manuellement.</div>
					: <div className="flex flex-col">
						{items.map(elem => (
							<div key={elem.id} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0 hover:bg-accent/50">
								<div className="flex-1 min-w-0">
									<div className="font-medium text-sm truncate">{elem.platform}</div>
									<div className="text-xs text-muted-foreground truncate">
										{elem.accountIdentifier || <span className="italic">Identifiant non renseigné</span>}
										{elem.address ? ` · ${elem.address}` : ' · Adresse non renseignée'}
									</div>
								</div>
								<div className="text-xs text-muted-foreground whitespace-nowrap">
									{elem.openedAt ? Sanitaze.toFormatDate(elem.openedAt, 'L') : '—'}
									{' → '}
									{elem.closedAt ? Sanitaze.toFormatDate(elem.closedAt, 'L') : 'actif'}
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

		<ForeignAccountFormulaire context={element ? "update" : "create"} element={element}
			open={sheetOpen} onOpenChange={handleSheetOpenChange} onSaved={handleSaved} />

		<Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Supprimer ce compte</DialogTitle>
					<DialogDescription>
						Souhaites-tu retirer <b>{toDelete ? toDelete.platform : ""}</b> de la liste des comptes à déclarer ? Aucune transaction ne sera supprimée.
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
