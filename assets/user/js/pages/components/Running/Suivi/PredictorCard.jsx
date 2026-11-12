import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@shadcnComponents/ui/button";

import { bestRecentOverall } from "@userPages/Running/Suivi/lib/history";
import { fmtDur, fr1, isoFr, parseDur } from "@userPages/Running/Suivi/lib/format";

function predict (km, sec) {
	const at = d => sec * Math.pow(d / km, 1.06);
	const t10 = at(10), semi = at(21.0975);
	let line, goal;
	if (t10 <= 57.5 * 60) { line = 'ligne 57:00 (allure semi 5:57)'; goal = 'objectif 2h05 envisageable'; }
	else if (t10 <= 59.5 * 60) { line = 'ligne 59:00 (allure semi 6:09)'; goal = 'objectif 2h10 confirmé'; }
	else if (t10 <= 63 * 60) { line = 'ligne 1h02 (allure semi 6:27)'; goal = 'repli 2h15–2h20, puis nouveau test'; }
	else { line = 'ligne 1h02 (allure semi 6:27)'; goal = 'finir en 2h20 et plus, reprendre un test dans 3 semaines'; }
	return { t10, semi, line, goal };
}

export function PredictorCard ({ activities }) {
	const [km, setKm] = useState('');
	const [t, setT] = useState('');
	const [result, setResult] = useState(null);
	const [note, setNote] = useState(null);
	const [error, setError] = useState(null);

	const run = (kmVal, tVal) => {
		const kmNum = parseFloat(String(kmVal).replace(',', '.'));
		const sec = parseDur(tVal);
		if (!kmNum || !sec) { setError('Renseigne une distance et un temps (ex. 10 et 59:30).'); setResult(null); return; }
		setError(null);
		setResult(predict(kmNum, sec));
	};

	const fillBestEffort = () => {
		const b = bestRecentOverall(activities);
		if (!b) { setError("Aucun effort récent trouvé : importe d'abord ton CSV Garmin, ou saisis un résultat à la main."); return; }
		setKm(String(b.km).replace('.', ','));
		setT(fmtDur(b.sec));
		run(b.km, fmtDur(b.sec));
		setNote(`Meilleur effort récent détecté : ${fr1(b.km)} km en ${fmtDur(b.sec)} le ${isoFr(b.d)}${b.title ? ' (' + b.title + ')' : ''}. Ce n'est pas forcément une course à fond : saisis un test pour être précis.`);
	};

	return <Card className="p-5">
		<h3 className="font-semibold mb-1.5">Prédicteur de temps</h3>
		<p className="text-sm text-muted-foreground mb-3">
			Entre un résultat récent (course ou test) : la formule de Riegel donne le 10 km et le semi équivalents, et la
			ligne d'allure à adopter.
		</p>

		<div className="flex gap-3 flex-wrap items-end">
			<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground w-[130px]">
				Distance (km)
				<input type="text" placeholder="10" value={km} onChange={e => setKm(e.target.value)}
					   className="px-2.5 py-1.5 border rounded-md text-sm font-normal normal-case tracking-normal bg-white" />
			</label>
			<label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-wide text-muted-foreground w-[150px]">
				Temps (h:mm:ss)
				<input type="text" placeholder="59:30" value={t} onChange={e => setT(e.target.value)}
					   className="px-2.5 py-1.5 border rounded-md text-sm font-normal normal-case tracking-normal bg-white" />
			</label>
			<Button onClick={() => { setNote(null); run(km, t); }}>Calculer</Button>
			<Button variant="outline" onClick={fillBestEffort}>Utiliser mon meilleur effort récent</Button>
		</div>

		{error && <div className="mt-3.5 text-sm text-[var(--status-critical)]">{error}</div>}

		{result && <div className="mt-3.5 grid gap-3 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
			<div className="p-4 border rounded-lg">
				<div className="text-xl font-bold">{fmtDur(result.t10)}</div>
				<div className="text-xs text-muted-foreground mt-0.5">10 km équivalent</div>
			</div>
			<div className="p-4 border rounded-lg">
				<div className="text-xl font-bold">{fmtDur(result.semi)} à {fmtDur(result.semi * 1.03)}</div>
				<div className="text-xs text-muted-foreground mt-0.5">Semi équivalent (Riegel, et +3 % : la formule est optimiste au-delà de 10 km)</div>
			</div>
			<div className="p-4 border rounded-lg">
				<div className="text-base font-bold">{result.line}</div>
				<div className="text-xs text-muted-foreground mt-0.5">{result.goal}</div>
			</div>
		</div>}

		{note && <div className="mt-2.5 text-xs text-muted-foreground">{note}</div>}
	</Card>
}
