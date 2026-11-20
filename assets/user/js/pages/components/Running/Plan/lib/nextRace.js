/**
 * First day of type 'race' at or after today, across every week of the plan — shared between the
 * Suivi tab's KPI row and the main header's countdown tile so the "which race, how many days" logic
 * only lives once.
 */
export function findNextRace (weeks, today) {
	let next = null;
	weeks.forEach(w => w.days.forEach(d => { if (!next && d.type === 'race' && d.iso >= today) next = d; }));
	const daysTo = next ? Math.round((Date.parse(next.iso) - Date.parse(today)) / 86400000) : null;
	return { next, daysTo };
}
