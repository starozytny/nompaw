import { enveloppeValue, lineAllocation, totalInvestedFor, totalValorisation } from "@userPages/Invest/lib/compute";
import { eur, pct, dateFr, monthFr, todayISO } from "@userPages/Invest/lib/format";

/**
 * @param tracking { enveloppes, buCategories, contributions, totalInvested } — same shape as
 * GET /intern/api/invest/tracking
 */
export function makeBilan ({ enveloppes, contributions, totalInvested }) {
	if (!enveloppes.length) return "Aucune enveloppe enregistrée pour l'instant.";

	const today = todayISO();
	const lines = [];
	lines.push(`BILAN INVESTISSEMENT — au ${dateFr(today)}`);

	const totalVal = totalValorisation(enveloppes);
	let totalInv = 0;
	let hasAllInvested = true;

	enveloppes.forEach(e => {
		const val = enveloppeValue(e);
		const inv = totalInvestedFor(e.buCategoryId, totalInvested);
		if (inv == null) hasAllInvested = false; else totalInv += inv;

		lines.push('');
		lines.push(`${e.name} (${e.typeString})${e.taxExemptDate ? ` — exonération fiscale à partir du ${dateFr(e.taxExemptDate)}` : ''}`);
		lines.push(`  Valorisation : ${eur(val)}${inv != null ? ` · Versé net : ${eur(inv)} · Plus/moins-value : ${eur(val - inv)}` : ''}`);

		lineAllocation(e).forEach(l => {
			lines.push(`  - ${l.name} : ${eur(l.value)} (${pct(l.pct)})`);
		});

		const contrib = contributions.find(c => c.buCategoryId === e.buCategoryId);
		if (contrib) {
			const last = contrib.months[contrib.months.length - 1];
			if (last) lines.push(`  Versement du mois (${monthFr(last.year, last.month)}) : prévu ${eur(last.planned)}, réel ${eur(last.actual)}`);
		}
	});

	lines.push('');
	lines.push(`Total : valorisation ${eur(totalVal)}${hasAllInvested ? ` · versé net ${eur(totalInv)} · plus/moins-value ${eur(totalVal - totalInv)}` : ' (versé net incomplet : certaines enveloppes ne sont pas liées au Planificateur)'}.`);

	lines.push('');
	lines.push("Peux-tu analyser ce bilan (allocation, performance, versements vs prévu) et me dire si le plan d'investissement doit être ajusté ?");

	return lines.join('\n');
}
