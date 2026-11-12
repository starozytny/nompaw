import { isoAdd, todayISO } from "@userPages/Running/Suivi/lib/format";

export const effort10k = r => r.sec * Math.pow(10 / r.km, 1.06)

export function bestEffort (activities, minKm, maxKm, sinceISO) {
	let best = null
	activities.forEach(r => {
		if (r.km < minKm || r.km > maxKm || !r.sec) return
		if (sinceISO && r.d < sinceISO) return
		if (!best || r.sec / r.km < best.sec / best.km) best = r
	})
	return best
}

export function bestRecentOverall (activities) {
	const since = isoAdd(todayISO(), -240)
	let best = null
	activities.forEach(r => {
		if (r.d < since || r.km < 4.8 || r.km > 22 || !r.sec) return
		if (!best || effort10k(r) < effort10k(best)) best = r
	})
	return best
}
