import React, { useState } from "react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";

import { Trades } from "@userPages/Cryptos/Trades/Trades";
import { HoldingsTab } from "@userPages/Cryptos/Holdings/HoldingsTab";
import { TaxReportTab } from "@userPages/Cryptos/TaxReport/TaxReportTab";
import { ImportTab } from "@userPages/Cryptos/Import/ImportTab";

export default function Cryptos (props) {
	const [activeTab, setActiveTab] = useState('trades');

	return <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-1">
		<TabsList className="self-start">
			<TabsTrigger value="trades">Transactions</TabsTrigger>
			<TabsTrigger value="holdings">Cryptos restantes</TabsTrigger>
			<TabsTrigger value="tax-report">Rapport fiscal</TabsTrigger>
			<TabsTrigger value="import">Importer</TabsTrigger>
		</TabsList>

		<TabsContent value="trades" forceMount className={activeTab === 'trades' ? '' : 'hidden'}>
			<Trades {...props} />
		</TabsContent>
		<TabsContent value="holdings" forceMount className={activeTab === 'holdings' ? '' : 'hidden'}>
			<HoldingsTab />
		</TabsContent>
		<TabsContent value="tax-report" forceMount className={activeTab === 'tax-report' ? '' : 'hidden'}>
			<TaxReportTab />
		</TabsContent>
		<TabsContent value="import" forceMount className={activeTab === 'import' ? '' : 'hidden'}>
			<ImportTab />
		</TabsContent>
	</Tabs>
}
