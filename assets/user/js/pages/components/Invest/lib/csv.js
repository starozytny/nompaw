/**
 * One row per snapshot — enveloppe, ligne, date, valeur — the finest grain available, from which any
 * other view (par enveloppe, dans le temps) can be rebuilt externally.
 */
export function tackingToCsv ({ enveloppes }) {
	const rows = [['Enveloppe', 'Type', 'Ligne', 'ISIN', 'Date', 'Valeur (EUR)']];
	enveloppes.forEach(e => {
		e.lines.forEach(l => {
			l.snapshots.forEach(s => {
				rows.push([e.name, e.typeString, l.name, l.isin || '', s.date, String(s.value).replace('.', ',')]);
			});
		});
	});

	return rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';')).join('\n');
}

export function downloadFile (content, filename, mime) {
	const blob = new Blob([content], { type: mime });
	const a = document.createElement('a');
	a.href = URL.createObjectURL(blob);
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
}
