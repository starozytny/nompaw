const TYPE_LABEL = { 0: 'Dépense', 1: 'Revenu', 2: 'Économie', 3: 'Supprimé', 4: 'Utilisé' };

/**
 * One row per item of the year — the finest grain available, so any other view (par mois, par
 * catégorie) can be rebuilt externally from this.
 */
export function budgetToCsv ({ donnees }) {
	const rows = [['Année', 'Mois', 'Type', 'Catégorie', 'Nom', 'Montant (EUR)', 'Actif', 'Date']];
	donnees.forEach(item => {
		rows.push([
			item.year, item.month, TYPE_LABEL[item.type] || item.type,
			item.category ? item.category.name : '', item.name,
			String(item.price).replace('.', ','), item.isActive ? 'oui' : 'non', item.dateAt,
		]);
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
