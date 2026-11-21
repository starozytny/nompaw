import React from 'react';

import { Callout, DataTable } from "@userPages/Invest/Formation/ui/LessonBlocks";

// Source : docs/formation/04-allocation.md
export const M04Allocation = {
	module: 4,
	slug: 'allocation',
	titre: 'Allocation, risque et horizon de placement',
	duree_minutes: 12,
	niveau: 'debutant',
	prerequis: ['etf-fonds'],
	deblocage: null,
	indicateur: 'Répartition par famille de placements, horizon par objectif',
	termes: ["allocation d'actifs", 'horizon de placement', 'volatilité', 'fonds en euros', 'rééquilibrage'],
	definitions: {
		"allocation d'actifs": "Façon de répartir son argent entre grandes familles de placements : livrets, fonds en euros, actions.",
		'horizon de placement': "Durée pendant laquelle tu peux laisser ton argent investi sans en avoir besoin.",
		'volatilité': "Ampleur des hausses et des baisses d'un placement : plus elle est forte, plus la valeur varie à court terme.",
		'fonds en euros': "Support sécurisé de l'assurance-vie dont le capital est garanti par l'assureur, au rendement modeste.",
		'rééquilibrage': 'Ajustement périodique pour revenir à la répartition choisie quand les marchés l\'ont déformée.',
	},
	chiffre_cle: { valeur: '−21 %', libelle: 'de baisse du portefeuille', contexte: '70 % actions / 30 % fonds en euros quand les actions chutent de 30 % (hypothèse)' },
	verifier: [
		'capital garanti du fonds en euros',
		"rendement du fonds en euros par rapport à l'inflation",
		"repère d'horizon de 5 ans pour les actions",
		'ampleur des baisses boursières passées',
	],
	maj: '2026-11-20',
	quiz: [
		{
			question: "Qu'est-ce que l'allocation d'actifs ?",
			options: [
				"Choisir la meilleure action du moment",
				'Répartir son argent entre grandes familles de placements selon son horizon et son confort face au risque',
				'Placer tout son argent sur un seul livret',
			],
			reponse: 1,
			explication: "L'allocation répond à la question « combien dans chaque famille ? » avant même de choisir les placements précis.",
		},
		{
			question: "Les actions chutent de 30 %. De combien baisse un portefeuille composé de 70 % d'actions et 30 % de fonds en euros ?",
			options: ['30 %', '21 %', '9 %'],
			reponse: 1,
			explication: 'Seule la part en actions baisse : 70 % × 30 % = 21 %. Le fonds en euros amortit la chute sans l\'annuler.',
		},
		{
			question: "Après une baisse de 20 % des marchés, tu n'as pas besoin de cet argent avant 20 ans. Quelle attitude garde le plan intact ?",
			options: [
				'Tout vendre pour éviter de perdre davantage',
				"Conserver son plan : la baisse n'est une perte que si l'on vend",
				'Attendre de voir si ça baisse encore avant de continuer',
			],
			reponse: 1,
			explication: 'Avec un long horizon, les baisses sont des variations temporaires. Vendre en panique transforme une baisse passagère en perte définitive.',
		},
	],
	sections: {
		concept: <p>
			L'<strong>allocation d'actifs</strong> est la façon dont tu répartis ton argent entre grandes familles : livrets,
			fonds en euros, actions. Elle dépend de ton <strong>horizon de placement</strong>, c'est-à-dire du temps pendant
			lequel tu peux laisser l'argent investi sans y toucher. Plus un placement a de <strong>volatilité</strong>, plus sa
			valeur monte et descend à court terme, et plus il faut de temps pour absorber ses baisses. Le <strong>fonds en
			euros</strong>, lui, est un support sécurisé à faible volatilité mais au rendement modeste.
		</p>,

		pourquoi: <>
			<p>
				La répartition entre familles explique en grande partie la façon dont un portefeuille se comporte, bien plus que
				le choix d'un fonds précis. Chaque famille remplit un rôle différent :
			</p>
			<DataTable
				columns={['Famille', 'Rôle', 'Risque de baisse', 'Horizon repère (à vérifier)']}
				rows={[
					[<strong>Livrets réglementés</strong>, 'Réserve de précaution', 'Nul', 'Immédiat'],
					[<strong>Fonds en euros</strong>, 'Stabilité', 'Très faible', 'Moyen terme'],
					[<strong>Actions et ETF</strong>, 'Croissance', 'Élevé à court terme', 'Au moins 5 ans'],
				]}
			/>
			<Callout tone="warning">
				<strong>Attention :</strong> le fonds en euros protège le capital mais rapporte peu. Si son rendement reste sous
				l'inflation, l'argent perd du pouvoir d'achat. Être très prudent a donc aussi un coût.
			</Callout>
		</>,

		exemple: <>
			<p>
				Prenons <strong>10 000 €</strong> et imaginons une chute de 30 % des actions, avec un fonds en euros qui reste
				stable. Voici l'effet de trois répartitions :
			</p>
			<DataTable
				columns={['Allocation', 'Baisse du portefeuille', 'Valeur après la chute']}
				align={['left', 'right', 'right']}
				rows={[
					['100 % actions', '−30 %', '7 000 €'],
					['70 % actions, 30 % fonds en euros', '−21 %', '7 900 €'],
					['30 % actions, 70 % fonds en euros', '−9 %', '9 100 €'],
				]}
			/>
			<p>
				Moins tu détiens d'actions, moins la chute est forte, mais moins ton capital a de chances de croître sur 30 ans.
				Le bon dosage dépend de ton horizon et de ta capacité à supporter une baisse sans paniquer. Avec 35 ans devant
				soi avant la retraite, une part importante de fonds en euros pour de l'argent à très long terme mérite d'être
				questionnée.
			</p>
		</>,

		erreur: <p>
			Décider de son allocation selon l'humeur du moment : vendre après une baisse par peur, puis racheter après une
			hausse par enthousiasme. On achète alors cher et on vend bas, ce qui transforme une baisse passagère en perte
			définitive. Mieux vaut fixer sa répartition une fois selon son horizon, puis s'y tenir, avec
			un <strong>rééquilibrage</strong> de temps en temps.
		</p>,

		suivi: <p>
			Deux indicateurs : la <strong>répartition par famille</strong> (livrets, fonds en euros, actions) et
			l'<strong>horizon par objectif</strong>, car chaque projet n'a pas la même durée : la réserve d'imprévus, un voyage
			dans deux ans et la retraite dans trente ans ne se placent pas pareil. Le rééquilibrage se déclenche quand une
			famille s'écarte nettement de la cible, pas à chaque mouvement du marché.
		</p>,

		retenir: [
			"L'allocation entre livrets, fonds en euros et actions pèse plus que le choix d'un fonds précis.",
			"L'argent dont tu auras besoin sous 5 ans ne se place pas en actions.",
			'Fixer son allocation selon son horizon, puis s\'y tenir, protège des décisions dictées par la peur.',
		],
	},
};
