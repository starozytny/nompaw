import React, { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";

import { Trades } from "@userPages/Cryptos/Trades/Trades";
import { HoldingsTab } from "@userPages/Cryptos/Holdings/HoldingsTab";
import { TaxReportTab } from "@userPages/Cryptos/TaxReport/TaxReportTab";
import { ImportTab } from "@userPages/Cryptos/Import/ImportTab";

export default function Cryptos (props) {
	const [activeTab, setActiveTab] = useState('trades');
	// Bumped after a successful import/sync so the other tabs (kept mounted via forceMount, and each
	// fetching only on mount) refetch instead of showing stale data until a page reload. Passed as a
	// prop (not a `key`) so the tabs refetch in place rather than remount — remounting would also reset
	// TradesList's accordion open/closed state.
	const [dataVersion, setDataVersion] = useState(0);

	const handleDataChanged = () => setDataVersion(v => v + 1);

	return <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-1">
		<TabsList className="self-start">
			<TabsTrigger value="trades">Transactions</TabsTrigger>
			<TabsTrigger value="holdings">Cryptos restantes</TabsTrigger>
			<TabsTrigger value="tax-report">Rapport fiscal</TabsTrigger>
			<TabsTrigger value="import">Importer</TabsTrigger>
		</TabsList>

		<TabsContent value="trades" forceMount className={activeTab === 'trades' ? '' : 'hidden'}>
			<Trades refreshSignal={dataVersion} {...props} />
		</TabsContent>
		<TabsContent value="holdings" forceMount className={activeTab === 'holdings' ? '' : 'hidden'}>
			<HoldingsTab refreshSignal={dataVersion} />
		</TabsContent>
		<TabsContent value="tax-report" forceMount className={activeTab === 'tax-report' ? '' : 'hidden'}>
			<TaxReportTab refreshSignal={dataVersion} />
		</TabsContent>
		<TabsContent value="import" forceMount className={activeTab === 'import' ? '' : 'hidden'}>
			<ImportTab onImported={handleDataChanged} />
		</TabsContent>
	</Tabs>
}
