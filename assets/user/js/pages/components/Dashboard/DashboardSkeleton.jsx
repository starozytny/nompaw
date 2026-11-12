import React from 'react';

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Skeleton } from "@shadcnComponents/ui/skeleton";

function StatSkeleton () {
	return <Card>
		<CardContent className="p-4 flex items-center gap-3">
			<Skeleton className="h-10 w-10 flex-none rounded-lg" />
			<div className="min-w-0 flex-1 flex flex-col gap-1.5">
				<Skeleton className="h-3 w-20" />
				<Skeleton className="h-5 w-24" />
				<Skeleton className="h-3 w-16" />
			</div>
		</CardContent>
	</Card>;
}

/**
 * Mirrors the shape the real content will take (same card count/spans) so the page doesn't jump when
 * the fetches resolve — hasInvest/hasRunning are known synchronously (from the server-rendered paths),
 * so the skeleton already matches whether the charts row will show up at all, and with how many cards.
 */
export function DashboardSkeleton ({ hasInvest, hasRunning }) {
	const statCount = 2 + (hasInvest ? 1 : 0) + (hasRunning ? 1 : 0);
	const showCharts = hasInvest || hasRunning;
	const sideSpan = hasInvest && hasRunning ? 'lg:col-span-1' : 'lg:col-span-2';

	return <>
		<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
			{Array.from({ length: statCount }).map((_, i) => <StatSkeleton key={i} />)}
		</div>

		{showCharts && <div className="grid gap-4 grid-cols-1 lg:grid-cols-4 items-stretch">
			<Card className="lg:col-span-2">
				<CardContent className="p-5 flex flex-col gap-3">
					<Skeleton className="h-3 w-40" />
					<Skeleton className="h-40 w-full" />
				</CardContent>
			</Card>
			{hasInvest && <Card className={sideSpan}>
				<CardContent className="p-5 flex flex-col gap-3">
					<Skeleton className="h-3 w-28" />
					<Skeleton className="h-40 w-full rounded-full" />
				</CardContent>
			</Card>}
			{hasRunning && <Card className={sideSpan}>
				<CardContent className="p-5 flex flex-col gap-3">
					<Skeleton className="h-3 w-28" />
					<Skeleton className="h-40 w-full" />
				</CardContent>
			</Card>}
		</div>}
	</>;
}
