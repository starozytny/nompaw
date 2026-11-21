import React, { useState } from 'react';
import { Check } from 'lucide-react';

import { Checkpoint } from "@userPages/Invest/Formation/ui/Checkpoint";
import { SERIF, ROMAN, NIVEAUX, DISCLAIMER, pad, formatDate } from "@userPages/Invest/Formation/ui/typography";

// Mandatory sections of a module, in order (see docs/formation/_FORMAT.md).
const SECTIONS = [
	{ key: 'concept', title: 'Le concept' },
	{ key: 'pourquoi', title: 'Pourquoi ça compte' },
	{ key: 'exemple', title: 'Exemple chiffré' },
	{ key: 'erreur', title: "L'erreur classique" },
	{ key: 'suivi', title: 'Dans ton suivi' },
];

// Quiz question i is shown as a checkpoint right after this section; extra questions go after the last one.
const CHECKPOINT_AFTER = ['concept', 'exemple', 'erreur'];

const DROP_CAP = '[&>p:first-child]:first-letter:float-left [&>p:first-child]:first-letter:mr-2.5 [&>p:first-child]:first-letter:mt-1.5 [&>p:first-child]:first-letter:text-[4.2rem] [&>p:first-child]:first-letter:leading-[0.8] [&>p:first-child]:first-letter:font-bold';

const KICKER = 'text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground';

export function ModuleView ({ module, modules, progress, onPass, onSelect }) {
	const missing = (module.prerequis || []).filter(sl => !progress[sl]).map(sl => modules.find(m => m.slug === sl)).filter(Boolean);
	const passed = !!progress[module.slug];
	const next = modules.find(m => m.module === module.module + 1);

	const [answers, setAnswers] = useState({}); // { questionIndex: optionIndex }
	const total = module.quiz.length;
	const correct = module.quiz.filter((q, i) => answers[i] === q.reponse).length;

	const answer = (qi, oi) => {
		const nextAnswers = { ...answers, [qi]: oi };
		setAnswers(nextAnswers);
		if (module.quiz.every((q, i) => nextAnswers[i] === q.reponse)) onPass();
	};
	const retry = qi => setAnswers(a => {
		const n = { ...a };
		delete n[qi];
		return n;
	});

	const sections = SECTIONS.filter(s => module.sections[s.key]);
	const lastKey = sections[sections.length - 1]?.key;
	const placeOf = i => (module.sections[CHECKPOINT_AFTER[i]] ? CHECKPOINT_AFTER[i] : lastKey);
	const checkpointsAfter = key => module.quiz.map((q, i) => i).filter(i => placeOf(i) === key);

	return <div className="px-5 sm:px-10 py-12 sm:py-16 mx-auto max-w-[44rem]">
		{/* Title page */}
		<header className="flex flex-col items-center text-center gap-5 pb-12 border-b">
			<div className={KICKER}>
				Chapitre {pad(module.module)} · {NIVEAUX[module.niveau] || module.niveau} · {module.duree_minutes} min
			</div>
			<h2 className="text-4xl sm:text-[3.25rem] leading-[1.05] tracking-tight text-balance" style={SERIF}>{module.titre}</h2>
			{module.indicateur && <p className="text-lg italic text-muted-foreground max-w-md" style={SERIF}>
				Pour savoir lire, dans ton suivi : {module.indicateur.toLowerCase()}.
			</p>}
			{passed && <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
				<Check className="h-3.5 w-3.5" />Chapitre validé
			</span>}
			{!passed && missing.length > 0 && <p className="text-xs text-muted-foreground">
				Conseillé après {missing.map((m, i) => <span key={m.slug}>
					{i > 0 && ', '}
					<button type="button" onClick={() => onSelect(m.slug)} className="underline underline-offset-2 hover:text-foreground">
						le chapitre {pad(m.module)} « {m.titre} »
					</button>
				</span>)}
				{module.deblocage && <> — {module.deblocage}</>}.
			</p>}
		</header>

		<div className="flex flex-col gap-14 pt-12 text-[17px] leading-[1.8] text-foreground/90">
				{sections.map((s, n) => <React.Fragment key={s.key}>
					<section className="flex flex-col gap-6">
						<ChapterTitle n={n} title={s.title} />

						{s.key === 'exemple' && module.chiffre_cle && <figure className="flex flex-col items-center text-center gap-1 py-4">
							<div className="text-6xl sm:text-7xl tracking-tight tabular-nums text-foreground" style={SERIF}>{module.chiffre_cle.valeur}</div>
							<figcaption className="text-sm uppercase tracking-[0.2em] text-muted-foreground">{module.chiffre_cle.libelle}</figcaption>
							{module.chiffre_cle.contexte && <div className="text-sm italic text-muted-foreground mt-1" style={SERIF}>{module.chiffre_cle.contexte}</div>}
						</figure>}

						{s.key === 'erreur'
							? <blockquote className="border-l-[3px] border-red-500 pl-6 sm:pl-8 text-xl sm:text-[1.4rem] leading-[1.55] italic text-foreground [&_strong]:not-italic" style={SERIF}>
								{module.sections.erreur}
							</blockquote>
							: <div className={`flex flex-col gap-5 ${s.key === 'concept' ? DROP_CAP : ''}`}>{module.sections[s.key]}</div>}

						{s.key === 'concept' && module.definitions && <Lexique definitions={module.definitions} />}
					</section>

					{checkpointsAfter(s.key).map(qi => <Checkpoint key={qi}
						index={qi} total={total} question={module.quiz[qi]} chosen={answers[qi]}
						onAnswer={oi => answer(qi, oi)} onRetry={() => retry(qi)}
					/>)}
				</React.Fragment>)}

				<section className="flex flex-col items-center gap-6 border-y py-10">
					<div className={KICKER}>À retenir</div>
					<ol className="flex flex-col gap-5 max-w-lg">
						{module.sections.retenir.map((r, i) => <li key={i} className="flex gap-4 items-baseline">
							<span className="text-2xl text-muted-foreground/60 tabular-nums" style={SERIF}>{i + 1}.</span>
							<span className="text-lg leading-snug text-foreground" style={SERIF}>{r}</span>
						</li>)}
					</ol>
					<div className="text-sm text-center">
						{passed
							? <span className="inline-flex items-center gap-1.5 font-medium text-emerald-700 dark:text-emerald-400"><Check className="h-4 w-4" />Chapitre validé</span>
							: <span className="text-muted-foreground">
								Points de contrôle réussis : <strong className="text-foreground tabular-nums">{correct} / {total}</strong> — tous justes pour valider le chapitre.
							</span>}
					</div>
				</section>

				{module.verifier?.length > 0 && <p className="text-xs text-muted-foreground text-center">
					Chiffres susceptibles d'évoluer, à revérifier : {module.verifier.join(', ')}.
				</p>}

				{next && <button type="button" onClick={() => onSelect(next.slug)}
					className="group flex flex-col items-center gap-2 text-center py-2"
				>
					<span className={KICKER}>Chapitre suivant</span>
					<span className="text-2xl underline decoration-1 underline-offset-[6px] decoration-foreground/30 transition-[text-decoration-color] duration-150 group-hover:decoration-foreground text-foreground" style={SERIF}>
						{pad(next.module)} — {next.titre}
					</span>
				</button>}

				<p className="text-center text-xs italic text-muted-foreground leading-5">
					{DISCLAIMER} Mis à jour le {formatDate(module.maj)}.
				</p>
		</div>
	</div>;
}

function ChapterTitle ({ n, title }) {
	return <div className="flex flex-col items-center gap-2 text-center">
		<span className="text-xs font-semibold tracking-[0.25em] text-muted-foreground">{ROMAN[n]}</span>
		<h3 className="text-[1.75rem] leading-tight text-foreground" style={SERIF}>{title}</h3>
		<span className="h-px w-10 bg-foreground/30 mt-1" />
	</div>;
}

function Lexique ({ definitions }) {
	return <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 border-y py-6 my-2">
		<div className={`sm:col-span-2 ${KICKER}`}>Lexique</div>
		{Object.entries(definitions).map(([term, def]) => <div key={term}>
			<dt className="text-base font-bold text-foreground" style={SERIF}>{term}</dt>
			<dd className="text-sm leading-6 text-muted-foreground">{def}</dd>
		</div>)}
	</dl>;
}
