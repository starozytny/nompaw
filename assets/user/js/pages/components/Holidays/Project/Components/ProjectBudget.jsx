import React from "react";

import Sanitaze from "@commonFunctions/sanitaze";

import { Input } from "@tailwindComponents/Elements/Fields";
import { Euro } from "lucide-react";

export function ProjectBudget ({ nbPers, routePrice, housePrice, lifestyle, activities }) {
	let housePromo = housePrice ? housePrice - (housePrice * 30 / 100) : 0;
	housePromo = housePromo ? Math.round((housePromo + Number.EPSILON) * 100) / 100 : 0;

	let totalPrice = (routePrice ? parseFloat(routePrice) : 0) + (housePrice ? parseFloat(housePrice) : 0);
	let totalPromo = (routePrice ? parseFloat(routePrice) : 0) + (housePromo ? housePromo : 0);

	let lifeStylePrice = 0, activitiesPrice = 0, activitesWithoutPrice = 0;
	let lifeStylePricePers = 0, activitiesPricePers = 0;
	JSON.parse(lifestyle).map(el => {
		lifeStylePrice += el.price ? el.price : 0;
		lifeStylePricePers += el.price ? el.price * (el.priceType === 0 ? nbPers : 1) : 0;
	})
	JSON.parse(activities).map(el => {
		if (el.isSelected) {
			if (el.price) {
				activitiesPrice += el.price;
				activitiesPricePers += el.price * (el.priceType === 0 ? nbPers : 1);
			} else {
				activitesWithoutPrice++;
			}
		}
	})

	totalPrice += lifeStylePrice + activitiesPrice;
	totalPromo += lifeStylePrice + activitiesPrice;

	let budget = {
		total: totalPrice,
		totalPromo: totalPromo,
		breakdown: {
			transport: { label: "Trajet", amount: routePrice ? routePrice : 0, color: "bg-blue-500", promo: null },
			accommodation: { label: "Hébergement", amount: housePrice ? housePrice : 0, color: "bg-purple-500", promo: housePromo },
			activities: { label: "Activités", amount: activitiesPrice ? activitiesPrice : 0, color: "bg-emerald-500", promo: null },
			food: { label: "Style de vie", amount: lifeStylePrice ? lifeStylePrice : 0, color: "bg-amber-500", promo: null }
		}
	};

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
							{(budget.total / nbPers).toFixed(2)} €
						</div>
						{budget.total !== budget.totalPromo
							? <div className="text-xs text-gray-600 mt-1">
								Avec -30 % : {(budget.totalPromo / nbPers).toFixed(2)} €
							</div>
							: null
						}
					</div>
				</div>
			</div>
		</div>
	</div>
}
