import { useCallback, useEffect, useState } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

const URL_TRACKING = 'intern_api_invest_tracking';
const URL_ENVELOPPE_SAVE = 'intern_api_invest_enveloppe_save';
const URL_ENVELOPPE_DELETE = 'intern_api_invest_enveloppe_delete';
const URL_LINE_SAVE = 'intern_api_invest_line_save';
const URL_LINE_DELETE = 'intern_api_invest_line_delete';
const URL_SNAPSHOT_SAVE = 'intern_api_invest_snapshot_save';
const URL_SNAPSHOT_DELETE = 'intern_api_invest_snapshot_delete';

const EMPTY = { enveloppes: [], buCategories: [], contributions: [] };

/**
 * Loads the Invest tracking data (enveloppes/lignes/snapshots + linked Budget contributions) once and
 * keeps it in sync across tabs, same shape/role as useRunningTracking for the Running module.
 */
export function useInvestTracking () {
	const [tracking, setTracking] = useState(EMPTY);
	const [loading, setLoading] = useState(true);

	const refresh = useCallback(() => {
		return axios.get(Routing.generate(URL_TRACKING)).then(res => { setTracking(res.data); return res.data; });
	}, []);

	useEffect(() => { refresh().finally(() => setLoading(false)); }, [refresh]);

	const saveEnveloppe = useCallback((enveloppe) => {
		return axios.post(Routing.generate(URL_ENVELOPPE_SAVE), enveloppe).then(res => refresh().then(() => res.data));
	}, [refresh]);

	const deleteEnveloppe = useCallback((id) => {
		return axios.delete(Routing.generate(URL_ENVELOPPE_DELETE, { id })).then(refresh);
	}, [refresh]);

	const saveLine = useCallback((line) => {
		return axios.post(Routing.generate(URL_LINE_SAVE), line).then(res => refresh().then(() => res.data));
	}, [refresh]);

	const deleteLine = useCallback((id) => {
		return axios.delete(Routing.generate(URL_LINE_DELETE, { id })).then(refresh);
	}, [refresh]);

	const saveSnapshot = useCallback((lineId, date, value) => {
		return axios.post(Routing.generate(URL_SNAPSHOT_SAVE), { lineId, date, value }).then(refresh);
	}, [refresh]);

	const deleteSnapshot = useCallback((id) => {
		return axios.delete(Routing.generate(URL_SNAPSHOT_DELETE, { id })).then(refresh);
	}, [refresh]);

	return {
		tracking, loading, refresh,
		saveEnveloppe, deleteEnveloppe,
		saveLine, deleteLine,
		saveSnapshot, deleteSnapshot,
	};
}
