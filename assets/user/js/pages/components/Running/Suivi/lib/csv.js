import { parseDur } from "@userPages/Running/Suivi/lib/format";

export function parseCSV (text) {
	text = text.replace(/^﻿/, '')
	const first = text.split('\n')[0] || ''
	const delim = (first.match(/;/g) || []).length > (first.match(/,/g) || []).length ? ';' : ','
	const rows = []
	let row = [], cur = '', q = false
	for (let i = 0; i < text.length; i++) {
		const c = text[i]
		if (q) {
			if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++ } else q = false }
			else cur += c
		} else if (c === '"') q = true
		else if (c === delim) { row.push(cur); cur = '' }
		else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = '' }
		else if (c !== '\r') cur += c
	}
	if (cur !== '' || row.length) { row.push(cur); rows.push(row) }
	return rows
}

/**
 * Parses a Garmin Connect "export activities as CSV" file into a flat list of runs, ready to POST to
 * /intern/api/running/import. Only parsing happens here — the merge into history/plan is server-side
 * (RunningImportService) so every device converges on the same result.
 */
export function buildRunsFromCsv (text) {
	const rows = parseCSV(text)
	if (rows.length < 2) return { error: 'Fichier vide ou illisible.' }

	const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
	const head = rows[0].map(norm)
	const col = names => { for (const n of names) { const i = head.indexOf(n); if (i >= 0) return i } return -1 }
	const c = {
		type: col(["type d'activite", 'activity type']), date: col(['date']), title: col(['titre', 'title']),
		km: col(['distance']), dur: col(['duree', 'time', 'temps']),
		hr: col(['frequence cardiaque moyenne', 'avg hr', 'fc moyenne']), hrmax: col(['frequence cardiaque maximale', 'max hr', 'fc max']),
	}
	if (c.date < 0 || c.km < 0 || c.dur < 0) {
		return { error: "Colonnes Date, Distance ou Durée introuvables : exporte le CSV depuis Garmin Connect (Activités → Exporter en CSV)." }
	}

	const num = v => {
		if (v == null) return null
		v = String(v).replace(/\s/g, '').replace(',', '.')
		if (v === '' || v === '--') return null
		const n = parseFloat(v)
		return isNaN(n) ? null : n
	}

	const runs = []
	for (let i = 1; i < rows.length; i++) {
		const r = rows[i]
		if (r.length < 3) continue
		if (c.type >= 0 && !/^(course|trail|running|trail running)/.test(norm(r[c.type]))) continue
		let d = String(r[c.date]).trim().slice(0, 10)
		const fr = d.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
		if (fr) d = `${fr[3]}-${fr[2]}-${fr[1]}`
		if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue
		const km = num(r[c.km]), sec = parseDur(r[c.dur])
		if (!km || !sec) continue
		runs.push({
			d, km: Math.round(km * 100) / 100, sec,
			hr: c.hr >= 0 ? num(r[c.hr]) : null,
			hrmax: c.hrmax >= 0 ? num(r[c.hrmax]) : null,
			title: c.title >= 0 ? String(r[c.title]).slice(0, 60) : '',
		})
	}
	if (!runs.length) return { error: 'Aucune course à pied trouvée dans ce fichier.' }
	return { runs }
}
