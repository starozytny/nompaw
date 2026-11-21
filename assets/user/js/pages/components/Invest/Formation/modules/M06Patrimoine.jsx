import React from 'react';

import { Callout, DataTable } from "@userPages/Invest/Formation/ui/LessonBlocks";

// Source : docs/formation/06-patrimoine.md
export const M06Patrimoine = {
	module: 6,
	slug: 'patrimoine',
	titre: 'Construire son patrimoine : le temps, la régularité et la retraite',
	duree_minutes: 14,
	niveau: 'debutant',
	prerequis: ['fiscalite'],
	deblocage: null,
	indicateur: "Progression vers l'objectif retraite, versement prévu et réel",
	termes: ['patrimoine', 'intérêts composés', 'investissement programmé', 'PER', 'retraite par répartition'],
	definitions: {
		'patrimoine': 'Ensemble de ce que tu possèdes moins ce que tu dois : épargne, placements, bien immobilier, moins les dettes.',
		'intérêts composés': 'Mécanisme par lequel tes gains produisent eux-mêmes des gains, année après année.',
		'investissement programmé': 'Versement d\'un même montant à intervalle régulier, sans chercher le bon moment pour investir.',
		'PER': "Plan d'épargne retraite : enveloppe dont les versements peuvent réduire l'impôt, mais dont l'argent est bloqué jusqu'à la retraite sauf cas prévus.",
		'retraite par répartition': 'Système où les cotisations des actifs paient les pensions des retraités du moment.',
	},
	chiffre_cle: { valeur: '≈ 301 400 €', libelle: 'de capital pour 108 000 € versés', contexte: '300 € par mois pendant 30 ans à 6 % par an (hypothèse non garantie)' },
	verifier: [
		'rendement de 6 % (hypothèse, non garanti)',
		'niveau de pension par rapport au dernier salaire',
		'cas de déblocage anticipé du PER',
		'plafond de déduction des versements au PER',
	],
	maj: '2026-11-20',
	quiz: [
		{
			question: 'Que sont les intérêts composés ?',
			options: [
				'Des gains calculés uniquement sur le capital de départ',
				'Des gains qui produisent eux-mêmes des gains au fil du temps',
				"Un impôt prélevé sur l'épargne",
			],
			reponse: 1,
			explication: "Chaque année, les gains s'ajoutent au capital et produisent à leur tour des gains : c'est ce qui rend le temps si puissant.",
		},
		{
			question: "Dans l'exemple à 30 ans, quelle part du capital final provient des sommes versées ?",
			options: ['Environ 36 %', 'Environ 64 %', '100 %'],
			reponse: 0,
			explication: '108 000 € versés sur environ 301 400 € de capital, soit 36 % : les 64 % restants viennent des gains, grâce aux intérêts composés.',
		},
		{
			question: "Pourquoi commencer tôt avec un petit montant vaut-il mieux qu'attendre d'avoir plus d'argent ?",
			options: [
				'Les frais baissent avec le temps',
				'Les intérêts composés ont plus d\'années pour travailler',
				'Les marchés montent toujours',
			],
			reponse: 1,
			explication: "Dans l'exemple, 10 ans de plus à 300 € par mois font passer le capital d'environ 138 600 € à 301 400 € : le temps pèse plus que le montant.",
		},
	],
	sections: {
		concept: <p>
			Ton <strong>patrimoine</strong> est ce que tu possèdes moins ce que tu dois. Il se construit surtout par le temps et
			la régularité : grâce aux <strong>intérêts composés</strong>, tes gains produisent eux-mêmes des gains.
			L'<strong>investissement programmé</strong> consiste à verser le même montant à intervalle régulier, sans chercher
			le bon moment. Pour la retraite, la <strong>retraite par répartition</strong> repose sur les cotisations des actifs,
			et un <strong>PER</strong> permet de la compléter avec une épargne bloquée jusqu'à la retraite.
		</p>,

		pourquoi: <>
			<p>
				La pension d'État ne remplacera sans doute qu'une partie de ton dernier salaire (à vérifier). Plus tu commences
				tôt, moins l'effort mensuel nécessaire pour compléter est lourd. Voici l'effet du temps avec le même versement
				de <strong>300 € par mois</strong> et une performance hypothétique de 6 % par an :
			</p>
			<DataTable
				columns={['Durée', 'Total versé', 'Capital estimé']}
				align={['left', 'right', 'right']}
				rows={[
					['10 ans', '36 000 €', 'environ 49 200 €'],
					['20 ans', '72 000 €', 'environ 138 600 €'],
					['30 ans', '108 000 €', 'environ 301 400 €'],
				]}
			/>
			<Callout tone="warning">
				<strong>Attention :</strong> ces chiffres supposent un rendement régulier, ce qui n'existe pas : les marchés
				montent et descendent. Une réserve de précaution passe avant tout investissement long.
			</Callout>
		</>,

		exemple: <p>
			Sur 30 ans, tu verses <strong>108 000 €</strong> et le capital estimé atteint environ <strong>301 400 €</strong>.
			Environ 36 % du capital vient de tes versements et 64 % des gains. Les 10 dernières années produisent à elles
			seules plus de la moitié du total : c'est l'effet des intérêts composés. Commencer 10 ans plus tard, avec le même
			versement, ramène le capital de 301 400 € à environ 138 600 €. Pour rattraper l'écart, il faudrait verser bien plus
			chaque mois.
		</p>,

		erreur: <p>
			Attendre d'avoir « plus d'argent » ou « le bon moment » pour commencer. Pendant ce temps, les années passent et les
			intérêts composés ne travaillent pas, alors qu'un petit versement régulier démarre déjà le mécanisme. On peut
			commencer modestement, une fois la réserve de précaution posée, puis augmenter les versements quand le revenu
			progresse.
		</p>,

		suivi: <p>
			Deux indicateurs : le <strong>versement prévu et le versement réel</strong> de chaque mois (un virement oublié est
			un mois de composition perdu) et la <strong>progression vers l'objectif retraite</strong>, c'est-à-dire le capital
			déjà constitué comparé à la cible. Une fois par an, une revue suffit : on vérifie les versements, on rééquilibre si
			besoin et on met à jour la cible, sans réagir aux fluctuations du quotidien.
		</p>,

		retenir: [
			'Le temps et la régularité pèsent plus que le montant : les intérêts composés font l\'essentiel du travail.',
			'La pension d\'État ne remplacera pas tout le salaire : PEA, assurance-vie ou PER complètent la retraite.',
			'Une revue par an suffit pour vérifier versements, allocation et objectif, sans réagir aux fluctuations du quotidien.',
		],
	},
};
