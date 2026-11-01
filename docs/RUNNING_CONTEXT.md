# Contexte : plan d'entraînement course (Shanbo)

À placer dans le projet Nompaw (ex. `docs/running-context.md`) et à référencer depuis `CLAUDE.md` :
`Pour tout ce qui touche à la section running, lis docs/running-context.md.`

## Profil
- Homme, 31 ans, 1,77 m, 90 kg (objectif 80 kg au 10 oct 2027, ≈ 1 kg/mois, 0,2–0,3 kg/sem.). Garmin Fenix 7.
- FC max ≈ 205, FC de seuil ≈ 180. Zones : Z1 < 145, Z2 145–160, Z3 160–175, Z4 175–187, Z5 > 187.
- Niveau : 9,7 km en 55:18 (avril 2026) ≈ 57:00 sur 10 km (Riegel, exposant 1,06), VDOT ≈ 35. Volume récent ≈ 5 km/sem. avant le plan.
- Contraintes : Pilates mardi 18–19h ; courses en semaine à partir de 18h (parfois 12h30–13h45, 30 min max) ; 3 sorties/semaine (4 à partir de la semaine 40) ; renfo le lundi (circuit jambes) et gainage le jeudi.

## Courses
| Date | Épreuve | Objectif |
|---|---|---|
| 1er nov 2026 | 11 km mixte (50 % sentier) | course d'entraînement, 1h15–1h22 |
| 29 nov 2026 | Trail 18 km, D+ 550 | 2h35–2h55 |
| 14 mars 2027 | Semi-marathon | 2h10 (6:09/km) |
| 15 mai 2027 (samedi) | Trail 28 km, D+ 1 000, Montbrison (Au cœur du Forez), départ 8h, limite 5h | ≈ 4h00–4h40 |
| 10 oct 2027 | Semi de Salon-de-Provence | sub-2h (5:40/km) si poids ≈ 81 kg et 10 km ≤ 53:30 ; sinon 2h05 ou 2h10 |

## Lignes d'allure (par niveau de 10 km)
| Ligne | EF | Seuil | Intervalles | Allure semi |
|---|---|---|---|---|
| 1h02 | 7:20–7:50 | 6:17–6:22 | 5:52–5:57 | 6:27 |
| 59:00 | 7:05–7:35 | 5:59–6:04 | 5:34–5:39 | 6:09 |
| 57:00 | 6:50–7:20 | 5:47–5:52 | 5:22–5:27 | 5:57 |
| 53:00 | 6:25–6:55 | 5:23–5:28 | 4:58–5:03 | 5:40 |

## Règles de décision (tests)
- 20 déc 2026, 5 km : ≤ 28:30 → ligne 59:00.
- 24 jan 2027, 10 km : ≤ 59:30 → ligne 59:00.
- 21 fév 2027, 10 km : ≤ 57:30 → viser 2h05 ; ≤ 59:30 → 2h10 ; 59:30–63:00 → 2h15–2h20 ; > 63:00 → 2h20+.
- 27 juin 2027, 5 km (cible ≈ 25:45) ; 5 sept, 10 km (≤ 55:30) ; 26 sept, 10 km décisif : ≤ 53:30 → sub-2h ; ≤ 57:30 → 2h05 ; ≤ 59:30 → 2h10.
- Si un test est nettement en dessous du résultat attendu : garder la ligne précédente 2 semaines de plus.

## Structure du plan (semaines numérotées, 3 à 52)
- Les semaines 1–2 (13–25 oct 2026) n'ont pas été suivies. Plan démarré à la semaine 3.
- Phase 1 (S3, 11 km) · 2 (trail 18 km, nov) · 3 (base et vitesse, déc–jan) · 4 (semi, fév–mars, pic 33 km en S20) · 5 (trail 28 km, S23–S31) · 6 (semi de Salon, S32–S52, pic 43 km en S49).
- Principe : 80/20, progression ≤ 10 %/semaine, une semaine d'allègement toutes les 3–4 semaines, affûtage sur 2 semaines.
- Chaque séance : échauffement, blocs, retour au calme, avec allures, repos (durée et vitesse) et zones FC. Circuit jambes : 3 tours, 30 s entre exercices, 60 s entre tours, tempo 3 s/1 s. Gainage : 3 tours, 20 s/45 s. Deux modes de lecture : avec explication, sans explication.

## Fonction « Suivi du réalisé » (sans backend, localStorage)
- Clés : `runlog_v1` (séances par date ISO : done, km, dur, hr, hrmax, rpe, note, src), `runhist_v1` (historique importé), `runmeta_v1` (notes, pesées).
- Import du CSV Garmin Connect (Activités → Exporter en CSV) : rattache les courses aux dates du plan sans écraser les saisies manuelles ; l'historique alimente volumes mensuels, records et prédicteur (Riegel).
- Bilan à copier : résumé compact (prévu/réalisé, allures, FC, ressenti, poids, notes) à coller dans une conversation pour ajuster les semaines suivantes.
- Sauvegarde JSON, import JSON, réinitialisation. Aucune IA dans la page ; l'analyse se fait dans la conversation.
- Si le projet utilise Symfony/React : la persistance peut passer du localStorage à la base (une entité par séance et une pour les pesées) ; les formats ci-dessus servent de schéma.

## Journal des bilans
- Bilan S3 : voir ci-dessus.

## Règles quand tu modifies le plan
- Garder la cohérence : lignes d'allure ↔ séances ↔ checkpoints ↔ fiches de course ↔ phases.
- Ne jamais mettre de déficit calorique la semaine d'une course ni sur les semaines de pic.
- Toute douleur localisée > 3 jours : sauter la séance et adapter.
- La FC prime sur l'allure en endurance : en EF (et sorties longues), la consigne principale est FC 145–160 bpm (au-delà
  de 160, ralentis ou marche 30 s) ; l'allure affichée n'est qu'un repère indicatif.

## Points ouverts
- VO₂max, FC de repos, VFC de la Fenix à fournir (pour affiner).
- Blessure ou gêne en cours ? Profil du semi du 14 mars (dénivelé) ?
- Images des exercices (stepup.gif, birddog.gif) à vérifier.
- API Garmin personnelle (récupération automatique) : à vérifier si Shanbo veut automatiser l'import. Strava interdit l'usage IA de ses données via API.
