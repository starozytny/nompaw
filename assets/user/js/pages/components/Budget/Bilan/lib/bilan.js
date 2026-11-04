import Sanitaze from "@commonFunctions/sanitaze";

import { monthFr, dateFr } from "@userPages/Budget/Bilan/lib/format";

const eur = (v) => Sanitaze.toFormatCurrency(v || 0);

/**
 * Sums item prices by category for one TypeType value (0=Expense, 1=Income, 2=Saving), across every
 * month of the year's `donnees` — the same grouping PlanningTab uses for the current month's donut,
 * just not restricted to a single month.
 */
function categoryBreakdown (donnees, type) {
	const byCategory = new Map();
	donnees.forEach(item => {
		if (item.type !== type) return;
		const key = item.category ? item.category.id : 'none';
		const name = item.category ? item.category.name : 'Sans catégorie';
		const row = byCategory.get(key) || { name, total: 0 };
		row.total += item.price;
		byCategory.set(key, row);
	});
	return Array.from(byCategory.values()).sort((a, b) => b.total - a.total);
}

/**
 * A recurrence's `months`/`initYear`/`initMonth` describe its full schedule, not just this year — this
 * narrows it to the months of `year` where it's actually due, same eligibility rule as
 * BudgetService::computeMonthlySummaries (but only keeping it, not accounting for a since-cancelled
 * or replaced instance: this is the planned schedule, not the realized total already shown per month).
 */
export function activeMonthsThisYear (recurrence, year) {
	return recurrence.months.filter(m => year > recurrence.initYear || m >= recurrence.initMonth);
}

/**
 * @param tracking shape of GET /intern/api/budget/planning/{year}
 */
export function makeBilan (tracking) {
	const { year, monthlySummaries, savingsSummaries, recurrences, donnees } = tracking;

	const totals = monthlySummaries.reduce((acc, m) => ({
		expense: acc.expense + m.totalExpenseReal,
		income: acc.income + m.totalIncomeReal,
		saving: acc.saving + m.totalSavingReal,
	}), { expense: 0, income: 0, saving: 0 });

	const lastMonth = monthlySummaries[monthlySummaries.length - 1];

	const lines = [];
	lines.push(`BILAN BUDGET — année ${year}`);
	lines.push(`Revenus réels : ${eur(totals.income)} · Dépenses réelles : ${eur(totals.expense)} · Économies réelles : ${eur(totals.saving)}`);
	lines.push(`Solde net sur l'année (revenus − dépenses − économies) : ${eur(totals.income - totals.expense - totals.saving)}`);
	lines.push(`Solde disponible en fin d'année : ${eur(lastMonth.totalDispo)}`);

	lines.push('');
	lines.push('Par mois (réel — dépenses / revenus / économies, puis solde de fin de mois) :');
	monthlySummaries.forEach(m => {
		lines.push(`  ${monthFr(m.month)} : dépenses ${eur(m.totalExpenseReal)} · revenus ${eur(m.totalIncomeReal)} · économies ${eur(m.totalSavingReal)} · solde ${eur(m.totalDispo)}`);
	});

	const eligibleRecurrences = recurrences.filter(r => year >= r.initYear);
	if (eligibleRecurrences.length) {
		lines.push('');
		lines.push('Récurrences actives cette année (prévu, avant annulations/remplacements ponctuels) :');
		eligibleRecurrences.forEach(r => {
			const activeMonths = activeMonthsThisYear(r, year);
			const monthsLabel = activeMonths.length === 12 ? 'tous les mois' : activeMonths.map(monthFr).join(', ');
			lines.push(`  - ${r.name} (${r.typeString}${r.category ? ', ' + r.category.name : ''}) : ${eur(r.price)}/mois — ${monthsLabel} (${activeMonths.length} fois, total ${eur(r.price * activeMonths.length)})`);
		});
	}

	const expenses = categoryBreakdown(donnees, 0);
	if (expenses.length) {
		lines.push('');
		lines.push('Dépenses par catégorie (année, triées par montant) :');
		expenses.forEach(c => lines.push(`  - ${c.name} : ${eur(c.total)}`));
	}

	const incomes = categoryBreakdown(donnees, 1);
	if (incomes.length) {
		lines.push('');
		lines.push('Revenus par catégorie (année) :');
		incomes.forEach(c => lines.push(`  - ${c.name} : ${eur(c.total)}`));
	}

	if (savingsSummaries.length) {
		lines.push('');
		lines.push("Épargnes (cumul toutes années confondues, à fin décembre) :");
		savingsSummaries.forEach(s => {
			const available = s.totalByMonth[11] - s.usedByMonth[11];
			const progress = s.goal ? (available / s.goal) * 100 : null;
			lines.push(`  - ${s.name} : disponible ${eur(available)}${s.goal ? ` / objectif ${eur(s.goal)} (${progress.toFixed(0)} %)` : ''}${s.goalDate ? `, échéance ${dateFr(s.goalDate)}` : ''}`);
		});
	}

	lines.push('');
	lines.push("Peux-tu analyser ce bilan annuel (tendance du solde, postes de dépenses, rythme d'épargne par rapport aux objectifs) et me dire si le budget doit être ajusté ?");

	return lines.join('\n');
}
