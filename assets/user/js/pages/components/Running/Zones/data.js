export const ZONES = [
	{
		code: 'Z1', tag: 'Zone 1', name: 'Récupération',
		hr: '< 145 bpm', pace: '> 7:50 /km',
		usage: 'Footing récup · Retour au calme · Échauffements',
		border: '#4caf50', badge: 'bg-emerald-50 text-emerald-700',
	},
	{
		code: 'Z2', tag: 'Zone 2 · EF ★ 80%', name: 'Endu. fondamentale',
		hr: '145–160 bpm', pace: '7:20–7:50 → 7:05–7:35 /km',
		usage: 'Sorties longues · Footings · Base aérobie',
		border: '#2196f3', badge: 'bg-sky-50 text-sky-700',
	},
	{
		code: 'Z3', tag: 'Zone 3 · AS', name: 'Allure semi',
		hr: '160–175 bpm', pace: '6:27 → 6:09 /km',
		usage: 'Blocs allure semi · Fin de sortie longue',
		border: '#ff9800', badge: 'bg-amber-50 text-amber-700',
	},
	{
		code: 'Z4', tag: 'Zone 4 · SEU', name: 'Seuil lactique',
		hr: '175–187 bpm', pace: '6:17–6:22 → 5:59–6:04 /km',
		usage: 'Blocs seuil · Tempo continu · Côtes',
		border: '#e91e63', badge: 'bg-pink-50 text-pink-700',
	},
	{
		code: 'Z5', tag: 'Zone 5 · INT', name: 'Intervalles / VMA',
		hr: '> 187 bpm', pace: '5:52–5:57 → 5:34–5:39 /km',
		usage: 'Intervalles courts · Lignes droites · Développe le moteur',
		border: '#9c27b0', badge: 'bg-violet-50 text-violet-700',
	},
]

export const PACE_PROGRESSION = [
	{ tenK: '1h02 (départ)', ef: '7:20–7:50', seu: '6:17–6:22', int: '5:52–5:57', as: '6:27', semi: '≈ 2h16', when: "Dès maintenant (ton niveau d'avril, moins l'arrêt de l'été)" },
	{ tenK: '59:00 (objectif 2h10)', ef: '7:05–7:35', seu: '5:59–6:04', int: '5:34–5:39', as: '6:09', semi: '≈ 2h10', when: 'Test 5 km ≤ 28:30 le 20 déc, ou test 10 km ≤ 59:30', highlight: true },
	{ tenK: '57:00 (objectif 2h05)', ef: '6:50–7:20', seu: '5:47–5:52', int: '5:22–5:27', as: '5:57', semi: '≈ 2h05', when: 'Seulement si le test du 21 fév est ≤ 57:30' },
]

export const ZONE_PHYSIOLOGY = [
	{
		code: 'Z1', badge: 'bg-emerald-50 text-emerald-700', name: 'Récupération active',
		feel: 'Conversation fluide · Aucun essoufflement · « Promenade rapide »',
		usage: 'Échauffements, retours au calme, footings récup post-course',
		share: '~20%', shareColor: 'text-emerald-700',
	},
	{
		code: 'Z2', badge: 'bg-sky-50 text-sky-700', name: 'Endurance fondamentale (EF) ★',
		feel: 'Phrases courtes possibles · Légère gêne respiratoire · « Je peux tenir des heures »',
		usage: 'Sorties longues et footings — clé pour tenir 2h10 sans exploser',
		share: '~60%', shareColor: 'text-sky-700',
	},
	{
		code: 'Z3', badge: 'bg-amber-50 text-amber-700', name: 'Allure semi (AS)',
		feel: 'Phrases très courtes · Légère brûlure · « Ça commence à forcer »',
		usage: "Blocs à 6:09/km (visé) en fin de plan : 3×2 km, 5 km en séance, 8 km en sortie longue",
		share: '~8%', shareColor: 'text-amber-700',
	},
	{
		code: 'Z4', badge: 'bg-pink-50 text-pink-700', name: 'Seuil lactique (SEU)',
		feel: 'Parole difficile · Respiration forte et rythmée · « Je tiens mais ça force vraiment »',
		usage: 'Blocs 4–8 min, tempo continu 20–25 min, côtes. Cœur du travail de fond.',
		share: '~8%', shareColor: 'text-pink-700',
	},
	{
		code: 'Z5', badge: 'bg-violet-50 text-violet-700', name: 'Intervalles / VMA (INT)',
		feel: 'Impossible de parler · Essoufflement maximal · « Ça brûle partout »',
		usage: 'Intervalles : 6×1 min, 5×3 min, 5×1 000 m, 6×800 m. Développe la vitesse.',
		share: '~4%', shareColor: 'text-violet-700',
	},
]
