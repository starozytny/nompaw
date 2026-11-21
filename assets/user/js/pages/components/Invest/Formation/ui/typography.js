// Editorial typography of the Formation pages.
export const SERIF = { fontFamily: 'Georgia, "Iowan Old Style", "Times New Roman", serif' };

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

export const NIVEAUX = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };

export const DISCLAIMER = 'Contenu pédagogique, pas un conseil financier personnalisé.';

export function pad (n) {
	return String(n).padStart(2, '0');
}

export function formatDate (iso) {
	const [y, m, d] = (iso || '').split('-');
	return d ? `${d}/${m}/${y}` : iso;
}
