import React, { useState } from 'react';

import { Card } from "@shadcnComponents/ui/card";
import { Button } from "@tailwindComponents/Elements/Button";

import { makeBilan } from "@userPages/Invest/lib/bilan";

export function BilanTab ({ tracking }) {
	const [copied, setCopied] = useState(false);
	const text = makeBilan(tracking);

	const copy = () => {
		navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
	};

	return <Card className="p-5">
		<div className="flex justify-between items-start gap-3 mb-3">
			<div>
				<h3 className="font-semibold">Bilan</h3>
				<p className="text-sm text-muted-foreground mt-1">
					Un résumé prêt à coller dans une conversation avec Claude pour analyser l'allocation, la
					performance et les versements, et ajuster le plan si besoin.
				</p>
			</div>
			<Button type="blue" iconLeft="copy" onClick={copy}>{copied ? 'Copié' : 'Copier'}</Button>
		</div>
		<pre className="text-sm whitespace-pre-wrap border rounded-lg bg-muted/20 p-4">{text}</pre>
	</Card>;
}
