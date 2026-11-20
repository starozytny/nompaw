import React, { useState } from 'react';

import {
	Mountain, Compass, Cake, Calculator, Bitcoin, TrendingUp, Footprints, Clapperboard, Images,
	Wallet, CalendarClock, Coins,
} from 'lucide-react';

import Sanitaze from "@commonFunctions/sanitaze";

import { Card, CardContent } from "@shadcnComponents/ui/card";

import { useDashboardStats } from "@userPages/Dashboard/lib/useDashboardStats";
import { StatCard } from "@userPages/Dashboard/StatCard";
import { ShortcutGroups } from "@userPages/Dashboard/ShortcutGroups";
import { WeeklyVolumeChart } from "@userPages/Dashboard/WeeklyVolumeChart";
import { DashboardSkeleton } from "@userPages/Dashboard/DashboardSkeleton";

import { BudgetTrendChart } from "@userPages/Budget/BudgetTrendChart";

import { totalValorisation, enveloppeAllocation } from "@userPages/Invest/lib/compute";
import { AllocationChart } from "@userPages/Invest/Positions/AllocationChart";

import { WEEKS } from "@userPages/Running/Plan/weeks";
import { findNextRace } from "@userPages/Running/Plan/lib/nextRace";
import { todayISO } from "@userPages/Running/Suivi/lib/format";

const TODAY_LABEL = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// Order within each group (see ShortcutGroups) follows this array.
const SHORTCUTS = [
	{ key: 'aventures', Icon: Mountain, title: 'Aventures', group: 'souvenirs', description: 'Parcourez vos aventures et revivez vos moments à travers vos photos.', color: '#2563eb', soft: '#2563eb1a' },
	{ key: 'projets', Icon: Compass, title: 'Projets', group: 'projets', description: 'Planifiez vos prochaines escapades et organisez vos itinéraires.', color: '#ea580c', soft: '#ea580c1a' },
	{ key: 'anniversaires', Icon: Cake, title: 'Anniversaires', group: 'souvenirs', description: 'Consultez les albums et les idées de cadeaux.', color: '#db2777', soft: '#db27771a' },
	{ key: 'budget', Icon: Calculator, title: 'Planificateur', group: 'argent', description: 'Gérez vos dépenses et suivez votre budget mensuel.', color: '#16a34a', soft: '#16a34a1a' },
	{ key: 'cryptos', Icon: Bitcoin, title: 'Cryptomonnaies', group: 'argent', description: "Vue d'ensemble de vos échanges et de votre portefeuille.", color: '#4f46e5', soft: '#4f46e51a' },
	{ key: 'invest', Icon: TrendingUp, title: 'Investissements', group: 'argent', description: 'Positions, versements et valorisation de ton patrimoine.', roleKey: 'invest', color: '#0d9488', soft: '#0d94881a' },
	{ key: 'running', Icon: Footprints, title: 'Running', group: 'projets', description: "Plan d'entraînement, suivi et bilan de course.", roleKey: 'running', color: '#e11d48', soft: '#e11d481a' },
	{ key: 'videotheque', Icon: Clapperboard, title: 'Vidéothèque', group: 'souvenirs', description: 'Accédez à votre collection de films et séries.', color: '#7c3aed', soft: '#7c3aed1a' },
	{ key: 'photos', Icon: Images, title: 'Photos', group: 'souvenirs', description: 'Retrouvez les albums photo partagés en famille.', roleKey: 'photos', color: '#0891b2', soft: '#0891b21a' },
];

export default function Dashboard ({ paths }) {
	const hasInvest = !!paths.invest;
	const hasRunning = !!paths.running;
	const { budget, invest, crypto, runningLog, loading } = useDashboardStats({ hasInvest, hasRunning });
	const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

	const nextRace = hasRunning ? findNextRace(WEEKS, todayISO()) : { next: null, daysTo: null };
	const balanceColor = budget && budget.summary.totalDispoNow < 0 ? 'var(--status-critical)' : 'var(--status-good)';
	const balanceSoft = budget && budget.summary.totalDispoNow < 0 ? 'var(--status-critical-soft)' : 'var(--status-good-soft)';
	const allocationByEnveloppe = hasInvest && invest ? enveloppeAllocation(invest.enveloppes) : [];
	const netInvestedCrypto = crypto ? crypto.netInvested.depot - crypto.netInvested.retrait : null;

	const showInvestCharts = hasInvest && allocationByEnveloppe.length > 0;
	const showRunningChart = hasRunning && !!runningLog;
	const sideChartSpan = showInvestCharts && showRunningChart ? 'lg:col-span-1' : 'lg:col-span-2';
	// Without Invest or Running, there's no second chart to pair the budget trend with and the KPI row
	// would just be "Solde" + "Net investi crypto" — a thin, slightly odd dashboard for family members
	// who only use the everyday modules. Skip the whole stats/charts section for them; they get the
	// plain shortcut grid below, same as before any of this existed.
	const showDashboardData = hasInvest || hasRunning;

	return <div className="flex flex-col gap-5">
		<p className="text-sm text-muted-foreground capitalize">{TODAY_LABEL}</p>

		{showDashboardData && (loading ? <DashboardSkeleton hasInvest={hasInvest} hasRunning={hasRunning} /> : <>
			<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
				{budget && <StatCard
					label="Solde disponible" value={Sanitaze.toFormatCurrency(budget.summary.totalDispoNow)}
					Icon={Wallet} color={balanceColor} soft={balanceSoft} href={paths.budget}
				/>}
				{hasInvest && invest && <StatCard
					label="Valorisation investissements" value={Sanitaze.toFormatCurrency(totalValorisation(invest.enveloppes))}
					Icon={TrendingUp} color="hsl(var(--chart-1))" soft="hsl(var(--chart-1) / 0.12)" href={paths.invest}
				/>}
				{hasRunning && <StatCard
					label="Prochaine course"
					value={nextRace.next ? `J-${nextRace.daysTo}` : '—'}
					sub={nextRace.next ? nextRace.next.short : 'Aucun jalon à venir'}
					Icon={CalendarClock} color="hsl(var(--chart-4))" soft="hsl(var(--chart-4) / 0.12)" href={paths.running}
				/>}
				{netInvestedCrypto != null && <StatCard
					label="Net investi en crypto" value={Sanitaze.toFormatCurrency(netInvestedCrypto)}
					Icon={Coins} color="#4f46e5" soft="#4f46e51a" href={paths.cryptos}
				/>}
			</div>

			{budget && (showInvestCharts || showRunningChart) && <div className="grid gap-4 grid-cols-1 lg:grid-cols-4 items-stretch">
				<Card className="lg:col-span-2">
					<CardContent className="p-5">
						<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
							Solde disponible · tendance sur l'année
						</div>
						<BudgetTrendChart
							balances={budget.monthlyBalances} activeMonth={selectedMonth} onSelectMonth={setSelectedMonth}
							todayValue={budget.summary.totalDispoNow}
						/>
					</CardContent>
				</Card>

				{showInvestCharts && <Card className={sideChartSpan}>
					<CardContent className="p-5">
						<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
							Allocation du patrimoine
						</div>
						<AllocationChart data={allocationByEnveloppe} />
					</CardContent>
				</Card>}

				{showRunningChart && <Card className={sideChartSpan}>
					<CardContent className="p-5">
						<div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
							Volume de course · 6 dernières semaines
						</div>
						<WeeklyVolumeChart log={runningLog} />
					</CardContent>
				</Card>}
			</div>}
		</>)}

		<ShortcutGroups items={SHORTCUTS.filter(s => !s.roleKey || paths[s.roleKey])} paths={paths} />
	</div>;
}
