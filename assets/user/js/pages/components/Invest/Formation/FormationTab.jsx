import React, { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';

import { MODULES, UPCOMING } from "@userPages/Invest/Formation/modules";
import { useFormationProgress } from "@userPages/Invest/Formation/lib/progress";
import { ModuleView } from "@userPages/Invest/Formation/ui/ModuleView";
import { pad } from "@userPages/Invest/Formation/ui/typography";

export function FormationTab () {
	const { progress, markPassed } = useFormationProgress();

	// First module not yet validated (or the last one when everything is done).
	const [activeSlug, setActiveSlug] = useState(() =>
		(MODULES.find(m => !progress[m.slug]) || MODULES[MODULES.length - 1]).slug
	);
	const activeModule = MODULES.find(m => m.slug === activeSlug);

	const frameRef = useRef(null);
	const read = useReadingProgress(frameRef, activeSlug);

	const select = (slug) => {
		setActiveSlug(slug);
		// Back to the top of the chapter when switching from further down the page.
		const top = frameRef.current?.getBoundingClientRect().top;
		if (top !== undefined && top < 0) {
			frameRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	};

	return <div ref={frameRef} className="rounded-2xl border bg-background [contain:inline-size] scroll-mt-4">
		{/* Chapter bar + reading progress */}
		<div className="sticky top-0 z-10 rounded-t-2xl bg-background/90 backdrop-blur border-b">
			<div className="flex items-center justify-between gap-3 px-5 sm:px-8 h-11 text-xs">
				<nav className="flex items-center gap-4 overflow-x-auto [contain:inline-size] flex-1 [scrollbar-width:none]">
					{MODULES.map(m => <button key={m.slug} type="button" onClick={() => select(m.slug)} title={m.titre}
						className={`shrink-0 inline-flex items-center gap-1.5 tracking-wide transition-colors duration-150 ${m.slug === activeSlug ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
					>
						<span className="tabular-nums">{pad(m.module)}</span>
						{m.slug === activeSlug && <span className="hidden sm:inline max-w-[18rem] truncate">{m.titre}</span>}
						{progress[m.slug] && <Check className="h-3 w-3 text-emerald-600" />}
					</button>)}
				</nav>
				<span className="shrink-0 tabular-nums text-muted-foreground">{Math.round(read * 100)} % lu</span>
			</div>
			<div className="h-0.5 bg-foreground origin-left" style={{ transform: `scaleX(${read})` }} />
		</div>

		<ModuleView
			key={activeModule.slug}
			module={activeModule}
			modules={MODULES}
			progress={progress}
			onPass={() => markPassed(activeModule.slug)}
			onSelect={select}
		/>

		{UPCOMING.length > 0 && <div className="border-t px-5 sm:px-8 py-4 text-xs text-muted-foreground">
			Prochains chapitres : {UPCOMING.join(' · ')}
		</div>}
	</div>;
}

/** Share of the element scrolled past (0 → 1). */
function useReadingProgress (ref, resetKey) {
	const [read, setRead] = useState(0);

	useEffect(() => {
		const onScroll = () => {
			const el = ref.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			const total = r.height - window.innerHeight;
			setRead(total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 1);
		};
		onScroll();
		window.addEventListener('scroll', onScroll, { passive: true });
		window.addEventListener('resize', onScroll);
		return () => {
			window.removeEventListener('scroll', onScroll);
			window.removeEventListener('resize', onScroll);
		};
	}, [ref, resetKey]);

	return read;
}
