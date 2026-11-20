import React, { useEffect, useRef, useState } from 'react';

import { Badge } from "@shadcnComponents/ui/badge";

import { RUN_TYPES } from "@userPages/Running/Suivi/lib/stats";
import { fmtPace, parseDur } from "@userPages/Running/Suivi/lib/format";

const RPE_LABELS = { 1: 'très facile', 3: 'facile', 5: 'modéré', 7: 'dur', 9: 'très dur', 10: 'maximal' };

const inputClass = "w-full px-2.5 py-1.5 border rounded-md text-sm font-normal normal-case tracking-normal bg-white";
const labelClass = "flex flex-col gap-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground";

function toForm (entry) {
	return {
		km: entry.km ?? '', dur: entry.dur ?? '', hr: entry.hr ?? '', hrMax: entry.hrmax ?? '',
		rpe: entry.rpe ?? '', note: entry.note ?? '', done: !!entry.done,
	};
}

/**
 * The day-detail "Suivi de la séance" panel — manual entry/pointage of a day's actual run, saved to
 * RuLog via onSave(iso, fields). Kept with a short-lived local buffer (text/number inputs save on blur,
 * checkbox/select save immediately) so typing doesn't wait on a network round-trip per keystroke.
 */
export function TrackingPanel ({ day, entry, onSave }) {
	const [form, setForm] = useState(() => toForm(entry));
	const formRef = useRef(form);

	// `done` can flip server-side as a side effect of saving km (see DataRunning::setDataLog) — keep the
	// checkbox in sync with the refreshed entry without clobbering the rest of the in-progress local form.
	useEffect(() => {
		if (!!entry.done !== formRef.current.done) {
			const next = { ...formRef.current, done: !!entry.done };
			formRef.current = next;
			setForm(next);
		}
	}, [entry.done]);

	if (!day.iso || day.type === 'rest') return null;

	const isRun = RUN_TYPES.includes(day.type) || !!entry.km;

	const update = (patch) => {
		const next = { ...formRef.current, ...patch };
		formRef.current = next;
		setForm(next);
	};

	const commit = (patch) => {
		const next = patch ? { ...formRef.current, ...patch } : formRef.current;
		formRef.current = next;
		setForm(next);
		onSave(day.iso, {
			km: next.km === '' ? null : parseFloat(String(next.km).replace(',', '.')),
			durationSec: parseDur(next.dur),
			hr: next.hr === '' ? null : parseInt(next.hr, 10),
			hrMax: next.hrMax === '' ? null : parseInt(next.hrMax, 10),
			rpe: next.rpe === '' ? null : parseInt(next.rpe, 10),
			note: next.note,
			done: next.done,
		});
	};

	const pace = form.km && form.dur ? fmtPace(parseFloat(String(form.km).replace(',', '.')), parseDur(form.dur)) : null;

	return <div className="mt-2 p-4 border rounded-lg bg-muted/30 flex flex-col gap-3">
		<div className="font-semibold text-sm text-muted-foreground">📝 Suivi de la séance</div>

		<label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
			<input type="checkbox" checked={form.done} onChange={e => commit({ done: e.target.checked })} />
			Séance faite
			{entry.src === 'garmin' && <Badge variant="outline" className="bg-sky-50 text-sky-700">importée de Garmin</Badge>}
		</label>

		{isRun && <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(130px,1fr))]">
			<label className={labelClass}>Distance (km)
				<input type="number" step="0.01" min="0" className={inputClass} value={form.km}
					   onChange={e => update({ km: e.target.value })} onBlur={() => commit()} />
			</label>
			<label className={labelClass}>Durée (h:mm:ss)
				<input type="text" placeholder="1:02:30" className={inputClass} value={form.dur}
					   onChange={e => update({ dur: e.target.value })} onBlur={() => commit()} />
			</label>
			<label className={labelClass}>FC moyenne
				<input type="number" min="0" className={inputClass} value={form.hr}
					   onChange={e => update({ hr: e.target.value })} onBlur={() => commit()} />
			</label>
			<label className={labelClass}>FC max
				<input type="number" min="0" className={inputClass} value={form.hrMax}
					   onChange={e => update({ hrMax: e.target.value })} onBlur={() => commit()} />
			</label>
			<label className={labelClass}>Ressenti (1–10)
				<select className={inputClass} value={form.rpe} onChange={e => commit({ rpe: e.target.value })}>
					<option value="">—</option>
					{Array.from({ length: 10 }, (_, i) => i + 1).map(n => <option key={n} value={n}>{n}{RPE_LABELS[n] ? ' · ' + RPE_LABELS[n] : ''}</option>)}
				</select>
			</label>
			<div className={labelClass}>Allure
				<div className="font-bold text-primary text-sm normal-case tracking-normal pt-1">{pace ? pace + ' /km' : '—'}</div>
			</div>
		</div>}

		<label className={labelClass}>Note (sensations, douleurs…)
			<textarea rows={2} className={inputClass} value={form.note}
					  onChange={e => update({ note: e.target.value })} onBlur={() => commit()} />
		</label>
	</div>
}
