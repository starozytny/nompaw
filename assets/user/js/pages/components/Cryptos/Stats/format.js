import moment from "moment/moment";
import "moment/locale/fr";

const eurFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const eurCompactFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });
const qtyFormatter = new Intl.NumberFormat('fr-FR', { maximumSignificantDigits: 6 });

export const eur = (v) => v === null || v === undefined ? '—' : eurFormatter.format(v);
export const eurCompact = (v) => eurCompactFormatter.format(v);
export const qty = (v) => v === null || v === undefined ? '—' : qtyFormatter.format(v);
// Unit prices span 0.0001 € (dust tokens) to 60 000 € (BTC): keep 4 significant digits below 1 €.
export const price = (v) => v === null || v === undefined ? '—'
	: (v >= 1 ? eurFormatter.format(v) : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumSignificantDigits: 4 }).format(v));
export const monthTick = (d) => moment(d).format('MMM YY');
export const dayLabel = (d) => moment(d).format('D MMM YYYY');

// Fixed-order categorical slots (see --series-* in app.scss): color follows the coin's rank in the
// server's `coins` list, which is stable for a given history — never cycled; the rest is "Autres".
export const SERIES = [1, 2, 3, 4, 5, 6, 7, 8].map(i => `var(--series-${i})`);
export const OTHER_COLOR = 'var(--series-other)';
export const colorOf = (coins, coin) => {
	const i = coins.indexOf(coin);
	return i >= 0 && i < SERIES.length ? SERIES[i] : OTHER_COLOR;
};
