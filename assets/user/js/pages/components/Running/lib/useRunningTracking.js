import { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

const URL_TRACKING = 'intern_api_running_tracking';
const URL_LOG_SAVE = 'intern_api_running_log_save';
const URL_IMPORT = 'intern_api_running_import';
const URL_GARMIN_SYNC = 'intern_api_running_garmin_sync';
const URL_WEIGHTS_SAVE = 'intern_api_running_weights_save';
const URL_WEIGHTS_DELETE = 'intern_api_running_weights_delete';
const URL_NOTES_SAVE = 'intern_api_running_notes_save';
const URL_BACKUP_RESTORE = 'intern_api_running_backup_restore';
const URL_RESET = 'intern_api_running_reset';

const EMPTY = { log: {}, activities: [], weights: [], notes: '' };

/**
 * Loads the Running tracking data (log/activities/weights/notes) once and keeps it in sync across the
 * Plan, Suivi and Poids tabs — replaces the original's localStorage `store`, now backed by the DB so the
 * same data shows on every device.
 */
export function useRunningTracking () {
	const [tracking, setTracking] = useState(EMPTY);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(() => {
		return axios.get(Routing.generate(URL_TRACKING)).then(res => { setTracking(res.data); return res.data; });
	}, []);

	useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);

	const saveLog = useCallback((date, fields) => {
		return axios.post(Routing.generate(URL_LOG_SAVE), { date, ...fields }).then(refresh);
	}, [refresh]);

	const importRuns = useCallback((runs, rangeStart, rangeEnd) => {
		return axios.post(Routing.generate(URL_IMPORT), { runs, rangeStart, rangeEnd })
			.then(res => { setTracking(res.data.tracking); return res.data; });
	}, []);

	const syncGarmin = useCallback(() => {
		return axios.post(Routing.generate(URL_GARMIN_SYNC))
			.then(res => { setTracking(res.data.tracking); return res.data; });
	}, []);

	const saveWeight = useCallback((date, kg) => {
		return axios.post(Routing.generate(URL_WEIGHTS_SAVE), { date, kg }).then(refresh);
	}, [refresh]);

	const deleteWeight = useCallback((id) => {
		return axios.delete(Routing.generate(URL_WEIGHTS_DELETE, { id })).then(refresh);
	}, [refresh]);

	const saveNotes = useCallback((notes) => {
		setTracking(t => ({ ...t, notes }));
		return axios.put(Routing.generate(URL_NOTES_SAVE), { notes });
	}, []);

	const restoreBackup = useCallback((backup) => {
		return axios.post(Routing.generate(URL_BACKUP_RESTORE), backup).then(res => { setTracking(res.data); return res.data; });
	}, []);

	const reset = useCallback(() => {
		return axios.delete(Routing.generate(URL_RESET)).then(refresh);
	}, [refresh]);

	return { tracking, loading, refresh, saveLog, importRuns, syncGarmin, saveWeight, deleteWeight, saveNotes, restoreBackup, reset };
}
