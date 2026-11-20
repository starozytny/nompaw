import { isoAdd, parseDur, todayISO } from "@userPages/Running/Suivi/lib/format";

export const RUN_TYPES = ['z2', 'vma', 'seuil', 'long', 'race']

export const weekPlannedKm = week => {
	const m = String(week.volume).match(/(\d+)/)
	return m ? +m[1] : 0
}

/**
 * @param week one entry of WEEKS (Plan/weeks.js)
 * @param log the tracking log, keyed by ISO date — same shape as GET /intern/api/running/tracking's `log`
 */
export function weekStats (week, log) {
	let km = 0, sec = 0, hrw = 0, hrsec = 0, rpeS = 0, rpeN = 0, planned = 0, done = 0
	const today = todayISO()

	week.days.forEach(d => {
		if (RUN_TYPES.includes(d.type)) {
			if (d.iso <= today) planned++
			if (log[d.iso] && log[d.iso].done) done++
		}
	})

	for (let i = 0; i < 7; i++) {
		const e = log[isoAdd(week.iso0, i)]
		if (!e) continue
		if (e.km) {
			km += e.km
			const s = parseDur(e.dur) || 0
			sec += s
			if (e.hr && s) { hrw += e.hr * s; hrsec += s }
		}
		if (e.rpe) { rpeS += e.rpe; rpeN++ }
	}

	return { km, sec, hr: hrsec ? hrw / hrsec : null, rpe: rpeN ? rpeS / rpeN : null, planned, done, plannedKm: weekPlannedKm(week) }
}
