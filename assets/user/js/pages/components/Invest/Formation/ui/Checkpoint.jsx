import React from 'react';
import { Check, CircleHelp, RotateCcw, X } from 'lucide-react';

import { Button } from "@shadcnComponents/ui/button";

import { SERIF } from "@userPages/Invest/Formation/ui/typography";

/**
 * A quiz question placed inside the lesson, right after the section it checks.
 * A wrong answer does not reveal the right one: the reader re-reads the section and retries.
 */
export function Checkpoint ({ index, total, question, chosen, onAnswer, onRetry }) {
	const answered = chosen !== undefined;
	const right = answered && chosen === question.reponse;

	return <aside className="rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/20 px-5 py-5 sm:px-6 flex flex-col gap-3.5 text-base leading-normal">
		<div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300">
			<CircleHelp className="h-4 w-4" />
			Point de contrôle {index + 1} / {total}
		</div>

		<p className="text-lg leading-snug text-foreground" style={SERIF}>{question.question}</p>

		<div className="flex flex-wrap gap-2">
			{question.options.map((opt, oi) => {
				const isChosen = oi === chosen;
				let cls = 'bg-background hover:border-foreground/40';
				if (answered) {
					if (isChosen) {
						cls = right
							? 'bg-emerald-50 border-emerald-500 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
							: 'bg-red-50 border-red-500 text-red-900 dark:bg-red-950/40 dark:text-red-200';
					} else {
						cls = 'bg-background opacity-50';
					}
				}
				return <button key={oi} type="button" disabled={answered} onClick={() => onAnswer(oi)}
					className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-left text-sm transition-[background-color,border-color,transform] duration-150 active:scale-[0.98] disabled:cursor-default disabled:active:scale-100 ${cls}`}
				>
					{answered && isChosen && (right ? <Check className="h-3.5 w-3.5 shrink-0" /> : <X className="h-3.5 w-3.5 shrink-0" />)}
					{opt}
				</button>;
			})}
		</div>

		{answered && <div className="flex flex-col sm:flex-row sm:items-start gap-3 justify-between text-sm leading-6">
			<p>
				<strong>{right ? 'Exact. ' : 'Pas tout à fait. '}</strong>
				{right ? question.explication : 'Relis la section juste au-dessus, puis réessaie.'}
			</p>
			{!right && <Button size="sm" variant="outline" className="shrink-0 bg-background" onClick={onRetry}>
				<RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Réessayer
			</Button>}
		</div>}
	</aside>;
}
