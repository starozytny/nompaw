import React, { useState } from 'react';
import { Calendar, Plus, Clock, Edit2, X } from 'lucide-react';

import ProjectFunctions from "@userFunctions/project";

import { ProjectRoute } from "@userPages/Holidays/Project/Components/ProjectRoute";
import { ProjectHouse } from "@userPages/Holidays/Project/Components/ProjectHouse";
import { ProjectTodos } from "@userPages/Holidays/Project/Components/ProjectTodos";
import { ProjectBudget } from "@userPages/Holidays/Project/Components/ProjectBudget";
import { ProjectLifestyle } from "@userPages/Holidays/Project/Components/ProjectLifestyle";
import { ProjectActivities } from "@userPages/Holidays/Project/Components/ProjectActivities";

import { Input } from "@tailwindComponents/Elements/Fields";

export function ProjectRead ({ elem, userId, oriHouses, oriLifestyles, oriActivities, oriTodos }) {
	const [activeTab, setActiveTab] = useState('overview');
	const [participants, setParticipants] = useState(elem.participants);
	const [houses, setHouses] = useState(JSON.parse(oriHouses));
	const [lifestyles, setLifestyles] = useState(JSON.parse(oriLifestyles));
	const [activities, setActivities] = useState(JSON.parse(oriActivities));
	const [todos, setTodos] = useState(JSON.parse(oriTodos));

	let onChange = (e) => {
		let value = e.currentTarget.value;
		setParticipants(value)
	}

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

	let menu = [
		{ id: 'overview', label: 'Vue d\'ensemble', icon: 'menu-1' },
		{ id: 'itinerary', label: 'Itinéraire', icon: 'map' },
		// { id: 'daily', label: 'Planning jour par jour', icon: 'calendar' },
	]

	let budget = ProjectFunctions.getBudget(participants, elem.priceRoute, houses, lifestyles, activities);
	let percentage = Math.floor(elem.maxBudget !== 0 ? (budget.total / elem.maxBudget) * 100 : 0);

	return <>
		<div className="bg-white border-b border-slate-200 shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-between h-14">
					<div className="text-sm flex items-center space-x-6">
						<div className="flex items-center space-x-2">
							<span className="icon-group !font-bold text-ls"></span>
							<div className="text-slate-700 flex items-center">
								<div className="w-10 mr-2">
									<Input identifiant="participants" valeur={participants} errors={[]} onChange={onChange} />
								</div>
								participants
							</div>
						</div>
						<div className="hidden md:block w-px h-6 bg-slate-200"></div>
						<div className="flex items-center space-x-2">
							<span className="icon-bank !font-bold text-ls"></span>
							<span className="font-semibold text-slate-800">{(budget.total).toFixed(2)} € / {(elem.maxBudget).toFixed(2)} €</span>
							<span className="hidden md:inline-blocktext-slate-500">({percentage}%)</span>
						</div>
					</div>
					<div className="hidden md:block w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
						<div
							className="h-1.5 bg-gradient-to-r from-emerald-500 to-amber-500 rounded-full transition-all"
							style={{ width: `${percentage}%` }}
						/>
					</div>
				</div>
			</div>
		</div>

		<div className="bg-white border-b border-slate-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<nav className="flex space-x-8" aria-label="Tabs">
					{menu.map((tab) => (
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
							<span className={`${activeTab === tab.id ? 'block ml-2' : 'hidden md:block'} md:ml-2`}>{tab.label}</span>
						</button>
					))}
				</nav>
			</div>
		</div>

		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			{activeTab === 'overview' && (
				<div className="space-y-6">
					<div className="flex flex-col xl:grid xl:grid-cols-3 gap-6">
						<ProjectBudget budget={budget} />

						<div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
							<div className="flex items-center justify-between mb-4">
								<h3 className="text-lg font-semibold text-slate-800">
									<span className="icon-book-1 !font-bold text-xl"></span>
									<span className="ml-2">Description</span>
								</h3>
							</div>
							<div dangerouslySetInnerHTML={{ __html: elem.description }} />
						</div>

						<div className="xl:col-span-3 flex flex-col xl:grid xl:grid-cols-3 gap-6">
							<div className="xl:col-span-2 flex flex-col gap-6">
								<ProjectHouse
									projectId={elem.id}
									houses={houses}
									userId={userId}
									onUpdateData={setHouses}
								/>

								<ProjectLifestyle
									projectId={elem.id}
									lifestyles={lifestyles}
									userId={userId}
									onUpdateData={setLifestyles}
								/>

								<ProjectActivities
									projectId={elem.id}
									activities={activities}
									userId={userId}
									onUpdateData={setActivities}
								/>
							</div>

							<ProjectTodos
								projectId={elem.id}
								todos={todos}
								userId={userId}
							/>
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
		</div>
	</>;
}
