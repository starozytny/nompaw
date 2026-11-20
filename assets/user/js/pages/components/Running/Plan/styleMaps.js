export const DAY_TYPE_STYLES = {
	z2: { bg: 'bg-sky-50', text: 'text-sky-700' },
	vma: { bg: 'bg-violet-50', text: 'text-violet-700' },
	seuil: { bg: 'bg-pink-50', text: 'text-pink-700' },
	long: { bg: 'bg-sky-50', text: 'text-sky-700' },
	muscu: { bg: 'bg-orange-50', text: 'text-orange-700' },
	pilates: { bg: 'bg-muted', text: 'text-muted-foreground' },
	race: { bg: 'bg-amber-50', text: 'text-amber-700' },
	rest: { bg: 'bg-muted/60', text: 'text-muted-foreground' },
	activation: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
}

export const PHASE_BLOCK_STYLES = {
	warmup: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-500' },
	main: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-500' },
	interval: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-500' },
	recovery: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-500' },
	cooldown: { bg: 'bg-muted', text: 'text-muted-foreground', border: 'border-muted-foreground/30' },
}

export function dayTypeStyle (type) {
	return DAY_TYPE_STYLES[type] || { bg: 'bg-muted', text: 'text-muted-foreground' }
}

export function phaseBlockStyle (color) {
	return PHASE_BLOCK_STYLES[color] || PHASE_BLOCK_STYLES.cooldown
}

export function chargeIndicatorClass (charge) {
	if (charge >= 80) return 'bg-red-600'
	if (charge >= 60) return 'bg-orange-500'
	if (charge >= 40) return 'bg-amber-500'
	return 'bg-emerald-600'
}

export function zoneBadgeClass (zone) {
	if (zone.includes('Z5')) return 'bg-violet-50 text-violet-700'
	if (zone.includes('Z4')) return 'bg-pink-50 text-pink-700'
	if (zone.includes('Z3')) return 'bg-amber-50 text-amber-700'
	if (zone.includes('Z2')) return 'bg-sky-50 text-sky-700'
	return 'bg-emerald-50 text-emerald-700'
}
