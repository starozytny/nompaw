import React from 'react';

import { Callout, DataTable } from "@userPages/Invest/Formation/ui/LessonBlocks";

// Source : docs/formation/05-fiscalite.md
export const M05Fiscalite = {
	module: 5,
	slug: 'fiscalite',
	titre: "La fiscalité des placements : comprendre l'impôt sur tes gains",
	duree_minutes: 12,
	niveau: 'debutant',
	prerequis: ['allocation'],
	deblocage: null,
	indicateur: 'Ancienneté fiscale, gains réalisés et latents',
	termes: ['plus-value', 'flat tax', 'prélèvements sociaux', 'abattement', 'ancienneté fiscale'],
	definitions: {
		'plus-value': "Gain réalisé quand tu vends un placement plus cher que tu ne l'as acheté.",
		'flat tax': "Taux forfaitaire unique d'environ 30 % appliqué aux gains d'un compte-titres ordinaire, impôt et prélèvements sociaux compris.",
		'prélèvements sociaux': "Contributions prélevées sur les gains, quelle que soit l'enveloppe, qui financent la protection sociale.",
		'abattement': "Somme de gains retirée de la base imposable avant de calculer l'impôt.",
		'ancienneté fiscale': "Durée écoulée depuis l'ouverture d'une enveloppe, qui conditionne ses avantages (5 ans pour le PEA, 8 ans pour l'assurance-vie).",
	},
	chiffre_cle: { valeur: '≈ 900 €', libelle: "d'impôt sur 3 000 € de gains au CTO", contexte: 'contre environ 540 € dans un PEA de plus de 5 ans (taux à vérifier)' },
	verifier: [
		'taux de la flat tax',
		'taux des prélèvements sociaux',
		"abattement annuel de l'assurance-vie après 8 ans",
		"conséquences d'un retrait de PEA avant 5 ans",
		'règles de déclaration des gains',
	],
	maj: '2026-11-20',
	quiz: [
		{
			question: "À quel moment l'impôt sur un gain est-il dû ?",
			options: [
				'Dès que la valeur du placement augmente',
				'Quand le gain est réalisé, par une vente ou un retrait',
				'Chaque 1er janvier, sur la valeur totale du portefeuille',
			],
			reponse: 1,
			explication: "Une hausse non vendue est une plus-value latente : elle n'est imposée que lorsque tu vends ou que tu retires.",
		},
		{
			question: "Dans l'exemple, quel est l'impôt sur 3 000 € de gains au CTO ?",
			options: ['300 €', '900 €', '1 500 €'],
			reponse: 1,
			explication: 'La flat tax représente environ 30 % des gains : 3 000 × 0,30 = 900 €.',
		},
		{
			question: "Tu as ouvert un PEA il y a 2 ans et tu y retires de l'argent. Que risque-t-il de se passer ?",
			options: [
				'Rien de particulier',
				"Tu perds l'avantage fiscal et le plan peut être clôturé (à vérifier)",
				'Tes frais sont supprimés',
			],
			reponse: 1,
			explication: "Le PEA récompense la patience : un retrait avant 5 ans fait perdre l'avantage fiscal et entraîne en principe la clôture du plan.",
		},
	],
	sections: {
		concept: <p>
			L'impôt sur un placement ne porte que sur ton gain, la <strong>plus-value</strong>, et seulement au moment où tu la
			réalises, par une vente ou un retrait. Tant que tu ne vends pas, la hausse reste « latente » et n'est pas imposée.
			Sur un compte-titres ordinaire, la <strong>flat tax</strong> s'applique : environ 30 % du gain, dont une part
			de <strong>prélèvements sociaux</strong>. Les enveloppes comme le PEA et l'assurance-vie allègent cet impôt avec le
			temps : c'est l'<strong>ancienneté fiscale</strong>, et un <strong>abattement</strong> peut réduire encore la base
			imposable.
		</p>,

		pourquoi: <>
			<p>
				Le rendement affiché n'est pas ce que tu gardes : l'impôt prélève une part des gains, et son poids varie selon le
				contenant. Voici les grandes règles pédagogiques, avec leurs seuils d'ancienneté :
			</p>
			<DataTable
				columns={['Enveloppe', 'Ancienneté utile', 'Imposition des gains']}
				rows={[
					[<strong>CTO</strong>, 'Aucune', "Flat tax d'environ 30 % à chaque vente (à vérifier)"],
					[<strong>PEA</strong>, '5 ans', 'Prélèvements sociaux seuls après 5 ans (à vérifier)'],
					[<strong>Assurance-vie</strong>, '8 ans', "Prélèvements sociaux, plus un impôt réduit au-delà d'un abattement annuel (à vérifier)"],
				]}
			/>
			<Callout tone="warning">
				<strong>Attention :</strong> les règles fiscales changent presque chaque année avec les lois de finances. Ce module
				explique la logique, pas ton calcul d'impôt : vérifie les taux en vigueur sur les sites officiels ou auprès d'un
				professionnel.
			</Callout>
		</>,

		exemple: <>
			<p>
				Imaginons <strong>3 000 €</strong> de gains réalisés dans trois contenants, avec des taux arrondis :
			</p>
			<DataTable
				columns={['Contenant', 'Calcul', 'Impôt estimé']}
				align={['left', 'left', 'right']}
				rows={[
					['CTO', '3 000 € × 30 %', 'environ 900 €'],
					['PEA de plus de 5 ans', '3 000 € × 18 % (prélèvements sociaux)', 'environ 540 €'],
					['Assurance-vie de plus de 8 ans', "gains sous l'abattement : prélèvements sociaux seuls", 'environ 540 €'],
				]}
			/>
			<p>
				Sur ces gains, le CTO coûte environ 360 € de plus. Dans un PEA ou une assurance-vie, tu peux aussi vendre une
				ligne pour en racheter une autre sans payer d'impôt tant que l'argent reste dans l'enveloppe : au CTO, chaque
				vente avec gain est imposée.
			</p>
		</>,

		erreur: <p>
			Retirer de l'argent d'une enveloppe juste avant son seuil d'ancienneté, ou clôturer un PEA trop tôt, par manque de
			réserve ou par impatience. On perd alors l'avantage fiscal que le temps avait construit, parfois pour quelques mois
			seulement. D'où l'intérêt de ne jamais financer ses imprévus avec une enveloppe longue.
		</p>,

		suivi: <p>
			Deux indicateurs : l'<strong>ancienneté fiscale</strong> (la date d'ouverture de chaque enveloppe et le temps
			restant avant les seuils de 5 ans et de 8 ans) et les <strong>gains latents ou réalisés</strong> par enveloppe, pour
			savoir ce qui serait imposé en cas de vente. Un PEA ouvert en 2026 n'atteint son seuil qu'en 2031 : le compte à
			rebours fait partie de la stratégie.
		</p>,

		retenir: [
			"L'impôt ne porte que sur les gains réalisés : tant que tu ne vends pas, rien n'est dû.",
			"PEA et assurance-vie réduisent l'impôt avec le temps : l'ancienneté a une valeur.",
			'Les règles fiscales évoluent : vérifie toujours les taux en vigueur avant de décider.',
		],
	},
};
