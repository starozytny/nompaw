import { WEEKS, LV } from "@userPages/Running/Plan/weeks";
import { RUN_TYPES, weekStats } from "@userPages/Running/Suivi/lib/stats";
import { bestRecentOverall, effort10k } from "@userPages/Running/Suivi/lib/history";
import { lastWeight, weightTarget } from "@userPages/Running/Suivi/lib/weight";
import { fr1, fmtDur, fmtPace, isoAdd, isoFr, parseDur, todayISO } from "@userPages/Running/Suivi/lib/format";

/**
 * @param scope '1w' | '4w' | 'all'
 * @param tracking { log, activities, weights, notes } — same shape as GET /intern/api/running/tracking
 */
export function makeBilan (scope, { log, activities, weights, notes }) {
	const today = todayISO()
	const started = WEEKS.filter(w => w.iso0 <= today)
	if (!started.length) return "Le plan n'a pas encore commencé."

	const sel = scope === 'all' ? started : scope === '4w' ? started.slice(-4) : started.slice(-1)
	const lines = []
	const first = sel[0], last = sel[sel.length - 1]

	lines.push(`BILAN D'ENTRAÎNEMENT — du ${isoFr(first.iso0)} au ${isoFr(isoAdd(last.iso0, 6))} (généré le ${isoFr(today)})`)
	lines.push(`Objectif : ${last.phase === 'p6' ? 'semi de Salon du 10 oct 2027, sub-2h visé (5:40/km), plan B 2h05–2h10' : last.phase === 'p5' ? 'trail 28 km (D+ 1000) du 15 mai 2027' : 'semi du 14 mars 2027 en 2h10 (6:09/km)'}. Ligne d'allure du plan : ${LV[last.lvl || 0][0]} (EF ${LV[last.lvl || 0][1]}, seuil ${LV[last.lvl || 0][2]}, intervalles ${LV[last.lvl || 0][3]}, allure semi ${LV[last.lvl || 0][4]}). FC max observée ≈ 205, FC de seuil estimée ≈ 180.`)

	let totKm = 0, totPlan = 0, totDone = 0, totPlanned = 0
	sel.forEach(w => {
		const s = weekStats(w, log)
		totKm += s.km; totPlan += s.plannedKm; totDone += s.done; totPlanned += s.planned
		lines.push('')
		lines.push(`Semaine ${w.n} (${w.dates}) — ${w.label}`)
		lines.push(`  Prévu ≈ ${s.plannedKm} km · réalisé ${fr1(s.km)} km · courses faites ${s.done}/${s.planned}${s.km && s.sec ? ` · allure moyenne ${fmtPace(s.km, s.sec)} /km` : ''}${s.hr ? ` · FC moyenne ${Math.round(s.hr)}` : ''}${s.rpe != null ? ` · ressenti moyen ${fr1(s.rpe)}/10` : ''}`)

		const planDates = new Set(w.days.map(d => d.iso))
		w.days.forEach(d => {
			const e = log[d.iso]
			const isRun = RUN_TYPES.includes(d.type)
			if (!isRun && !(e && (e.done || e.note))) return
			let r
			if (e && e.done) {
				r = e.km ? `${fr1(e.km).replace(',0', '')} km${e.dur ? ' en ' + e.dur : ''}${e.km && e.dur ? ' (' + fmtPace(e.km, parseDur(e.dur)) + '/km)' : ''}${e.hr ? ', FC ' + e.hr + (e.hrmax ? '/' + e.hrmax : '') : ''}` : 'fait'
				if (e.rpe) r += `, ressenti ${e.rpe}/10`
				if (e.note) r += ` — « ${e.note} »`
			} else if (d.iso < today) r = 'non fait' + (e && e.note ? ` — « ${e.note} »` : '')
			else r = 'à venir'
			lines.push(`  - ${d.date} · prévu : ${d.short} → ${r}`)
		})

		for (let i = 0; i < 7; i++) {
			const iso = isoAdd(w.iso0, i), e = log[iso]
			if (e && e.km && !planDates.has(iso)) lines.push(`  - ${isoFr(iso)} · hors plan → ${fr1(e.km)} km${e.dur ? ' en ' + e.dur : ''}${e.hr ? ', FC ' + e.hr : ''}${e.note ? ` — « ${e.note} »` : ''}`)
		}
	})

	lines.push('')
	lines.push(`Total période : ${fr1(totKm)} km réalisés pour ≈ ${totPlan} km prévus · courses faites ${totDone}/${totPlanned}.`)

	const recent = activities.filter(r => r.d >= isoAdd(today, -90))
	if (recent.length) lines.push(`Contexte (90 derniers jours, import Garmin) : ${recent.length} sorties, ${fr1(recent.reduce((a, r) => a + r.km, 0))} km.`)

	const b = bestRecentOverall(activities)
	if (b) lines.push(`Meilleur effort récent : ${fr1(b.km)} km en ${fmtDur(b.sec)} (${isoFr(b.d)}) → 10 km équivalent ≈ ${fmtDur(effort10k(b))}.`)

	const lw = lastWeight(weights)
	if (lw) lines.push(`Poids : ${fr1(lw.kg)} kg le ${isoFr(lw.d)} (palier du jour ${fr1(weightTarget(lw.d))} kg, objectif 80 kg).`)

	if (notes && notes.trim()) { lines.push(''); lines.push('Sensations / douleurs / sommeil : ' + notes.trim()) }

	lines.push('')
	lines.push("Peux-tu analyser ce bilan, vérifier que les allures et le volume sont adaptés, et ajuster les semaines à venir si besoin ?")

	return lines.join('\n')
}
