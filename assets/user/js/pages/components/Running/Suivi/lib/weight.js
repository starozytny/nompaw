const W_START = ['2026-10-30', 90]
const W_TARGETS = [W_START, ['2026-12-31', 88], ['2027-03-14', 85.5], ['2027-05-15', 84], ['2027-09-05', 81], ['2027-10-10', 80]]

export const START_WEIGHT_KG = W_START[1]

export const MILESTONES = [
	{ date: '30 oct 2026', kg: '90 kg', note: 'Départ' },
	{ date: '31 déc 2026', kg: '88 kg', note: 'Après le trail du 29 nov' },
	{ date: '14 mars 2027', kg: '85,5 kg', note: 'Semi (2h10)' },
	{ date: '15 mai 2027', kg: '84 kg', note: 'Trail 28 km' },
	{ date: '5 sept 2027', kg: '81 kg', note: 'Test 10 km intermédiaire' },
	{ date: '10 oct 2027', kg: '80 kg', note: 'Semi de Salon', highlight: true },
]

export function weightTarget (iso) {
	const t = Date.parse(iso)
	for (let i = 1; i < W_TARGETS.length; i++) {
		const a = W_TARGETS[i - 1], b = W_TARGETS[i], ta = Date.parse(a[0]), tb = Date.parse(b[0])
		if (t <= tb) return t <= ta ? a[1] : a[1] + (b[1] - a[1]) * (t - ta) / (tb - ta)
	}
	return 80
}

export function lastWeight (weights) {
	const w = weights.slice().sort((a, b) => a.d < b.d ? -1 : 1)
	return w.length ? w[w.length - 1] : null
}
