import React, { useState } from 'react';

import { HeartPulse, CalendarDays, LineChart, Flag, Dumbbell, Utensils, Brain, AlertTriangle } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";

import { useRunningTracking } from "@userPages/Running/lib/useRunningTracking";

import { ZonesTab } from "@userPages/Running/Zones/ZonesTab";
import { PlanTab } from "@userPages/Running/Plan/PlanTab";
import { SuiviTab } from "@userPages/Running/Suivi/SuiviTab";
import { RacesTab } from "@userPages/Running/Races/RacesTab";
import { MuscuTab } from "@userPages/Running/Muscu/MuscuTab";
import { NutritionTab } from "@userPages/Running/Nutrition/NutritionTab";
import { MentalTab } from "@userPages/Running/Mental/MentalTab";
import { AlertsTab } from "@userPages/Running/Alerts/AlertsTab";

// Tailwind only generates classes it can see as complete literal strings in the source, so the per-tab
// accent is a lookup of fully-written class names here rather than a `text-${color}-500` template.
const TAB_COLORS = {
	rose: { icon: 'text-rose-500', active: 'data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700' },
	blue: { icon: 'text-blue-500', active: 'data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700' },
	emerald: { icon: 'text-emerald-500', active: 'data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700' },
	amber: { icon: 'text-amber-500', active: 'data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700' },
	orange: { icon: 'text-orange-500', active: 'data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700' },
	lime: { icon: 'text-lime-600', active: 'data-[state=active]:bg-lime-50 data-[state=active]:text-lime-700' },
	violet: { icon: 'text-violet-500', active: 'data-[state=active]:bg-violet-50 data-[state=active]:text-violet-700' },
	red: { icon: 'text-red-500', active: 'data-[state=active]:bg-red-50 data-[state=active]:text-red-700' },
};

const TABS = [
	{ value: 'plan', label: 'Plan Semaines', Icon: CalendarDays, color: 'blue' },
	{ value: 'suivi', label: 'Suivi', Icon: LineChart, color: 'emerald' },
	{ value: 'races', label: 'Plans Jour J', Icon: Flag, color: 'amber' },
	{ value: 'zones', label: 'Zones Cardio', Icon: HeartPulse, color: 'rose' },
	{ value: 'muscu', label: 'Musculation', Icon: Dumbbell, color: 'orange' },
	{ value: 'nutrition', label: 'Nutrition', Icon: Utensils, color: 'lime' },
	{ value: 'mental', label: 'Mental', Icon: Brain, color: 'violet' },
	{ value: 'alerts', label: 'Signaux', Icon: AlertTriangle, color: 'red' },
];

function PlanHeader () {
	return <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #2c2825 0%, #3d3530 100%)' }}>
		<div className="flex flex-wrap justify-between items-end gap-4">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Plan d'entraînement Course</h1>
				<p className="text-sm opacity-60 mt-1.5">Octobre 2026 → Octobre 2027 &nbsp;·&nbsp; Départ 13 octobre 2026</p>
			</div>
			<div className="flex gap-2.5 flex-wrap">
				<div className="rounded-lg px-3.5 py-2 text-center" style={{ background: 'rgba(212,96,42,0.2)', border: '1px solid rgba(212,96,42,0.4)' }}>
					<div className="text-lg font-bold" style={{ color: '#e8835a' }}>10km</div>
					<div className="text-xs opacity-70">≈ 1h02 → 59 min</div>
				</div>
				<div className="rounded-lg px-3.5 py-2 text-center" style={{ background: 'rgba(58,138,92,0.2)', border: '1px solid rgba(58,138,92,0.4)' }}>
					<div className="text-lg font-bold" style={{ color: '#6abf8a' }}>Semi</div>
					<div className="text-xs opacity-70">Objectif 2h10</div>
				</div>
				<div className="rounded-lg px-3.5 py-2 text-center" style={{ background: 'rgba(50,104,168,0.2)', border: '1px solid rgba(50,104,168,0.4)' }}>
					<div className="text-lg font-bold" style={{ color: '#80aadf' }}>5 courses</div>
					<div className="text-xs opacity-70">1er nov · 29 nov · 14 mars · 15 mai · 10 oct</div>
				</div>
			</div>
		</div>
	</div>
}

export default function Running () {
	const [activeTab, setActiveTab] = useState('plan');
	const { tracking, loading, saveLog, importRuns, syncGarmin, saveWeight, deleteWeight, saveNotes, restoreBackup, reset } = useRunningTracking();

	if (loading) {
		return <LoaderElements text="Chargement du suivi" />;
	}

	return <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-5">
		<PlanHeader />

		<TabsList className="self-start flex-wrap h-auto bg-muted/70">
			{TABS.map(({ value, label, Icon, color }) => <TabsTrigger
				key={value} value={value}
				className={`gap-1.5 focus-visible:ring-1 focus-visible:ring-offset-1 ${TAB_COLORS[color].active}`}
			>
				<Icon className={`h-4 w-4 ${TAB_COLORS[color].icon}`} /> {label}
			</TabsTrigger>)}
		</TabsList>

		<TabsContent value="plan" forceMount className={activeTab === 'plan' ? '' : 'hidden'}>
			<PlanTab log={tracking.log} onSaveLog={saveLog} />
		</TabsContent>

		<TabsContent value="suivi" forceMount className={activeTab === 'suivi' ? '' : 'hidden'}>
			<SuiviTab
				tracking={tracking}
				onImportRuns={importRuns}
				onSyncGarmin={syncGarmin}
				onSaveNotes={saveNotes}
				onRestoreBackup={restoreBackup}
				onReset={reset}
				onSaveWeight={saveWeight}
				onDeleteWeight={deleteWeight}
			/>
		</TabsContent>

		<TabsContent value="races"><RacesTab /></TabsContent>
		<TabsContent value="zones"><ZonesTab /></TabsContent>

		<TabsContent value="muscu"><MuscuTab /></TabsContent>
		<TabsContent value="nutrition"><NutritionTab /></TabsContent>
		<TabsContent value="mental"><MentalTab /></TabsContent>
		<TabsContent value="alerts"><AlertsTab /></TabsContent>
	</Tabs>
}
