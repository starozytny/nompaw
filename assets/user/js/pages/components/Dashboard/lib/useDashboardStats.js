import { useEffect, useState } from 'react';

import axios from 'axios';
import Routing from '@publicFolder/bundles/fosjsrouting/js/router.min.js';

/**
 * Pulls just enough from each module's own (already existing) endpoint to fill the dashboard's stat
 * row and charts — no dedicated backend aggregation, so each number stays exactly as correct as its
 * own module.
 */
export function useDashboardStats ({ hasInvest, hasRunning }) {
	const [budget, setBudget] = useState(null);
	const [invest, setInvest] = useState(null);
	const [crypto, setCrypto] = useState(null);
	const [runningLog, setRunningLog] = useState(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		// Without Invest or Running, the dashboard shows none of this (see Dashboard.jsx's
		// showDashboardData) — skip the fetches entirely rather than loading data nobody will see.
		if (!hasInvest && !hasRunning) {
			setLoading(false);
			return;
		}

		const year = new Date().getFullYear();
		const requests = [
			axios.get(Routing.generate('intern_api_budget_planning_index', { year })),
			axios.get(Routing.generate('intern_api_cryptos_trades_holdings')),
		];
		if (hasInvest) requests.push(axios.get(Routing.generate('intern_api_invest_tracking')));
		if (hasRunning) requests.push(axios.get(Routing.generate('intern_api_running_tracking')));

		Promise.all(requests)
			.then(([budgetRes, cryptoRes, ...rest]) => {
				const month = parseInt(budgetRes.data.month, 10);
				setBudget({
					month,
					summary: budgetRes.data.monthlySummaries[month - 1],
					monthlyBalances: budgetRes.data.monthlyBalances,
				});
				setCrypto(cryptoRes.data);

				if (hasInvest) setInvest(rest.shift().data);
				if (hasRunning) setRunningLog(rest.shift().data.log);
			})
			.finally(() => setLoading(false));
	}, [hasInvest, hasRunning]);

	return { budget, invest, crypto, runningLog, loading };
}
