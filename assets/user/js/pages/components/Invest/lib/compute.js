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
