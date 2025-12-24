import React from "react";

export function ProjectBudget ({ budget }) {
	return <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
		<div className="flex items-center justify-between mb-4">
			<h3 className="text-lg font-semibold text-slate-800">
				<span className="icon-bank !font-bold text-xl"></span>
				<span className="ml-2">Budget</span>
			</h3>
		</div>
		<div className="space-y-3">
			{Object.entries(budget.breakdown).map(([key, item]) => (
				<div key={key} className="flex items-center justify-between text-sm">
					<div className="flex items-center space-x-2">
						<div className={`w-3 h-3 rounded-full ${item.color}`} />
						<span className="text-slate-600">{item.label}</span>
					</div>
					<span className="font-medium text-slate-800">{item.amount} €</span>
				</div>
			))}
		</div>
		<div className="mt-4 pt-4 border-t border-slate-200">
			<div className="flex justify-between items-center">
				<span className="text-sm font-medium text-slate-600">Total</span>
				<span className="text-2xl font-bold text-indigo-600">{budget.total.toFixed(2)} €</span>
			</div>
			<div className="text-xs text-slate-500 text-right mt-1">
				{(budget.total / budget.participants).toFixed(2)} € / pers.
			</div>
		</div>
	</div>
}
