import React from 'react';

import { Callout, DataTable } from "@userPages/Invest/Formation/ui/LessonBlocks";

// Source : docs/formation/03-etf-fonds.md
export const M03EtfFonds = {
	module: 3,
	slug: 'etf-fonds',
	titre: 'ETF et fonds : diversifier à faible coût',
	duree_minutes: 12,
	niveau: 'debutant',
	prerequis: ['enveloppes'],
	deblocage: null,
	indicateur: 'Répartition par ligne, frais courants',
	termes: ['ETF', 'indice', 'diversification', 'frais courants', 'fonds actif'],
	definitions: {
		'ETF': "Fonds coté en bourse qui réplique un indice : en un achat, tu détiens un petit morceau de centaines d'entreprises.",
		'indice': "Panier d'entreprises suivi comme un thermomètre du marché, par exemple le MSCI World pour les grandes entreprises mondiales.",
		'diversification': "Répartir son argent sur de nombreuses entreprises pour qu'aucune ne puisse, seule, ruiner le portefeuille.",
		'frais courants': 'Pourcentage prélevé chaque année sur ton capital pour faire fonctionner le fonds, déjà déduit de la performance affichée.',
		'fonds actif': "Fonds dont des gérants choisissent les entreprises pour essayer de battre l'indice, avec des frais plus élevés.",
	},
	chiffre_cle: { valeur: '≈ 10 200 €', libelle: "d'écart de capital à cause des frais", contexte: '10 000 € sur 30 ans à 5 % brut : 0,2 % de frais contre 1,2 % (hypothèses à vérifier)' },
	verifier: [
		"frais courants typiques d'un ETF et d'un fonds actif",
		"nombre d'entreprises du MSCI World",
		'éligibilité des ETF au PEA',
		'rendement de 5 % (hypothèse, non garantie)',
	],
	maj: '2026-11-20',
	quiz: [
		{
			question: "Qu'est-ce qu'un ETF ?",
			options: [
				"Une action d'une seule grande entreprise",
				'Un fonds coté qui réplique un indice et détient de nombreuses entreprises',
				"Un livret garanti par l'État",
			],
			reponse: 1,
			explication: "Un ETF suit un indice : en l'achetant, tu détiens indirectement des centaines d'entreprises, sans les choisir une par une.",
		},
		{
			question: "Dans l'exemple, pourquoi le capital final est-il plus faible avec 1,2 % de frais ?",
			options: [
				'Les frais sont prélevés une seule fois au départ',
				'Les frais sont prélevés chaque année et réduisent aussi les gains futurs',
				'Le fonds à 1,2 % rapporte forcément moins avant frais',
			],
			reponse: 1,
			explication: "Les frais s'appliquent chaque année sur un capital qui grandit : l'écart de 1 point se cumule avec les intérêts composés et pèse lourd sur 30 ans.",
		},
		{
			question: "Tu détiens déjà un ETF MSCI World. Qu'apporte un ETF Nasdaq-100 en plus ?",
			options: [
				'Une vraie diversification nouvelle',
				'Surtout un doublon : ces grandes entreprises sont déjà dans le MSCI World',
				'Une garantie contre les baisses',
			],
			reponse: 1,
			explication: 'Le Nasdaq-100 regroupe de grandes entreprises technologiques déjà présentes dans le MSCI World : tu les surpondères au lieu de diversifier.',
		},
	],
	sections: {
		concept: <p>
			Un <strong>ETF</strong> est un fonds coté en bourse qui réplique un <strong>indice</strong>, c'est-à-dire un panier
			d'entreprises. En achetant une seule part, tu détiens un petit morceau de centaines d'entreprises : c'est
			la <strong>diversification</strong>, qui évite qu'une faillite isolée détruise ton capital. Chaque année, le fonds
			prélève des <strong>frais courants</strong>, déjà retranchés de la performance affichée. Un <strong>fonds
			actif</strong> fait l'inverse : des gérants choisissent les entreprises pour tenter de battre l'indice, avec des
			frais plus élevés.
		</p>,

		pourquoi: <>
			<p>
				Sur le long terme, ce que tu gardes dépend moins du « bon choix » d'entreprise que de ce que tu ne perds pas en
				frais et en concentration. Voici les trois grandes façons d'investir en actions :
			</p>
			<DataTable
				columns={['Approche', 'Entreprises détenues', 'Frais typiques (à vérifier)', 'Risque propre à une entreprise']}
				rows={[
					[<strong>ETF monde</strong>, "plus d'un millier", 'environ 0,2 % par an', 'Très faible'],
					[<strong>Fonds actif</strong>, 'quelques dizaines', 'environ 1,5 % par an', 'Moyen'],
					[<strong>Action individuelle</strong>, '1', 'Très faibles', 'Élevé'],
				]}
			/>
			<Callout tone="warning">
				<strong>Attention :</strong> un ETF réduit le risque d'une entreprise isolée, pas celui du marché entier. Une
				baisse de 30 % de l'indice sur une période est possible, et ne devient une perte que si tu vends.
			</Callout>
		</>,

		exemple: <>
			<p>
				Prenons <strong>10 000 €</strong> placés pendant 30 ans, avec une performance hypothétique de 5 % par an avant
				frais (non garantie) :
			</p>
			<DataTable
				columns={['Frais courants', 'Rendement net', 'Capital final']}
				align={['left', 'right', 'right']}
				rows={[
					['0,2 % par an', '4,8 %', 'environ 40 800 €'],
					['1,2 % par an', '3,8 %', 'environ 30 600 €'],
				]}
			/>
			<p>
				L'écart est d'environ <strong>10 200 €</strong> : 1 point de frais de plus par an a coûté un quart du capital
				final. Les frais s'appliquent chaque année sur un capital qui grandit, et ils retirent aussi les gains que ce
				capital aurait produits ensuite.
			</p>
		</>,

		erreur: <p>
			Empiler les ETF « thématiques » (technologie, défense, eau, Nasdaq) en croyant se diversifier. Ces fonds détiennent
			souvent les mêmes grandes entreprises que ton ETF monde : tu surpondères quelques entreprises au lieu d'en ajouter
			de nouvelles, et tu paies des frais supplémentaires. Un ETF monde large suffit déjà à couvrir l'essentiel du marché.
		</p>,

		suivi: <p>
			Deux indicateurs : la <strong>répartition par ligne</strong> (quelle part de ton portefeuille pèse chaque ETF ou
			chaque action) et les <strong>frais courants</strong> de chaque ligne, pour repérer les fonds chers. Dans un cas
			d'étude à plusieurs enveloppes, un ETF MSCI World dans un PEA et un autre dans une assurance-vie peuvent déjà
			couvrir l'essentiel : les lignes supplémentaires méritent alors une raison claire.
		</p>,

		retenir: [
			'Un ETF diversifie à très faible coût en détenant des centaines d\'entreprises avec une seule ligne.',
			'Les frais courants se cumulent chaque année : un point d\'écart pèse lourd sur 30 ans.',
			'Ajouter des ETF thématiques sur un ETF monde crée souvent des doublons, pas de la diversification.',
		],
	},
};
