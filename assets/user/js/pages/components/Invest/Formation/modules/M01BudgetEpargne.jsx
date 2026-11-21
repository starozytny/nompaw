import React from 'react';

import { Callout, Figures } from "@userPages/Invest/Formation/ui/LessonBlocks";

// Source : docs/formation/01-budget-epargne.md
export const M01BudgetEpargne = {
	module: 1,
	slug: 'budget-epargne',
	titre: "Budget, taux d'épargne et enveloppes",
	duree_minutes: 10,
	niveau: 'debutant',
	prerequis: ['revenus-reels'],
	deblocage: null,
	indicateur: "Taux d'épargne, reste à vivre",
	termes: ["taux d'épargne", 'reste à vivre', 'enveloppe', 'charges fixes'],
	definitions: {
		"taux d'épargne": 'Épargne ÷ revenu : la part de ton revenu réellement mise de côté.',
		'reste à vivre': 'Ce qui reste une fois les charges fixes payées.',
		'enveloppe': "Montant fixé à l'avance pour une catégorie de dépenses.",
		'charges fixes': 'Dépenses qui reviennent chaque mois : prêt, énergie, assurances, abonnements.',
	},
	chiffre_cle: { valeur: '37 %', libelle: "de taux d'épargne", contexte: '900 € sur 2 461 € de revenu — le repère courant est 10 à 20 %' },
	verifier: [],
	maj: '2026-11-20',
	quiz: [
		{
			question: "Tu gagnes 2 400 € net et tu mets 360 € de côté chaque mois. Quel est ton taux d'épargne ?",
			options: ['10 %', '15 %', '20 %'],
			reponse: 1,
			explication: "360 ÷ 2 400 = 0,15, soit 15 %. Taux d'épargne = épargne ÷ revenu.",
		},
		{
			question: 'Pourquoi une enveloppe de dépenses à montant fixe est-elle un bon outil ?',
			options: [
				'Elle permet de dépenser sans limite',
				'Une fois vide, on arrête : le reste du budget est protégé',
				'Elle fait gagner des intérêts',
			],
			reponse: 1,
			explication: "Le montant est décidé à l'avance : on profite sans culpabilité, et un dérapage ne met pas en danger les charges fixes ni l'épargne.",
		},
		{
			question: 'À quel moment faut-il épargner pour que ça fonctionne ?',
			options: [
				'En fin de mois, avec ce qu\'il reste',
				'Le jour de la paie, par virement automatique',
				'Quand on a une grosse rentrée',
			],
			reponse: 1,
			explication: "Épargner en premier évite que les dépenses absorbent tout. Ce qui reste après est à dépenser, pas l'inverse.",
		},
	],
	sections: {
		concept: <p>
			Le <strong>taux d'épargne</strong> mesure la part de ton revenu que tu mets réellement de côté : épargne ÷
			revenu. C'est le premier moteur de ton patrimoine, bien avant le rendement des placements. Le{' '}
			<strong>reste à vivre</strong> est ce qui te reste une fois les <strong>charges fixes</strong> (prêt, énergie,
			assurances, abonnements) payées. Une <strong>enveloppe</strong> est un montant fixé à l'avance pour une
			catégorie de dépenses.
		</p>,

		pourquoi: <p>
			Avec 10 000 € de capital et 5 % de rendement, tu gagnes 500 € par an. Avec 100 € de plus épargnés chaque
			mois, tu ajoutes 1 200 € par an. Au début, ce que tu mets de côté pèse bien plus que ce que ça rapporte. Un
			budget sert à décider où va ton argent plutôt que de le découvrir à la fin du mois.
		</p>,

		exemple: <>
			<p>
				Un revenu mensuel de <strong>2 461 €</strong> (salaire 2 261 € + carte restaurant 200 €) et un prêt
				immobilier de <strong>482 €</strong> :
			</p>
			<Figures items={[
				<>Poids du prêt : 482 ÷ 2 261 ≈ <strong>21 %</strong> du salaire. Les banques tolèrent jusqu'à environ 35 % d'endettement : c'est confortable.</>,
				<>Si <strong>900 €/mois</strong> partent chaque mois en épargne et investissement : 900 ÷ 2 461 ≈ <strong>37 %</strong>. C'est un très bon taux (le repère courant est 10 à 20 %).</>,
			]} />
			<Callout tone="warning">
				Attention : ce calcul n'est valable que si ces 900 € sont de l'argent qui sort réellement du compte
				courant. Un virement d'une poche d'épargne vers une autre ne compte pas (voir module 0).
			</Callout>
			<p>
				Repère pédagogique (à adapter, ce n'est pas une règle) : la méthode <strong>50 / 30 / 20</strong> répartit
				le revenu en 50 % de besoins, 30 % d'envies, 20 % d'épargne.
			</p>
		</>,

		erreur: <p>
			<strong>Épargner ce qu'il reste.</strong> Il ne reste presque jamais rien. On fait l'inverse : un virement
			automatique le jour de la paie, puis on dépense le reste. Autre piège : multiplier les petites poches (25 €
			ici, 25 € là) qui compliquent le suivi sans changer grand-chose. Mieux vaut peu de poches, avec chacune un
			rôle clair : sécurité, projets, investissement.
		</p>,

		suivi: <p>
			Deux indicateurs : le <strong>taux d'épargne</strong> (épargne réelle du mois ÷ revenu réel) et le{' '}
			<strong>reste à vivre</strong> (revenu − charges fixes). Une enveloppe de loisirs à montant fixe se suit avec
			un seul chiffre : combien a été dépensé, combien reste.
		</p>,

		retenir: [
			"Taux d'épargne = épargne ÷ revenu, calculé sur de l'argent qui sort vraiment.",
			'On épargne en premier, par virement automatique.',
			'Une enveloppe fixe protège le reste du budget.',
		],
	},
};
