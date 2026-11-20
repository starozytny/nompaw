export const RACES = [
	{
		date: '1er novembre 2026', title: "11 km mixte (50 % sentier)", goal: "Course d'entraînement · ≈ 1h15–1h22", color: '#e65100',
		steps: [
			{ label: 'J-1', desc: "Glucides complexes + 1,5 L d'eau minimum · Repos complet", allure: '—' },
			{ label: 'Échauffement', desc: '15–20 min de trot Z1–Z2 + 4×20s lignes droites progressives', allure: 'Z1–Z2' },
			{ label: 'Km 0 → 3', desc: "Départ prudent, même si tu te sens bien. Laisse partir les autres.", allure: '6:50–7:10 /km route · 7:30–8:30 /km sentier' },
			{ label: 'Km 3 → 8', desc: 'Allure régulière, marche dans les raidillons, relance en descente', allure: "à l'effort" },
			{ label: 'Km 8 → fin', desc: 'Accélération progressive si les réserves le permettent', allure: "à l'effort" },
		],
		nutrition: 'Eau aux ravitaillements · Gel ou datte vers le km 7 si besoin',
	},
	{
		date: '29 novembre 2026', title: 'Trail 18 km · D+ 550', goal: "Finir en gérant l'effort · ≈ 2h35–2h55", color: '#3a8a5c',
		steps: [
			{ label: 'J-1', desc: 'Glucides complexes · Hydratation ++ · Matériel prêt', allure: '—' },
			{ label: 'Km 0 → 3', desc: 'Départ lent, laisse partir le peloton.', allure: '≤ 9:00 /km' },
			{ label: 'Montées', desc: 'Marche active dans les pentes supérieures à 10 %, mains sur les cuisses si besoin', allure: 'marche active' },
			{ label: 'Descentes', desc: 'Contrôlées, foulée courte, regard 3 m devant', allure: "à l'effort" },
			{ label: 'Dernier tiers', desc: 'Si les jambes répondent, relance progressive sur le plat', allure: "à l'effort" },
		],
		nutrition: "30–40 g de glucides par heure dès 45 min · 400–500 ml d'eau par heure",
	},
	{
		date: '14 mars 2027', title: 'Semi-marathon 21,1 km', goal: 'OBJECTIF PRINCIPAL — 2h10 (6:09 /km)', color: '#3268a8',
		steps: [
			{ label: 'J-2 / J-1', desc: "Pâtes ou riz · 2 L d'eau · Rien de nouveau · Coucher tôt · Veille : repos", allure: '—' },
			{ label: 'Échauffement', desc: '15 min de trot Z1–Z2 + 4 lignes droites + mobilité dynamique', allure: 'Z1–Z2' },
			{ label: 'Km 0 → 3', desc: 'Conserver. Laisser partir les autres. Passage au km 5 : 30:45.', allure: '6:15–6:20 /km' },
			{ label: 'Km 3 → 15', desc: 'Allure cible régulière. Passages : 10 km en 1:01:30, 15 km en 1:32:15. Boire à chaque ravito.', allure: '6:09 /km' },
			{ label: 'Km 15 → 18 ⚠️', desc: 'ZONE CRITIQUE — épaules basses, bras actifs. Aucune accélération avant le km 16.', allure: '6:09 /km' },
			{ label: 'Km 18 → fin', desc: 'Si réserves OK : accélération progressive. Finir fort.', allure: '< 6:09 /km' },
		],
		nutrition: "Gel (25–30 g) vers les km 8 et 15 · Eau à CHAQUE ravito · Rien de nouveau le jour J",
	},
	{
		date: '15 mai 2027', title: 'Trail 28 km · D+ 1 000 · Au cœur du Forez (Montbrison)', goal: 'D+ 1 000 · départ 8h · limite 5h · viser ≈ 4h00–4h40', color: '#3a8a5c',
		steps: [
			{ label: 'J-1', desc: 'Glucides complexes · Hydratation ++ · Matériel et sac prêts', allure: '—' },
			{ label: 'Km 0 → 5', desc: 'Départ lent, laisse partir le peloton.', allure: '≤ 9:00 /km' },
			{ label: 'Montées', desc: 'Marche active dans les pentes supérieures à 10 %', allure: 'marche active' },
			{ label: 'Descentes', desc: 'Contrôlées, foulée courte : garde les quadriceps pour la fin', allure: "à l'effort" },
			{ label: 'Km 20 → fin', desc: 'Relance progressive si les jambes répondent, sinon marche active régulière', allure: "à l'effort" },
		],
		nutrition: "30–40 g de glucides par heure dès 45 min · 400–500 ml d'eau par heure · sel si chaleur",
	},
	{
		date: '10 octobre 2027', title: 'Semi-marathon de Salon-de-Provence 21,1 km', goal: 'Objectif : sub-2h (5:40 /km) · plan B 2h05 ou 2h10 selon le test du 26 septembre', color: '#3268a8',
		steps: [
			{ label: 'J-2 / J-1', desc: "Pâtes ou riz · 2 L d'eau · Rien de nouveau · Coucher tôt", allure: '—' },
			{ label: 'Échauffement', desc: '15 min de trot Z1–Z2 + 4 lignes droites', allure: 'Z1–Z2' },
			{ label: 'Km 0 → 3', desc: 'Conserver : ne pars pas trop vite.', allure: '5:45–5:50 /km' },
			{ label: 'Km 3 → 15', desc: 'Allure régulière. Passages : 5 km en 28:20 · 10 km en 56:40 · 15 km en 1h25.', allure: '5:40 /km' },
			{ label: 'Km 15 → 18 ⚠️', desc: 'Zone critique : aucune accélération avant le km 16.', allure: '5:40 /km' },
			{ label: 'Km 18 → fin', desc: 'Accélération progressive si les réserves sont là.', allure: '< 5:40 /km' },
		],
		nutrition: 'Gel vers les km 6, 12 et 17 · eau à chaque ravito · rien de nouveau le jour J',
	},
]

export const CHECKPOINTS = [
	{ date: 'Dim 1er nov', event: 'Course 11 km mixte', result: '1h15–1h22', action: 'Repère de forme, pas de recalibrage' },
	{ date: 'Dim 20 déc', event: 'Test 5 km à fond', result: '28:30–30:30 (10 km ≈ 59–63 min)', action: '≤ 28:30 : passer sur la ligne 59:00 · sinon rester sur la ligne 1h02' },
	{ date: 'Dim 24 jan', event: 'Test 10 km à fond', result: '59:00–61:30', action: '≤ 59:30 : ligne 59:00 (allure semi 6:09/km)' },
	{ date: 'Dim 21 fév', event: 'Test 10 km à fond', result: '57:00–60:00', action: '≤ 57:30 : viser 2h05 (5:57/km) · ≤ 59:30 : confirmer 2h10 (6:09/km) · 59:30–63:00 : repli 2h15–2h20 · > 63:00 : finir en 2h20+', highlight: true },
	{ date: 'Sam 15 mai', event: 'Trail 28 km Au cœur du Forez (Montbrison)', result: '≈ 4h00–4h40 (limite 5h, départ 8h, D+ 1 000)', action: 'Course principale du printemps' },
	{ date: 'Dim 27 juin', event: 'Test 5 km à fond', result: '26:00–28:30', action: '≈ 25:45 pour garder le sub-2h en vue' },
	{ date: 'Dim 5 sept', event: 'Test 10 km à fond', result: '54:30–57:00', action: '≤ 55:30 : rester sur le sub-2h' },
	{ date: 'Dim 26 sept', event: 'Test 10 km décisif', result: '53:00–56:00', action: '≤ 53:30 : tenter le sub-2h (5:40/km) · ≤ 57:30 : 2h05 · ≤ 59:30 : 2h10 · au-dessus : 2h15+', highlight: true },
	{ date: 'Dim 10 oct 2027', event: 'Semi-marathon de Salon-de-Provence', result: 'Sub-2h (5:40/km), plan B 2h05 / 2h10', action: 'Décidé par le test du 26 septembre' },
]
