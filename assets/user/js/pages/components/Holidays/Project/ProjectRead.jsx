import React, { useState } from 'react';
import { Calendar, Activity, CheckSquare, Euro, Plus, Clock, Edit2, X } from 'lucide-react';

import { ProjectRoute } from "@userPages/Holidays/Project/Components/ProjectRoute";
import { ProjectBudget } from "@userPages/Holidays/Project/Components/ProjectBudget";
import ProjectFunctions from "@userFunctions/project";

export function ProjectRead ({ elem, userId, lifestyle, activities }) {
	const [activeTab, setActiveTab] = useState('overview');
	const [nbPers, setPers] = useState(1);
	const [checkedItems, setCheckedItems] = useState([false, false, false, false]);

	const dailyPlan = [
		{
			day: 1,
			date: "1 août 2023",
			activities: [
				{ type: "transport", icon: "🚗", title: "Trajet Lyon - Chamonix", time: "08:00", duration: "3h", cost: 200 },
				{ type: "accommodation", icon: "🏠", title: "Check-in hébergement", time: "12:00", cost: 0 },
				{ type: "activity", icon: "🍽️", title: "Déjeuner au Poud", time: "13:00", cost: 25 }
			]
		},
		{
			day: 2,
			date: "2 août 2023",
			activities: [
				{ type: "activity", icon: "🚠", title: "Rafting", time: "09:00", duration: "3h", cost: 61 },
				{ type: "activity", icon: "⛰️", title: "Multipass Mont Blanc", time: "14:00", cost: 70 }
			]
		},
		{
			day: 3,
			date: "3 août 2023",
			activities: [
				{ type: "activity", icon: "🥾", title: "Randonnée Lac Blanc", time: "08:00", duration: "6h", cost: 0 }
			]
		},
		{
			day: 4,
			date: "4 août 2023",
			activities: [
				{ type: "transport", icon: "🚗", title: "Retour Chamonix - Lyon", time: "16:00", duration: "3h", cost: 0 }
			]
		}
	];

	const accommodations = [
		{ name: "Chalet 10 personnes", location: "Chamonix-Mont-Blanc", price: 1426.70, perPerson: 142.67, nights: 3, link: "10 Route du Poud" }
	];

	const activitiesDefault = [
		{ name: "Rafting", price: 61, perPerson: 61, icon: "🚣" },
		{ name: "Multipass Mont Blanc", price: 70, perPerson: 70, icon: "🚠" }
	];

	const todoList = [
		{ item: "Maillot" },
		{ item: "Châuda" },
		{ item: "Vêtement froid" },
		{ item: "Crèpe anti" }
	];

	let budget = ProjectFunctions.getBudget(nbPers, elem.priceRoute, elem.propalHouse ? elem.propalHouse.price : 0, lifestyle, activities);

	return <>
		<div className="bg-white border-b border-slate-200 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-12">
					<div className="flex items-center space-x-6 text-sm">
						<div className="flex items-center space-x-2">
							<span className="icon-group"></span>
							<span className="text-slate-700">10 participants</span>
						</div>
						<div className="w-px h-6 bg-slate-200"></div>
						<div className="flex items-center space-x-2">
							<Euro />
							<span className="font-semibold text-slate-800">{(1552.88).toFixed(2)} € / {(1940.70).toFixed(2)} €</span>
							<span className="text-slate-500">(80%)</span>
						</div>
					</div>
					<div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
						<div
							className="h-1.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all"
							style={{ width: `80%` }}
						/>
					</div>
				</div>
			</div>
		</div>

		<div className="bg-white border-b border-slate-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<nav className="flex space-x-8" aria-label="Tabs">
					{[
						{ id: 'overview', label: 'Vue d\'ensemble', icon: 'menu-1' },
						{ id: 'itinerary', label: 'Itinéraire', icon: 'map' },
						{ id: 'daily', label: 'Planning jour par jour', icon: 'calendar' },
						{ id: 'budget', label: 'Budget', icon: 'bank' },
						{ id: 'checklist', label: 'À préparer', icon: 'check' }
					].map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
								activeTab === tab.id
									? 'border-indigo-500 text-indigo-600'
									: 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
							}`}
						>
							<span className={`icon-${tab.icon}`}></span>
							<span className="ml-2">{tab.label}</span>
						</button>
					))}
				</nav>
			</div>
		</div>

		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{activeTab === 'overview' && (
				<div className="space-y-6">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
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
									{(budget.total / nbPers).toFixed(2)} € / pers.
								</div>
							</div>
						</div>

						<div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-slate-800 flex items-center">
									<span className="icon-home !font-bold text-xl"></span>
									<span className="ml-2">Hébergement</span>
								</h3>
								<button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
									+ Ajouter
								</button>
							</div>
							{accommodations.map((acc, idx) => (
								<div key={idx} className="space-y-2">
									<div className="font-medium text-slate-800">{acc.name}</div>
									<div className="flex items-center text-sm text-slate-600">
										<span className="icon-map"></span>
										<span className="ml-1">{acc.location}</span>
									</div>
									<a href="#" className="text-sm text-indigo-600 hover:underline block">{acc.link}</a>
									<div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200">
										<span className="text-sm text-slate-600">{acc.nights} nuits</span>
										<div className="text-right">
											<div className="font-bold text-purple-600">{acc.price.toFixed(2)} €</div>
											<div className="text-xs text-slate-500">{acc.perPerson.toFixed(2)} € / pers.</div>
										</div>
									</div>
								</div>
							))}
						</div>

						<div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-slate-800 flex items-center">
									<Activity />
									<span className="ml-2">Activités</span>
								</h3>
								<button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
									+ Ajouter
								</button>
							</div>
							<div className="space-y-3">
								{activitiesDefault.map((activity, idx) => (
									<div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
										<div className="flex items-center space-x-3">
											<span className="text-2xl">{activity.icon}</span>
											<span className="text-sm font-medium text-slate-700">{activity.name}</span>
										</div>
										<div className="text-right">
											<div className="font-semibold text-emerald-600">{activity.price} €</div>
											<div className="text-xs text-slate-500">{activity.perPerson} € / pers.</div>
										</div>
									</div>
								))}
								<div className="pt-3 border-t border-slate-200">
									<div className="flex justify-between items-center">
										<span className="text-sm font-medium text-slate-600">Total activités</span>
										<span className="text-lg font-bold text-emerald-600">
											{activitiesDefault.reduce((sum, a) => sum + a.price, 0)} €
										</span>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			)}

			{activeTab === 'itinerary' && (<ProjectRoute
				projectId={elem.id}
				texte={elem.textRoute}
				iframe={elem.iframeRoute}
				price={elem.priceRoute}
				userId={userId}
			/>)}

			{/* Planning jour par jour */}
			{activeTab === 'daily' && (
				<div className="space-y-6">
					<div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-semibold text-slate-800 flex items-center">
								<Calendar />
								<span className="ml-2">Planning détaillé</span>
							</h3>
							<button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
								<Plus />
								<span className="ml-2">Ajouter une activité</span>
							</button>
						</div>

						{/* Timeline par jour */}
						<div className="space-y-8">
							{dailyPlan.map((day) => (
								<div key={day.day} className="relative">
									{day.day < dailyPlan.length && (
										<div className="absolute left-6 top-12 bottom-0 w-0.5 bg-slate-200" />
									)}

									<div className="flex items-center space-x-4 mb-4">
										<div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg z-10">
											J{day.day}
										</div>
										<div>
											<div className="text-lg font-semibold text-slate-800">Jour {day.day}</div>
											<div className="text-sm text-slate-500">{day.date}</div>
										</div>
										<div className="ml-auto text-right">
											<div className="text-sm text-slate-500">Budget du jour</div>
											<div className="text-lg font-bold text-slate-800">
												{day.activities.reduce((sum, act) => sum + act.cost, 0)} €
											</div>
										</div>
									</div>

									<div className="ml-16 space-y-3">
										{day.activities.map((activity, idx) => (
											<div
												key={idx}
												className="relative bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow group"
											>
												<div className="flex items-start justify-between">
													<div className="flex items-start space-x-4 flex-1">
														<span className="text-3xl">{activity.icon}</span>
														<div className="flex-1">
															<div className="font-medium text-slate-800">{activity.title}</div>
															<div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                                                                            <span className="flex items-center">
                                                                                <Clock />
                                                                                <span className="ml-1">{activity.time}</span>
                                                                            </span>
																{activity.duration && (
																	<span className="text-slate-400">• {activity.duration}</span>
																)}
																{activity.cost > 0 && (
																	<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                                                    {activity.cost} €
                                                                                </span>
																)}
															</div>
														</div>
													</div>
													<div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-2">
														<button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
															<Edit2 />
														</button>
														<button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
															<X />
														</button>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}

			{activeTab === 'budget' && (<ProjectBudget
				nbPers={nbPers}
				routePrice={elem.priceRoute}
				housePrice={elem.propalHouse ? elem.propalHouse.price : 0}
				lifestyle={lifestyle}
				activities={activities}
			/>)}

			{activeTab === 'checklist' && (
				<div className="space-y-6">
					<div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
						<div className="flex items-center justify-between mb-6">
							<h3 className="text-lg font-semibold text-slate-800 flex items-center">
								<CheckSquare />
								<span className="ml-2">Choses à préparer</span>
							</h3>
							<button className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
								<Plus />
								<span className="ml-2">Ajouter un élément</span>
							</button>
						</div>

						<div className="space-y-2">
							{todoList.map((todo, idx) => (
								<div
									key={idx}
									className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
								>
									<div className="flex items-center space-x-3">
										<input
											type="checkbox"
											checked={checkedItems[idx]}
											onChange={() => {
												const newChecked = [...checkedItems];
												newChecked[idx] = !newChecked[idx];
												setCheckedItems(newChecked);
											}}
											className="w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
										/>
										<span className={`${checkedItems[idx] ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                                        {todo.item}
                                                    </span>
									</div>
									<button className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
										<X />
									</button>
								</div>
							))}
						</div>

						<div className="mt-6 pt-6 border-t border-slate-200">
							<div className="flex items-center justify-between mb-2">
								<span className="text-sm font-medium text-slate-700">Progression</span>
								<span className="text-sm font-semibold text-slate-800">
                                                {checkedItems.filter(t => t).length} / {todoList.length}
                                            </span>
							</div>
							<div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
								<div
									className="h-2 bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
									style={{ width: `${(checkedItems.filter(t => t).length / todoList.length) * 100}%` }}
								/>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	</>;
};
