import React, { useEffect, useState } from "react";

import axios from "axios";
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

import Toastr from "@tailwindFunctions/toastr";
import Formulaire from "@commonFunctions/formulaire";

import { Button } from "@tailwindComponents/Elements/Button";
import { formatSize } from "@userPages/Drive/DriveUi";

const URL_LIST = "admin_drive_list";
const URL_QUOTA = "admin_drive_quota";

const MO = 1024 * 1024;

export function DriveQuotas () {
	const [users, setUsers] = useState([]);
	const [values, setValues] = useState({});
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		axios({ method: "GET", url: Routing.generate(URL_LIST) })
			.then((response) => {
				setUsers(response.data.data);
				setValues(Object.fromEntries(response.data.data.map(u => [u.id, String(Math.round(u.quota / MO))])));
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => setLoading(false))
		;
	}, []);

	const handleSave = (user) => {
		Formulaire.loader(true);
		axios({ method: "PUT", url: Routing.generate(URL_QUOTA, { id: user.id }), data: { quotaMo: values[user.id] } })
			.then((response) => {
				const updated = response.data.data;
				setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
				Toastr.toast('info', "Quota mis à jour.");
			})
			.catch((error) => Formulaire.displayErrors(null, error))
			.then(() => Formulaire.loader(false))
		;
	}

	if (loading) {
		return <div className="text-center text-slate-600 text-sm py-8">Chargement...</div>
	}

	return <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
		<p className="text-sm text-slate-600 mb-4">Quota par défaut : 250 Mo. Le quota est exprimé en Mo.</p>

		<div className="flex flex-col gap-2">
			{users.map(user => {
				const changed = values[user.id] !== String(Math.round(user.quota / MO));

				return <div key={user.id} className="flex flex-col gap-3 rounded-md px-3 py-3 bg-slate-50 border border-slate-200 sm:flex-row sm:items-center">
					<div className="min-w-0 sm:w-64">
						<div className="font-medium text-slate-900 truncate">{user.displayName}</div>
						<div className="text-xs text-slate-500 truncate">{user.email}</div>
					</div>
					<div className="flex-1">
						<QuotaBar used={user.used} quota={user.quota} />
					</div>
					<form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); handleSave(user); }}>
						<input type="number" min="0" step="1" value={values[user.id] ?? ""} aria-label={"Quota de " + user.displayName + " en Mo"}
							   onChange={(e) => setValues(prev => ({ ...prev, [user.id]: e.target.value }))}
							   className="w-24 rounded-md border-0 py-1.5 px-2 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600" />
						<span className="text-sm text-slate-600">Mo</span>
						<Button type={changed ? "blue" : "default"} onClick={() => handleSave(user)}>Enregistrer</Button>
					</form>
				</div>
			})}
		</div>
	</div>
}

function QuotaBar ({ used, quota }) {
	const percent = quota > 0 ? Math.min(100, (used / quota) * 100) : 100;
	const color = percent >= 90 ? "bg-red-500" : percent >= 70 ? "bg-yellow-500" : "bg-blue-600";

	return <div>
		<div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
			<div className={`h-full ${color}`} style={{ width: percent + "%" }} />
		</div>
		<div className="mt-1 text-xs text-slate-600">{formatSize(used)} utilisés sur {formatSize(quota)}</div>
	</div>
}
