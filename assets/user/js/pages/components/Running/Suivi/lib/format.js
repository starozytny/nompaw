const MOIS_C = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']

export const pad2 = n => String(n).padStart(2, '0')

export const fr1 = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',')

export const todayISO = () => {
	const d = new Date()
	return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export const isoAdd = (iso, n) => {
	const [y, m, d] = iso.split('-').map(Number)
	return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export const isoFr = iso => {
	const [y, m, d] = iso.split('-').map(Number)
	return `${d} ${MOIS_C[m - 1]}${y !== new Date().getFullYear() ? ' ' + y : ''}`
}

export const parseDur = s => {
	if (s == null || s === '' || s === '--') return null
	const p = String(s).trim().split(':').map(Number)
	if (p.some(isNaN)) return null
	if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]
	if (p.length === 2) return p[0] * 60 + p[1]
	return null
}

export const fmtDur = sec => {
	if (sec == null || isNaN(sec)) return ''
	sec = Math.round(sec)
	const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60
	return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`
}

export const fmtPace = (km, sec) => {
	if (!km || !sec) return ''
	const t = Math.round(sec / km)
	return `${Math.floor(t / 60)}:${pad2(t % 60)}`
}

export { MOIS_C }
