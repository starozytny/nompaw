import React from 'react';

import { DataTable } from "@userPages/Invest/Formation/ui/LessonBlocks";

// Source : docs/formation/00-revenus-reels.md
export const M00RevenusReels = {
	module: 0,
	slug: 'revenus-reels',
	titre: 'Revenus réels, transferts et remboursements',
	duree_minutes: 8,
	niveau: 'debutant',
	prerequis: [],
	deblocage: null,
	indicateur: 'Revenu net réel, dépenses nettes',
	termes: ['revenu réel', 'transfert', 'remboursement', 'dépense nette'],
	definitions: {
		'revenu réel': "Argent qui entre dans ton patrimoine : salaire, revenus d'une activité, intérêts.",
		'transfert': 'Argent qui change simplement de poche entre tes propres comptes.',
		'remboursement': 'Argent qui annule une dépense que tu avais avancée.',
		'dépense nette': 'Dépenses brutes moins les remboursements qui leur sont rattachés.',
	},
	chiffre_cle: { valeur: '37 900 €', libelle: 'de revenu réel', contexte: 'au lieu des 53 824 € affichés par le bilan brut' },
	verifier: [],
	maj: '2026-11-20',
	quiz: [
		{
			question: 'Tu vires 300 € de ton compte courant vers ta carte de loisirs. Comment le classer ?',
			options: [
				'Un revenu pour la carte de loisirs',
				'Un transfert entre tes comptes',
				'Une épargne',
			],
			reponse: 1,
			explication: "L'argent reste à toi : il change de poche, il n'entre pas et ne sort pas de ton patrimoine. Ce n'est ni un revenu ni une épargne.",
		},
		{
			question: 'Un ami te rembourse 80 € pour sa part d\'un restaurant que tu as avancée. Où le placer ?',
			options: [
				'En revenu, catégorie Salaire',
				'En transfert',
				'En remboursement, rattaché à la dépense du restaurant',
			],
			reponse: 2,
			explication: "Ce n'est pas un gain : il annule une partie de ta dépense. Rattaché au restaurant, il donne ta dépense nette réelle.",
		},
		{
			question: 'Ton bilan affiche 54 000 € de revenus, dont 10 000 € de transferts. Quel est ton revenu réel ?',
			options: ['54 000 €', '44 000 €', '10 000 €'],
			reponse: 1,
			explication: 'On retire les transferts : 54 000 − 10 000 = 44 000 €, avant de retirer aussi les remboursements pour mesurer ce que tu gagnes vraiment.',
		},
	],
	sections: {
		concept: <p>
			Un <strong>revenu réel</strong> est de l'argent qui entre dans ton patrimoine : salaire, revenus d'une
			activité, intérêts. Un <strong>transfert</strong> est de l'argent qui change simplement de poche (du compte
			courant vers l'épargne, vers une autre carte). Un <strong>remboursement</strong> est de l'argent qui annule
			une dépense que tu avais avancée. Seul le premier est un vrai gain.
		</p>,

		pourquoi: <p>
			Tous tes calculs reposent sur le revenu : taux d'épargne, reste à vivre, capacité d'investissement. Si on y
			mélange des transferts, le revenu paraît plus gros qu'il ne l'est, et on se croit plus riche qu'on ne l'est.
			Même chose côté dépenses : sans rattacher les remboursements, on surestime ce que coûte vraiment la vie.
		</p>,

		exemple: <>
			<p>Un bilan annuel affiche <strong>53 824 €</strong> de revenus. En le décomposant :</p>
			<DataTable
				columns={['Ligne', 'Montant', 'Nature']}
				align={['left', 'right', 'left']}
				rows={[
					['Salaire', '37 257 €', 'Revenu réel'],
					['Transferts', '10 275 €', 'Mouvements entre tes comptes'],
					['Remboursements', '5 691 €', 'Dépenses annulées (voyage, abonnements partagés…)'],
					['Divers', '~600 €', 'À qualifier'],
				]}
			/>
			<p>
				Le revenu réel est proche de <strong>37 900 €</strong>, et non 53 824 €. Les 5 691 € de remboursements ne
				sont pas un revenu : ils viennent réduire les dépenses brutes pour donner des <strong>dépenses nettes</strong>.
			</p>
			<p>
				Autre détail : une carte restaurant de 200 €/mois fait partie de ta rémunération. Elle ajoute 2 400 €/an
				de revenu et 2 400 €/an de dépense (alimentation) qu'il faut comptabiliser, sinon les deux sont sous-estimés.
			</p>
		</>,

		erreur: <p>
			Compter l'argent <strong>deux fois</strong> : une fois quand tu le vires vers une autre carte ou une poche
			d'épargne, une seconde fois quand il est dépensé ou investi. Règle simple : un virement entre tes propres
			comptes n'est jamais une dépense ni un revenu.
		</p>,

		suivi: <p>
			Chaque opération doit porter l'un de ces types : <strong>revenu</strong>, <strong>dépense</strong>,{' '}
			<strong>remboursement</strong> (rattaché à une catégorie) ou <strong>transfert</strong>. Les indicateurs du
			site (revenu net réel, dépenses nettes) se calculent en excluant les transferts. Une opération « sans
			catégorie » est un signal d'alerte : elle fausse tout ce qui suit.
		</p>,

		retenir: [
			'Revenu réel = ce qui enrichit vraiment ; transfert = changement de poche.',
			'Un remboursement se rattache à la dépense qu\'il compense.',
			'Vérifie ta catégorisation avant toute analyse : des données fausses donnent des conclusions fausses.',
		],
	},
};
