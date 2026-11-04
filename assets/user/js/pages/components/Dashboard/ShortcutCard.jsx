import React from 'react';

import { ArrowRight } from 'lucide-react';

import { Card, CardContent } from "@shadcnComponents/ui/card";

export function ShortcutCard ({ href, Icon, title, description, cta, color, soft }) {
	return <a href={href} className="group block h-full">
		<Card className="h-full transition-all hover:shadow-md hover:-translate-y-0.5">
			<CardContent className="p-5 flex flex-col gap-3 h-full">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: soft, color }}>
					<Icon className="h-5 w-5" />
				</div>
				<div className="flex-1">
					<h3 className="font-semibold">{title}</h3>
					<p className="text-sm text-muted-foreground mt-1">{description}</p>
				</div>
				<div className="flex items-center gap-1 text-sm font-medium" style={{ color }}>
					{cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
				</div>
			</CardContent>
		</Card>
	</a>;
}
