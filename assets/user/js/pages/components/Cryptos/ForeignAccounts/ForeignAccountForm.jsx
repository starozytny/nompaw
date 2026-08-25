import React, { useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Formulaire from "@commonFunctions/formulaire";
import Validateur from "@commonFunctions/validateur";
import Toastr from "@tailwindFunctions/toastr";

import { Button } from "@tailwindComponents/Elements/Button";
import { Input, TextArea } from "@tailwindComponents/Elements/Fields";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@shadcnComponents/ui/sheet";

const URL_CREATE_ELEMENT = "intern_api_cryptos_foreign_accounts_create";
const URL_UPDATE_ELEMENT = "intern_api_cryptos_foreign_accounts_update";

export function ForeignAccountFormulaire ({ context, element, open, onOpenChange, onSaved }) {
	return <Sheet open={open} onOpenChange={onOpenChange}>
		<SheetContent className="flex flex-col p-0 sm:max-w-lg [&_label]:mb-1.5 [&_label]:mt-0">
			<SheetHeader>
				<SheetTitle>{context === "create" ? "Ajouter un compte" : "Modifier le compte"}</SheetTitle>
			</SheetHeader>

			<div className="flex-1 overflow-y-auto px-6 py-5">
				<Form
					key={element ? element.id : 'new'}
					context={context}
					element={element}
					onClose={() => onOpenChange(false)}
					onSaved={onSaved}
				/>
			</div>
		</SheetContent>
	</Sheet>;
}

function Form ({ context, element, onClose, onSaved }) {
	const [state, setState] = useState({
		platform: element ? Formulaire.setValue(element.platform) : '',
		accountIdentifier: element ? Formulaire.setValue(element.accountIdentifier) : '',
		address: element ? Formulaire.setValue(element.address) : '',
		openedAt: element ? Formulaire.setValueDate(element.openedAt) : '',
		closedAt: element ? Formulaire.setValueDate(element.closedAt) : '',
		notes: element ? Formulaire.setValue(element.notes) : '',
	});
	const [errors, setErrors] = useState([]);
	const [load, setLoad] = useState(false);

	const handleChange = (e) => {
		let name = e.currentTarget.name;
		let value = e.currentTarget.value;
		setState(prev => ({ ...prev, [name]: value }));
	}

	const handleSubmit = (e) => {
		e.preventDefault();
		if (load) return;

		setErrors([]);

		const { platform, accountIdentifier, address, openedAt, closedAt, notes } = state;

		let validate = Validateur.validateur([
			{ type: "text", id: 'platform', value: platform },
		]);
		if (!validate.code) {
			Toastr.toast('warning', 'Veuillez vérifier les informations transmises.');
			setErrors(validate.errors);
			return;
		}

		setLoad(true);
		Formulaire.loader(true);

		let url = context === "create" ? Routing.generate(URL_CREATE_ELEMENT) : Routing.generate(URL_UPDATE_ELEMENT, { id: element.id });

		axios({ method: context === "create" ? "POST" : "PUT", url: url, data: { platform, accountIdentifier, address, openedAt, closedAt, notes } })
			.then(function () {
				Toastr.toast('info', 'Compte enregistré.');
				onSaved();
				onClose();
			})
			.catch(function (error) {
				Formulaire.displayErrors({ setState: (s) => setErrors(s.errors || []) }, error);
			})
			.then(function () {
				Formulaire.loader(false);
				setLoad(false);
			})
		;
	}

	const { platform, accountIdentifier, address, openedAt, closedAt, notes } = state;
	const params = { errors: errors, onChange: handleChange };

	return <div className="flex flex-col gap-5">
		<Input identifiant="platform" valeur={platform} {...params} placeholder="Binance">Plateforme</Input>
		<Input identifiant="accountIdentifier" valeur={accountIdentifier} {...params} placeholder="Pseudo, email ou n° de compte">Identifiant de compte (optionnel)</Input>
		<TextArea identifiant="address" valeur={address} {...params} height="60px" placeholder="Adresse du prestataire (à renseigner toi-même)">Adresse (optionnel)</TextArea>

		<div className="grid grid-cols-2 gap-4">
			<Input type="date" identifiant="openedAt" valeur={openedAt} {...params}>Date d'ouverture</Input>
			<Input type="date" identifiant="closedAt" valeur={closedAt} {...params}>Date de clôture (optionnel)</Input>
		</div>

		<TextArea identifiant="notes" valeur={notes} {...params} height="80px">Notes (optionnel)</TextArea>

		<div className="flex justify-end gap-2">
			{context === "update" && <Button type="default" onClick={onClose}>Annuler</Button>}
			<Button type="blue" isSubmit={true} iconLeft={load ? "chart-3" : ""} onClick={handleSubmit} width="w-full sm:w-auto">
				{context === "create" ? "Enregistrer" : "Modifier"}
			</Button>
		</div>
	</div>
}
