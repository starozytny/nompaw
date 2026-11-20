export function todayISO () {
	return new Date().toISOString().slice(0, 10);
}

export function eur (value) {
	if (value == null || Number.isNaN(value)) return '—';
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(value);
}

export function pct (value, digits = 1) {
	if (value == null || Number.isNaN(value)) return '—';
	return `${value.toFixed(digits)} %`;
}

export function dateFr (iso) {
	if (!iso) return '—';
	const [y, m, d] = iso.split('-');
	return `${d}/${m}/${y}`;
}

export function monthFr (year, month) {
	const names = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
	return `${names[month - 1]} ${year}`;
}
