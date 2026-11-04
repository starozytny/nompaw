export function lineValue (line) {
	return line.currentValue ?? 0;
}

export function enveloppeValue (enveloppe) {
	return enveloppe.lines.reduce((sum, l) => sum + lineValue(l), 0);
}

export function totalValorisation (enveloppes) {
	return enveloppes.reduce((sum, e) => sum + enveloppeValue(e), 0);
}

export function totalInvestedFor (buCategoryId, totalInvested) {
	if (buCategoryId == null) return null;
	const row = totalInvested.find(t => t.buCategoryId === buCategoryId);
	return row ? row.totalInvested : null;
}

/**
 * Versé/plus-value only make sense for envelopes linked to a Budget category (that's where "versé"
 * comes from) — envelopes without a link (e.g. a plain Livret) contribute to the total valorisation
 * but are left out of this calculation rather than silently counted as "0 versé, all gain".
 */
export function portfolioGain (enveloppes, totalInvested) {
	const linked = enveloppes.filter(e => e.buCategoryId != null);
	const investedSum = linked.reduce((sum, e) => sum + (totalInvestedFor(e.buCategoryId, totalInvested) ?? 0), 0);
	const valorisationLinked = linked.reduce((sum, e) => sum + enveloppeValue(e), 0);
	const gain = linked.length ? valorisationLinked - investedSum : null;
	const gainPct = gain != null && investedSum ? (gain / investedSum) * 100 : null;

	return { linkedCount: linked.length, investedSum, gain, gainPct };
}

export function enveloppeAllocation (enveloppes) {
	const total = totalValorisation(enveloppes);
	return enveloppes
		.map(e => ({ name: e.name, value: enveloppeValue(e), pct: total ? (enveloppeValue(e) / total) * 100 : 0 }))
		.filter(row => row.value > 0);
}

export function lineAllocation (enveloppe) {
	const total = enveloppeValue(enveloppe);
	return enveloppe.lines
		.map(l => ({ name: l.name, value: lineValue(l), pct: total ? (lineValue(l) / total) * 100 : 0 }))
		.filter(row => row.value > 0);
}

/**
 * Same lines, grouped across every envelope instead of within one — e.g. "MSCI World ETF" held in
 * both the PEA and the AV collapses into a single slice, answering "what am I actually holding in
 * total" rather than "which account holds it" (that's enveloppeAllocation's job).
 */
export function lineAllocationAcrossEnveloppes (enveloppes) {
	const total = totalValorisation(enveloppes);
	const byName = new Map();
	enveloppes.forEach(e => e.lines.forEach(l => {
		const value = lineValue(l);
		byName.set(l.name, (byName.get(l.name) ?? 0) + value);
	}));

	return Array.from(byName, ([name, value]) => ({ name, value, pct: total ? (value / total) * 100 : 0 }))
		.filter(row => row.value > 0)
		.sort((a, b) => b.value - a.value);
}

/**
 * Builds a sparse-dates-aware timeline: for every date where at least one line has a snapshot, the
 * value of every other line is carried forward from its latest snapshot at or before that date (0 if
 * none yet) — a cash/ETF line only gets re-priced when its holder actually records a new value.
 */
export function evolutionSeries (enveloppes) {
	const allDates = new Set();
	enveloppes.forEach(e => e.lines.forEach(l => l.snapshots.forEach(s => allDates.add(s.date))));
	const dates = Array.from(allDates).sort();

	return dates.map(date => {
		const row = { date, total: 0 };
		enveloppes.forEach(e => {
			let envTotal = 0;
			e.lines.forEach(l => {
				const upToDate = l.snapshots.filter(s => s.date <= date);
				envTotal += upToDate.length ? upToDate[upToDate.length - 1].value : 0;
			});
			row[e.name] = envTotal;
			row.total += envTotal;
		});
		return row;
	});
}
