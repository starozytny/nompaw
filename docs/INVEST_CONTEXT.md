# Brief : suivi des investissements dans Nompaw.fr

Contexte : intégrer dans Nompaw.fr un suivi de mes finances/investissements. Les données ci-dessous sont l'état au 04/11/2026. L'analyse et l'ajustement du plan restent faits avec Claude (chat) à partir des exports de l'app. Stack et structure de Nompaw.fr : à lire dans le repo, ne rien supposer.

## Objectif fonctionnel (MVP)

- Saisir/éditer les positions par enveloppe (PEA, CTO, AV, livrets) et par ligne (ETF, fonds euros)
- Enregistrer les versements mensuels (prévu vs réel)
- Enregistrer des snapshots de valorisation (date, valeur par ligne) pour suivre investi vs valeur actuelle
- Afficher : allocation en % par enveloppe et par ligne, total investi, évolution dans le temps
- Suivi des enveloppes d'épargne projet (ex. tatouage : objectif 2 500 €)
- Export CSV/JSON des données pour analyse externe

## Revenus et budget mensuel

- Revenu : 2 260 €
- Charges fixes (après optimisation) ≈ 784 € : crédit immo 485 (1,3 %, 25 ans, ~3 ans écoulés), assurance auto 44, EDF 30, bus 68 (remboursé 50 % par l'employeur), mobile 12, fibre 25, assurance habitation 17 (L'Olivier, franchise 150, en remplacement de BCPE à 30), cotisation BCPE ~10 (passage prévu en formule Confort, 23 aujourd'hui), taxe foncière 93
- Enveloppes mensuelles hors investissement = 700 € : voyage 200, imprévu 100, révision voiture 50, voiture 50, plaisir 100, appartement 50, parents 25, cadeaux 25, tatouage 100
- Virement vie courante : 250 € (+ ~200 €/mois de carte restaurant utilisée pour les courses)
- Investissement : 300 €/mois (100 PEA, 100 AV, 100 CTO)
- Reste estimé ≈ 226 €/mois (bus compté en brut). À recalculer dans l'app.

## Positions

### PEA XTB (ouvert janvier 2026, exonération fiscale à partir de janvier 2031)
| Ligne | Valeur |
|---|---|
| MSCI World ETF | 509,21 € |
| MSCI Europe ETF | 158,84 € |
| BNP Paribas Easy Bloomberg Europe Defense Acc (LU3047998896) | 92,44 € |
| Cash à investir | 58,57 € (prévu : MSCI World) |

Règle d'allocation actuelle : MSCI World en priorité à chaque versement, Europe et Défense sans ajout pour l'instant. Versement : 100 €/mois.

### AV Linxea (~1 051 €)
| Ligne | Valeur |
|---|---|
| Fonds euros FONDSEURNG | 400 € |
| Amundi MSCI World Swap Acc (LU1681043599) | 320,95 € |
| Amundi Core Nasdaq-100 Swap Acc (LU1829221024) | 330,14 € |

Versement : 100 €/mois, aujourd'hui 40 fonds euros / 30 MSCI World / 30 Nasdaq-100.
Envisagé, pas encore validé : 40 / 30 / 20 Amundi MSCI Emerging Markets Acc (LU1681045370) / 10 Nasdaq-100, pour diversifier.

### CTO XTB (~350 €, détail des lignes non communiqué)
Versement : 100 €/mois. À compléter dans l'app. Une vente de 50 € de MSCI World (acheté par erreur sur le CTO) a été faite pour racheter dans le PEA : gain 3,97 €, flat tax ~1,19 €, à vérifier dans l'IFU XTB (déclaration en mai 2027).

### Liquidités
- Épargne de précaution : ~2 000 € (≈ 2,5 mois de charges fixes), imprévu alimenté à 100 €/mois, cible 3 mois
- Livret A : 1 080 € (ancien « retraite »), destination non décidée (piste : répartir PEA/CTO/AV)

## Décisions déjà prises

- Pas de PER (TMI 11 %, avantage fiscal trop faible, impôt annuel ~500 €)
- Versement mensuel de 100 € sur chacun des trois produits (PEA, AV, CTO)
- Ne jamais retirer du PEA avant 2031
- Crédit immo à 1,3 % : on n'y touche pas

## Points ouverts

- Affectation des 1 080 € du Livret A
- Choix final de la répartition mensuelle de l'AV (diversification hors Nasdaq)
- Détail des lignes du CTO
