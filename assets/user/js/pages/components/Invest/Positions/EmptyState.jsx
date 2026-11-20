import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";

/**
 * Shown when the account has no envelope yet — the case on a fresh prod database, which has no way
 * to run the dev-only `app:invest:seed-initial-data` console command conveniently.
 */
export function EmptyState ({ onSeedInitialData }) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	const seed = () => {
		setLoading(true);
		setError(null);
		onSeedInitialData()
			.catch(e => setError(e.response?.data?.message || "Initialisation impossible."))
			.finally(() => setLoading(false));
	};

	return <Card className="p-6 flex flex-col items-center text-center gap-3">
		<h3 className="font-semibold">Aucune enveloppe pour l'instant</h3>
		<p className="text-sm text-muted-foreground max-w-md">
			Démarre avec tes positions de départ (PEA XTB, AV Linxea, CTO, Livret A, épargne de précaution)
			telles que décrites dans ton brief, puis ajuste-les ici — ou crée directement une enveloppe vide
			plus bas.
		</p>
		<Button type="blue" iconLeft="add" onClick={seed} isSubmit={false} pa={loading ? 'py-2 px-4 opacity-60' : 'py-2 px-4'}>
			{loading ? 'Initialisation…' : 'Initialiser avec mes données de départ'}
		</Button>
		{error && <div className="text-sm text-[var(--status-critical)]">{error}</div>}
	</Card>;
}
