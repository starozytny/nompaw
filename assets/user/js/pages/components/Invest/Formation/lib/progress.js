import { useCallback, useState } from 'react';

/**
 * Per-browser progress of the Formation modules: { [slug]: { passedAt: ISO date } }.
 * localStorage may be unavailable (private window, blocked storage): every access is guarded.
 */
const KEY = 'nompaw.invest.formation.v1';

function read () {
	try {
		const raw = localStorage.getItem(KEY);
		return raw ? JSON.parse(raw) || {} : {};
	} catch (e) {
		return {};
	}
}

function write (value) {
	try { localStorage.setItem(KEY, JSON.stringify(value)); } catch (e) {}
}

export function useFormationProgress () {
	const [progress, setProgress] = useState(read);

	const markPassed = useCallback((slug) => {
		setProgress(prev => {
			if (prev[slug]) return prev;
			const next = { ...prev, [slug]: { passedAt: new Date().toISOString() } };
			write(next);
			return next;
		});
	}, []);

	const reset = useCallback(() => {
		write({});
		setProgress({});
	}, []);

	return { progress, markPassed, reset };
}
