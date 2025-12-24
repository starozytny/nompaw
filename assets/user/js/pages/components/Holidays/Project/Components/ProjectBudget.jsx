import React from "react";

import Sanitaze from "@commonFunctions/sanitaze";

export function ProjectBudget ({ budget }) {
	return <div className="space-y-6">
		<div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
			<h3 className="text-lg font-semibold text-slate-800 mb-6">
				<span className="icon-bank !font-semibold text-xl"></span>
				<span className="ml-2">Répartition du budget</span>
			</h3>
			<div className="space-y-4">
				{Object.entries(budget.breakdown).map(([key, item]) => {
					return <div key={key}>
						<div className="flex items-center justify-between mb-2">
							<span className="text-sm font-medium text-slate-700">{item.label}</span>
							<div>
								<span className="text-sm font-semibold text-slate-800">{Sanitaze.toFormatCurrency(item.amount)}</span>
								{item.promo ? <span className="text-sm text-gray-500 ml-2">(avec -30% : {Sanitaze.toFormatCurrency(item.promo)})</span> : null}
							</div>
						</div>
						<div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
							<div
								className={`h-3 ${item.color} transition-all duration-500`}
								style={{ width: `${(item.amount / budget.total) * 100}%` }}
							/>
						</div>
						<div className="text-xs text-slate-500 mt-1">
							{((item.amount / budget.total) * 100).toFixed(1)}% du budget total
						</div>
					</div>
				})}
			</div>

			<div className="mt-6 pt-6 border-t border-slate-200">
				<div className="grid grid-cols-2 gap-4">
					<div className="bg-slate-50 rounded-lg p-4">
						<div className="text-sm text-slate-600">Budget total</div>
						<div className="text-2xl font-bold text-slate-800 mt-1">
							{Sanitaze.toFormatCurrency(budget.total)}
						</div>
						{budget.total !== budget.totalPromo
							? <div className="text-xs text-gray-600 mt-1">
								Avec -30 % : {Sanitaze.toFormatCurrency(budget.totalPromo)}
							</div>
							: null
						}
					</div>
					<div className="bg-indigo-50 rounded-lg p-4">
						<div className="text-sm text-indigo-600">Par personne</div>
						<div className="text-2xl font-bold text-indigo-600 mt-1">
							{(budget.total / budget.participants).toFixed(2)} €
						</div>
						{budget.total !== budget.totalPromo
							? <div className="text-xs text-gray-600 mt-1">
								Avec -30 % : {(budget.totalPromo / budget.participants).toFixed(2)} €
							</div>
							: null
						}
					</div>
				</div>
			</div>
		</div>
	</div>
}

export function ProjectBudgetGlobal ({ budget }) {
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
