import React, { useState } from 'react';

import { HeartPulse, CalendarDays, LineChart, Flag, Dumbbell, Utensils, Brain, AlertTriangle, Timer, Target, CalendarClock } from "lucide-react";

import { Card, CardContent } from "@shadcnComponents/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@shadcnComponents/ui/tabs";
import { LoaderElements } from "@tailwindComponents/Elements/Loader";

import { useRunningTracking } from "@userPages/Running/lib/useRunningTracking";
import { GarminSyncButton } from "@userPages/Running/GarminSyncButton";
import { WeightMilestoneCard } from "@userPages/Running/WeightMilestoneCard";

import { WEEKS } from "@userPages/Running/Plan/weeks";
import { findNextRace } from "@userPages/Running/Plan/lib/nextRace";
import { todayISO } from "@userPages/Running/Suivi/lib/format";

import { ZonesTab } from "@userPages/Running/Zones/ZonesTab";
import { PlanTab } from "@userPages/Running/Plan/PlanTab";
import { SuiviTab } from "@userPages/Running/Suivi/SuiviTab";
import { RacesTab } from "@userPages/Running/Races/RacesTab";
import { MuscuTab } from "@userPages/Running/Muscu/MuscuTab";
import { NutritionTab } from "@userPages/Running/Nutrition/NutritionTab";
import { MentalTab } from "@userPages/Running/Mental/MentalTab";
import { AlertsTab } from "@userPages/Running/Alerts/AlertsTab";

const TABS = [
	{ value: 'plan', label: 'Plan Semaines', Icon: CalendarDays },
	{ value: 'suivi', label: 'Suivi', Icon: LineChart },
	{ value: 'races', label: 'Plans Jour J', Icon: Flag },
	{ value: 'zones', label: 'Zones Cardio', Icon: HeartPulse },
	{ value: 'muscu', label: 'Musculation', Icon: Dumbbell },
	{ value: 'nutrition', label: 'Nutrition', Icon: Utensils },
	{ value: 'mental', label: 'Mental', Icon: Brain },
	{ value: 'alerts', label: 'Signaux', Icon: AlertTriangle },
];

// A bespoke harmonious blue for "Semi" rather than --chart-2 (a teal), since --chart-1 already
// covers "10 km" and the two pace milestones read better sharing the blue family, each a shade apart.
const SEMI_BLUE = '#2563eb';

const MILESTONES = [
	{ label: '10 km', value: '≈ 1h02 → 59 min', Icon: Timer, varName: '--chart-1' },
	{ label: 'Semi', value: 'Objectif 2h10', Icon: Target, color: SEMI_BLUE, soft: `${SEMI_BLUE}1f` },
	{ label: '5 courses', value: '1er nov · 29 nov · 14 mars · 15 mai · 10 oct', Icon: Flag, varName: '--chart-3' },
];

function MilestoneTile ({ label, value, Icon, varName, color, soft }) {
	const resolvedColor = color || `hsl(var(${varName}))`;
	const resolvedSoft = soft || `hsl(var(${varName}) / 0.12)`;

	return <Card>
		<CardContent className="p-4 flex items-center gap-3">
			<div
				className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
				style={{ background: resolvedSoft, color: resolvedColor }}
			>
				<Icon className="h-[18px] w-[18px]" />
			</div>
			<div className="min-w-0">
				<div className="text-xs text-muted-foreground">{label}</div>
				<div className="text-sm font-bold mt-0.5 truncate" style={{ color: resolvedColor }}>{value}</div>
			</div>
		</CardContent>
	</Card>;
}

function Header ({ onSyncGarmin, weights, onSaveWeight }) {
	const { next, daysTo } = findNextRace(WEEKS, todayISO());

	return <div className="flex flex-col gap-3">
		<div className="flex flex-wrap items-end justify-between gap-3">
			<div>
				<h1 className="text-lg font-semibold">Plan d'entraînement Course</h1>
				<p className="text-sm text-muted-foreground">Octobre 2026 → Octobre 2027 · Départ 13 octobre 2026</p>
			</div>
			<GarminSyncButton onSyncGarmin={onSyncGarmin} />
		</div>

		<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
			<MilestoneTile
				label="Prochaine course"
				value={next ? `J-${daysTo} · ${next.short}` : 'Aucun jalon à venir'}
				Icon={CalendarClock} varName="--chart-4"
			/>
			{MILESTONES.map(m => <MilestoneTile key={m.label} {...m} />)}
			<WeightMilestoneCard weights={weights} onSaveWeight={onSaveWeight} />
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
		<Header onSyncGarmin={syncGarmin} weights={tracking.weights} onSaveWeight={saveWeight} />

		<TabsList className="self-start flex-wrap h-auto">
			{TABS.map(({ value, label, Icon }) => <TabsTrigger key={value} value={value} className="gap-1.5">
				<Icon className="h-4 w-4" /> {label}
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
