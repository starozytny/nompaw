// Same hex pair as --status-critical/--status-good (light mode) in app.scss, interpolated in JS
// since a CSS custom property can't be blended directly without extra calc() machinery.
const RED = [208, 59, 59];
const GREEN = [12, 163, 12];

const lerp = (a, b, t) => Math.round(a + (b - a) * t);

/**
 * Red above the starting weight (90 kg), fading from red to green as the current weight approaches
 * the 80 kg objective (green at 80 kg or below) — a quick visual read of "on track" vs "off track"
 * for the weight-loss plan, independent of the more precise date-adjusted palier used in WeightTracker.
 */
export function weightProgressColor (kg, { from = 90, to = 80 } = {}) {
	if (kg == null) return { color: 'hsl(var(--muted-foreground))', soft: 'hsl(var(--muted))' };
	if (kg > from) return { color: 'var(--status-critical)', soft: 'var(--status-critical-soft)' };

	const t = Math.min(1, Math.max(0, (from - kg) / (from - to)));
	const [r, g, b] = [lerp(RED[0], GREEN[0], t), lerp(RED[1], GREEN[1], t), lerp(RED[2], GREEN[2], t)];

	return { color: `rgb(${r}, ${g}, ${b})`, soft: `rgba(${r}, ${g}, ${b}, 0.12)` };
}
