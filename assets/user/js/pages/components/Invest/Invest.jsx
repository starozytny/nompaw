import React, { useState } from 'react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";

import { useInvestTracking } from "@userPages/Invest/lib/useInvestTracking";
import { DashboardHeader } from "@userPages/Invest/DashboardHeader";

import { PositionsTab } from "@userPages/Invest/Positions/PositionsTab";
import { VersementsTab } from "@userPages/Invest/Versements/VersementsTab";
import { EvolutionTab } from "@userPages/Invest/Evolution/EvolutionTab";
import { BilanTab } from "@userPages/Invest/Bilan/BilanTab";
import { SauvegardeTab } from "@userPages/Invest/Sauvegarde/SauvegardeTab";
import { FormationTab } from "@userPages/Invest/Formation/FormationTab";

const TABS = [
	{ value: 'positions', label: 'Positions' },
	{ value: 'versements', label: 'Versements' },
	{ value: 'evolution', label: 'Évolution' },
	{ value: 'bilan', label: 'Bilan' },
	{ value: 'sauvegarde', label: 'Export' },
	{ value: 'formation', label: 'Formation' },
];

export default function Invest () {
	const [activeTab, setActiveTab] = useState('positions');
	const {
		tracking, loading,
		saveEnveloppe, deleteEnveloppe,
		saveLine, deleteLine,
		saveSnapshot,
	} = useInvestTracking();

	if (loading) {
		return <LoaderElements text="Chargement des investissements" />;
	}

	return <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-5">
		<div>
			<h1 className="text-lg font-semibold">Investissements</h1>
			<p className="text-sm text-muted-foreground">Positions, versements, valorisation et bilan.</p>
		</div>

		<DashboardHeader tracking={tracking} />

		<TabsList className="self-start flex-wrap h-auto">
			{TABS.map(({ value, label }) => <TabsTrigger key={value} value={value}>{label}</TabsTrigger>)}
		</TabsList>

		<TabsContent value="positions">
			<PositionsTab
				tracking={tracking}
				onSaveEnveloppe={saveEnveloppe} onDeleteEnveloppe={deleteEnveloppe}
				onSaveLine={saveLine} onDeleteLine={deleteLine}
				onSaveSnapshot={saveSnapshot}
			/>
		</TabsContent>

		<TabsContent value="versements"><VersementsTab tracking={tracking} /></TabsContent>
		<TabsContent value="evolution"><EvolutionTab tracking={tracking} /></TabsContent>
		<TabsContent value="bilan"><BilanTab tracking={tracking} /></TabsContent>
		<TabsContent value="sauvegarde"><SauvegardeTab tracking={tracking} /></TabsContent>
		<TabsContent value="formation"><FormationTab /></TabsContent>
	</Tabs>
}
