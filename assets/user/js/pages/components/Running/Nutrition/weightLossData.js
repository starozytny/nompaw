export const FASTING_ITEMS = [
	{ emoji: '📅', label: 'Fenêtre alimentaire :', text: 'premier repas à midi, dernier avant 20h' },
	{ emoji: '☕', label: 'Le matin :', text: 'café noir ou thé autorisés — ne rompent pas le jeûne' },
	{ emoji: '💊', label: 'Collagène :', text: 'gélules le matin avec eau + jus de citron — absorption optimale à jeun' },
	{ emoji: '⚠️', label: 'Exception séance matin :', text: "si entraînement >45 min ou VMA → banane + shaker whey 30 min avant. Ça ne compromet pas la perte de poids.", warn: true },
]

export const SUPPLEMENTS = [
	{ tag: 'Whey · Chocolat Cookie', color: 'text-orange-600', name: 'Protéine en poudre', items: [
		'📅 Post-entraînement dans les 30 min (1 scoop dans 200 ml d\'eau)',
		'🕐 Ou collation 16h si quota protéines non atteint au midi',
		'🏃 Si séance matin >45 min à jeun : 1 scoop + banane avant',
		'🎯 Objectif : 160–180 g protéines/jour total',
	] },
	{ tag: 'Créatine · Nature', color: 'text-blue-600', name: 'Monohydrate de créatine', items: [
		'📅 3–5 g chaque jour, même sans entraînement',
		'🥤 À mélanger dans le shaker whey ou un verre d\'eau au midi',
		'💪 Préserve la masse musculaire pendant le déficit — crucial',
		'💧 Légère rétention d\'eau les 2 premières semaines — normal',
	] },
	{ tag: 'Collagène · Nutrimuscle', color: 'text-emerald-600', name: 'Gélules collagène', items: [
		'📅 Le matin à jeun + verre d\'eau + jus de citron ou orange',
		'🦴 Protège genoux, hanches, tendons — utile avec le volume de course',
		'🍊 La vitamine C multiplie l\'absorption — ne pas oublier',
		'⚠️ Effet neutre sur le poids — protection articulaire uniquement',
	] },
]

export const LUNCH_CATEGORIES = [
	{ title: '✅ Chauds — micro-ondes 3 min', color: 'text-emerald-600', bg: 'bg-emerald-50', items: [
		'🍗 Sachet poulet + légumes vapeur (Picard, Fleury Michon) — ~300 kcal, ~28g prot',
		'🐟 Sachet saumon + riz vapeur "3 min" — ~380 kcal, ~32g prot',
		'🍚 Sachet riz/quinoa Uncle Ben\'s + boîte thon — ~420 kcal, ~35g prot',
		'🥘 Plat cuisiné allégé (Fleury Michon "Légèreté") — vérifier >25g prot, <450 kcal',
	] },
	{ title: '🥗 Froids — zéro réchauffage', color: 'text-sky-600', bg: 'bg-sky-50', items: [
		'🥗 Salade composée poulet/thon rayon traiteur — sans mayo, vinaigrette séparée',
		'🥚 Plateau protéiné : œufs durs + charcuterie maigre + fromage — ~350 kcal, ~30g prot',
		'🫙 Taboulé allégé + 1 boîte sardines — ~400 kcal, ~32g prot',
		'🧆 Wrap poulet-crudités rayon sandwich — sans sauce crémeuse',
	] },
	{ title: '⚠️ À éviter', color: 'text-orange-600', bg: 'bg-orange-50', items: [
		'🥪 Sandwichs pain blanc + mayo — peu de protéines, pic glycémique',
		'🍕 Pizzas et quiches individuelles — souvent +550 kcal, peu de prot',
		'🍜 Pâtes en sauce crémeuse — gras + glucides rapides',
		'🧃 Jus de fruits / sodas — calories liquides. Eau plate uniquement.',
	] },
]

export const SHOPPING_LIST = [
	'🐟 Boîtes thon/sardines/maquereau nature (×6)',
	'🥚 Œufs durs snacking (ou cuire le soir)',
	'🍗 Émincés poulet cuit sous vide (charcuterie légère)',
	'🫙 Sachets riz/quinoa micro-ondes Uncle Ben\'s',
	'🥗 Salade en sachet lavée prête à l\'emploi',
	'🍅 Tomates cerises (snacking ou salade)',
	'🫘 Boîtes lentilles/pois chiches égouttés',
	'🧀 Fromage blanc 0% ou skyr (protéines ++)',
	'🍌 Bananes (pré-séance ou collation)',
	'🥜 Amandes portion 30g (satiété 16h)',
]

export const POIDS_MEALS = [
	{ day: 'Lundi', context: 'Jeûne matinal · Repos ou séance légère',
		midi: { title: 'Sachet vapeur + thon', items: ['Sachet riz/quinoa micro-ondes Uncle Ben\'s', '1 boîte thon nature égouttée', 'Salade sachet + tomates cerises', 'Vinaigrette légère'], kcal: '~430 kcal', prot: '~40g', tag: 'Superm · 3 min micro-ondes' },
		soir: { title: 'Poulet patate douce', items: ['150g poulet poêle + paprika', '1 patate douce micro-ondes 6 min', 'Épinards sautés à l\'ail', 'Yaourt grec 0% en sauce'], kcal: '~450 kcal', prot: '~44g', tag: 'Maison · 14 min' },
		collation: 'Shaker whey post-entraînement + créatine 3–5g · Collagène matin + jus de citron',
	},
	{ day: 'Mardi', context: 'Pilates 18h–19h',
		midi: { title: 'Plateau protéiné froid', items: ['2 œufs durs rayon snacking', '100g émincés poulet sous vide', 'Salade sachet + concombre', 'Fromage blanc 0%'], kcal: '~380 kcal', prot: '~42g', tag: 'Superm · Sans micro-ondes' },
		soir: { title: 'Riz saumon teriyaki', items: ['150g saumon poêle 8 min', '80g riz basmati sachet vapeur', 'Brocoli micro-ondes 4 min', '1 càs sauce soja + gingembre'], kcal: '~510 kcal', prot: '~44g', tag: 'Maison · 13 min' },
		collation: 'Banane + shaker whey 30 min avant séance · Skyr 0% si faim à 16h',
	},
	{ day: 'Mercredi', context: 'Course du soir (qualité)',
		midi: { title: 'Salade lentilles-sardines', items: ['1 boîte lentilles égouttées', '1 boîte sardines huile d\'olive', 'Oignon rouge + persil', 'Vinaigre balsamique + moutarde'], kcal: '~420 kcal', prot: '~35g', tag: 'Superm · Zéro cuisson' },
		soir: { title: 'Omelette épinards-feta', items: ['3 œufs + 1 blanc supplémentaire', 'Épinards surgelés micro-ondes', '50g feta émiettée', '1 tranche pain complet grillée'], kcal: '~380 kcal', prot: '~38g', tag: 'Maison · 10 min' },
		collation: 'Collagène matin · Créatine dans eau au midi · Amandes 30g à 10h',
	},
	{ day: 'Jeudi', context: 'Gainage + mobilité',
		midi: { title: 'Plat vapeur poulet légumes', items: ['Plat vapeur Fleury Michon/Picard', '(choisir : +25g prot, -450 kcal)', 'Salade sachet en complément', 'Fromage blanc 0% en dessert'], kcal: '~440 kcal', prot: '~36g', tag: 'Superm · 3 min micro-ondes' },
		soir: { title: 'Bowl quinoa poulet', items: ['80g quinoa sachet vapeur', '130g poulet émincé poêle + cumin', 'Concombre + tomates cerises + feta', 'Jus de citron + huile olive'], kcal: '~460 kcal', prot: '~42g', tag: 'Maison · 12 min' },
		collation: 'Shaker whey si séance matin · Créatine dans shaker · Collagène + vitamine C',
	},
	{ day: 'Samedi', context: 'Repos · veille de sortie longue',
		midi: { title: 'Wrap poulet-crudités', items: ['Wrap poulet rayon frais sans mayo', 'Ou : taboulé allégé + boîte maquereau', 'Crudités en complément', 'Skyr 0% en dessert'], kcal: '~420 kcal', prot: '~35g', tag: 'Superm · Froid ou micro-ondes' },
		soir: { title: 'Pâtes poulet — recharge glucides', items: ['80g pâtes complètes cuites', '150g poulet poêle + herbes', 'Sauce tomate + parmesan 15g', 'Recharge glycogène pré-sortie ⭐'], kcal: '~520 kcal', prot: '~48g', tag: 'Maison · 12 min · Pré-course' },
		collation: 'Banane avant coucher si sortie longue demain · 2L eau dans la journée · Pas d\'alcool',
	},
]

export const ALCOHOL_COLUMNS = [
	{ title: 'Situation actuelle', color: 'text-red-600', items: [
		'~3–4 bières week-end + 1 en semaine',
		'≈ 750–900 kcal/semaine',
		'Lipolyse bloquée 12–24h après chaque bière',
		'Récupération musculaire dégradée post-course',
	] },
	{ title: 'Objectif réaliste', color: 'text-amber-600', items: [
		'2 bières max le week-end',
		'Bière de semaine → bière sans alcool',
		'Jamais la veille d\'une sortie longue ou VMA',
		'Si sortie longue le dimanche → pas d\'alcool le samedi',
	] },
	{ title: 'Impact estimé', color: 'text-emerald-600', items: [
		'−350 à −500 kcal supplémentaires/semaine',
		'Qualité sommeil +20% → récupération ++',
		'Lipolyse active 7j/7 au lieu de 4–5j/7',
		'≈ 0,5 kg de plus perdu par mois',
	] },
]
