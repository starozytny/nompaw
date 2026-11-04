import React from 'react';

import { Card } from "@shadcnComponents/ui/card";

export function ComingSoon ({ label }) {
	return <Card className="p-8 text-center text-sm text-muted-foreground">
		« {label} » — module à venir.
	</Card>;
}
