import React, { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";

import { Trades } from "@userPages/Cryptos/Trades/Trades";
import { HoldingsTab } from "@userPages/Cryptos/Holdings/HoldingsTab";
import { TaxReportTab } from "@userPages/Cryptos/TaxReport/TaxReportTab";
import { ForeignAccountsTab } from "@userPages/Cryptos/ForeignAccounts/ForeignAccountsTab";
import { ImportTab } from "@userPages/Cryptos/Import/ImportTab";

export default function Cryptos (props) {
	const [activeTab, setActiveTab] = useState('trades');
	// Bumped after a successful import/sync so the other tabs (kept mounted via forceMount once
	// visited, and each fetching only on mount) refetch instead of showing stale data until a page
	// reload. Passed as a prop (not a `key`) so the tabs refetch in place rather than remount —
	// remounting would also reset TradesList's accordion open/closed state.
	const [dataVersion, setDataVersion] = useState(0);
	// Tabs mount lazily on first visit instead of all 4 up front: each tab fires its own full,
	// unfiltered fetch (+ a client-side replay of the whole trade list) on mount, so mounting all of
	// them immediately was quadrupling load-time work for tabs the user hadn't even opened yet. Once
	// visited a tab stays mounted (via forceMount + a hidden class) so switching back preserves its
	// state instead of refetching/re-rendering from scratch.
	const [visitedTabs, setVisitedTabs] = useState(() => new Set(['trades']));

	const handleTabChange = (value) => {
		setActiveTab(value);
		setVisitedTabs(prev => prev.has(value) ? prev : new Set(prev).add(value));
	}

	const handleDataChanged = () => setDataVersion(v => v + 1);

	return <Tabs value={activeTab} onValueChange={handleTabChange} className="flex flex-col gap-1">
		<TabsList className="self-start">
			<TabsTrigger value="trades">Transactions</TabsTrigger>
			<TabsTrigger value="holdings">Cryptos restantes</TabsTrigger>
			<TabsTrigger value="tax-report">Rapport fiscal</TabsTrigger>
			<TabsTrigger value="foreign-accounts">Comptes (3916)</TabsTrigger>
			<TabsTrigger value="import">Importer</TabsTrigger>
		</TabsList>

		{visitedTabs.has('trades') && <TabsContent value="trades" forceMount className={activeTab === 'trades' ? '' : 'hidden'}>
			<Trades refreshSignal={dataVersion} {...props} />
		</TabsContent>}
		{visitedTabs.has('holdings') && <TabsContent value="holdings" forceMount className={activeTab === 'holdings' ? '' : 'hidden'}>
			<HoldingsTab refreshSignal={dataVersion} />
		</TabsContent>}
		{visitedTabs.has('tax-report') && <TabsContent value="tax-report" forceMount className={activeTab === 'tax-report' ? '' : 'hidden'}>
			<TaxReportTab refreshSignal={dataVersion} />
		</TabsContent>}
		{visitedTabs.has('foreign-accounts') && <TabsContent value="foreign-accounts" forceMount className={activeTab === 'foreign-accounts' ? '' : 'hidden'}>
			<ForeignAccountsTab />
		</TabsContent>}
		{visitedTabs.has('import') && <TabsContent value="import" forceMount className={activeTab === 'import' ? '' : 'hidden'}>
			<ImportTab onImported={handleDataChanged} />
		</TabsContent>}
	</Tabs>
}
