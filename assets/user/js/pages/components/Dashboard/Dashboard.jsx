import React, { useState } from 'react';

import {
	Mountain, Compass, Cake, Calculator, Bitcoin, TrendingUp, Footprints, Clapperboard, Images,
	Wallet, CalendarClock, Coins,
} from 'lucide-react';

import Sanitaze from "@commonFunctions/sanitaze";

import { Card, CardContent } from "@shadcnComponents/ui/card";

import { useDashboardStats } from "@userPages/Dashboard/lib/useDashboardStats";
import { StatCard } from "@userPages/Dashboard/StatCard";
import { ShortcutCard } from "@userPages/Dashboard/ShortcutCard";
import { WeeklyVolumeChart } from "@userPages/Dashboard/WeeklyVolumeChart";
import { DashboardSkeleton } from "@userPages/Dashboard/DashboardSkeleton";

import { BudgetTrendChart } from "@userPages/Budget/BudgetTrendChart";

import { totalValorisation, enveloppeAllocation } from "@userPages/Invest/lib/compute";
import { AllocationChart } from "@userPages/Invest/Positions/AllocationChart";

import { WEEKS } from "@userPages/Running/Plan/weeks";
import { findNextRace } from "@userPages/Running/Plan/lib/nextRace";
import { todayISO } from "@userPages/Running/Suivi/lib/format";

const TODAY_LABEL = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

// Order requested: Aventures, Projets, Anniversaires, Planificateur, Crypto, Investissements, Running, Vidéothèque, Photos.
const SHORTCUTS = [
	{ key: 'aventures', Icon: Mountain, title: 'Aventures', description: 'Parcourez vos aventures et revivez vos moments à travers vos photos.', cta: 'Voir les aventures', color: '#2563eb', soft: '#2563eb1a' },
	{ key: 'projets', Icon: Compass, title: 'Projets', description: 'Planifiez vos prochaines escapades et organisez vos itinéraires.', cta: 'Planifier un voyage', color: '#ea580c', soft: '#ea580c1a' },
	{ key: 'anniversaires', Icon: Cake, title: 'Anniversaires', description: 'Consultez les albums et les idées de cadeaux.', cta: 'Voir les anniversaires', color: '#db2777', soft: '#db27771a' },
	{ key: 'budget', Icon: Calculator, title: 'Planificateur', description: 'Gérez vos dépenses et suivez votre budget mensuel.', cta: 'Gérer le budget', color: '#16a34a', soft: '#16a34a1a' },
	{ key: 'cryptos', Icon: Bitcoin, title: 'Cryptomonnaies', description: "Vue d'ensemble de vos échanges et de votre portefeuille.", cta: 'Voir les échanges', color: '#4f46e5', soft: '#4f46e51a' },
	{ key: 'invest', Icon: TrendingUp, title: 'Investissements', description: 'Positions, versements et valorisation de ton patrimoine.', cta: 'Voir le portefeuille', roleKey: 'invest', color: '#0d9488', soft: '#0d94881a' },
	{ key: 'running', Icon: Footprints, title: 'Running', description: "Plan d'entraînement, suivi et bilan de course.", cta: 'Voir le plan', roleKey: 'running', color: '#e11d48', soft: '#e11d481a' },
	{ key: 'videotheque', Icon: Clapperboard, title: 'Vidéothèque', description: 'Accédez à votre collection de films et séries.', cta: 'Voir les films', color: '#7c3aed', soft: '#7c3aed1a' },
	{ key: 'photos', Icon: Images, title: 'Photos', description: 'Retrouvez les albums photo partagés en famille.', cta: 'Voir les albums', roleKey: 'photos', color: '#0891b2', soft: '#0891b21a' },
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

		<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
			{SHORTCUTS.filter(s => !s.roleKey || paths[s.roleKey]).map(s => <ShortcutCard
				key={s.key} href={paths[s.key]} Icon={s.Icon} title={s.title} description={s.description} cta={s.cta}
				color={s.color} soft={s.soft}
			/>)}
		</div>
	</div>;
}
