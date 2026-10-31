const KEY = 'detailMode'

export function getDetailMode () {
	try { return localStorage.getItem(KEY) || 'full' } catch (e) { return 'full' }
}

export function storeDetailMode (mode) {
	try { localStorage.setItem(KEY, mode) } catch (e) {}
}

export function liteText (ph) {
	if (ph.lite) return ph.lite
	const t = String(ph.desc).replace(/<[^>]+>/g, '')
	const m = t.match(/^[^.!?]*[.!?]/)
	const first = m ? m[0] : t
	return first.length > 140 ? first.slice(0, 137) + '…' : first
}
