export const MEALS = [
	{
		day: 'Lundi', context: 'Renfo bas du corps',
		midi: { title: 'Bowl poulet grillé', items: ['Riz cuit 5 min micro-ondes', 'Poulet émincé poêle 8 min', "Épinards sautés à l'ail", 'Huile olive + citron'], time: '12 min', tag: 'Magnésium ⭐', tagColor: 'emerald' },
		soir: { title: 'Pâtes saumon-crème', items: ['Pâtes complètes 10 min', 'Saumon fumé (sans cuisson)', 'Crème légère + aneth', 'Parmesan râpé'], time: '13 min', tag: 'Oméga-3', tagColor: 'sky' },
	},
	{
		day: 'Mardi', context: 'Pilates 18h–19h',
		midi: { title: 'Wrap œufs-avocat', items: ['2 œufs brouillés 3 min', '½ avocat tranché', 'Tomate + feta émiettée', 'Tortilla complète'], time: '8 min', tag: 'Énergie durable', tagColor: 'amber' },
		soir: { title: 'Bowl quinoa-thon', items: ['Quinoa + riz (cuisson rapide)', 'Thon en boîte égoutté', 'Concombre + tomates cerises', 'Vinaigrette citron-moutarde'], time: '10 min', tag: 'Fenêtre récup ⭐', tagColor: 'orange' },
	},
	{
		day: 'Mercredi', context: 'Course du soir (qualité)',
		midi: { title: 'Salade lentilles-chorizo', items: ['Lentilles boîte (sans cuisson)', 'Chorizo doux poêlé 3 min', 'Oignon rouge + persil', 'Vinaigre balsamique'], time: '7 min', tag: 'Fer + Magnésium', tagColor: 'emerald' },
		soir: { title: 'Poulet-patate douce', items: ['Patate douce micro-ondes 6 min', 'Blanc de poulet + paprika', 'Brocoli vapeur 4 min', 'Yaourt grec + ciboulette'], time: '14 min', tag: 'Glucides index bas', tagColor: 'sky' },
	},
	{
		day: 'Jeudi', context: 'Gainage + mobilité',
		midi: { title: 'Pasta froide thon-câpres', items: ['Pâtes froides (cuites J-1)', 'Thon boîte + câpres', 'Tomates + olives noires', 'Huile olive + origan'], time: '3 min', tag: 'Préparé en avance', tagColor: 'gray' },
		soir: { title: 'Omelette épinards-feta', items: ['3 œufs battus', 'Épinards surgelés décongelés', 'Feta émiettée + noix muscade', 'Pain complet grillé'], time: '10 min', tag: 'Magnésium ⭐ Protéines', tagColor: 'orange' },
	},
	{
		day: 'Samedi', context: 'Repos · veille de sortie longue ou course',
		midi: { title: 'Riz poulet léger', items: ['Riz blanc vapeur', 'Poulet vapeur ou grillé simple', 'Haricots verts vapeur', 'Huile olive + sel'], time: '10 min', tag: 'Digestion facile', tagColor: 'sky' },
		soir: { title: 'Pâtes surcharge glyco', items: ['Pâtes blanches 200g sec', 'Sauce tomate simple', 'Poulet émincé + basilic', "Parmesan + filet d'olive"], time: '12 min', tag: 'SURCHARGE GLYCOGÈNE ⭐', tagColor: 'orange' },
	},
]

export const MEAL_TAG_COLORS = {
	emerald: 'bg-emerald-50 text-emerald-700',
	sky: 'bg-sky-50 text-sky-700',
	amber: 'bg-amber-50 text-amber-700',
	orange: 'bg-orange-50 text-orange-700',
	gray: 'bg-muted text-muted-foreground',
}

export const SNACK_TIMING = [
	{ when: 'Matin avant séance (<1h30)', snack: 'Banane + 2 tartines pain complet + beurre de cacahuète', why: 'Glycogène sans lourdeur digestive' },
	{ when: '30 min avant course', snack: 'Banane mûre ou quelques dattes', why: 'Énergie rapide, digestion légère' },
	{ when: 'Post-effort <30 min', snack: 'Fromage blanc 0% + granola + 1 banane', why: 'Fenêtre anabolique · Récupération musculaire' },
	{ when: 'Collation 10–11h', snack: "Poignée d'amandes (30g) + 1 fruit + eau", why: 'Stabilité glycémique + magnésium' },
	{ when: 'En séance >45 min', snack: 'Eau toutes les 15–20 min + gel si >60 min', why: 'Maintien glycémie + hydratation' },
	{ when: 'Soir avant grosse séance', snack: 'Riz ou pâtes + protéines + légumes (éviter crus)', why: 'Recharge glycogène hépatique', highlight: true },
]
