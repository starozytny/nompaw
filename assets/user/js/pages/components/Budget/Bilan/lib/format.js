const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function monthFr (month) {
	return MONTHS_FR[month - 1] || `mois ${month}`;
}

export function dateFr (iso) {
	if (!iso) return '—';
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
}
