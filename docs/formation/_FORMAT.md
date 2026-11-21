# Format d'un module de formation

Un module = un fichier Markdown nommé `NN-slug.md` (ex. `00-revenus-reels.md`).
Le site lit le **frontmatter YAML** (métadonnées + quiz) et affiche le **corps Markdown** comme leçon.

## Frontmatter

```yaml
---
module: 0                       # numéro, sert à l'ordre
slug: revenus-reels
titre: "Revenus réels, transferts et remboursements"
duree_minutes: 8
niveau: debutant
prerequis: []                   # slugs des modules conseillés avant (indicatif : n'empêche pas la lecture)
deblocage: null                 # condition conseillée, affichée à titre indicatif, ex. "reserve >= 3 mois"
indicateur: "Revenu net réel, dépenses nettes"   # lien avec le suivi du site
termes: ["revenu réel", "transfert"]             # entrées du glossaire citées
definitions:                    # une définition courte par terme (affichée dans le lexique)
  revenu réel: "Argent qui entre dans ton patrimoine..."
  transfert: "Argent qui change de poche entre tes comptes."
chiffre_cle:                    # le chiffre mis en avant dans « Exemple chiffré »
  valeur: "37 900 €"
  libelle: "de revenu réel"
  contexte: "au lieu des 53 824 € affichés par le bilan brut"
verifier: ["plafond Livret A"]  # chiffres susceptibles de changer, à revérifier
maj: 2026-11-20
quiz:
  - question: "..."
    options: ["A", "B", "C"]
    reponse: 1                  # index de la bonne option, à partir de 0
    explication: "..."
---
```

## Corps (sections obligatoires, dans cet ordre)

1. `## Le concept` : 3-4 phrases, sans jargon.
2. `## Pourquoi ça compte` : l'impact concret au quotidien.
3. `## Exemple chiffré` : un cas avec des chiffres réalistes.
4. `## L'erreur classique` : le piège à éviter.
5. `## Dans ton suivi` : l'indicateur du site qui illustre le concept.
6. `## À retenir` : 3 puces maximum.

## Mise en forme autorisée dans le corps

Le site transcrit chaque élément vers un composant précis : n'utilise que ceux-ci.

| Markdown | Rendu sur le site |
|---|---|
| Paragraphe simple | Paragraphe |
| `**gras**` | Terme mis en valeur (à utiliser à la 1re apparition d'un terme de `termes`) |
| Tableau Markdown | Tableau (colonnes de montants alignées à droite) |
| Liste à puces `-` | Liste de chiffres / étapes (max 4 puces) |
| `> Attention : ...` | Encadré d'alerte orange (max 1 par module) |

Interdits dans le corps : titres supplémentaires (`###`), images, liens, code, listes imbriquées, italique décoratif.
« L'erreur classique » s'affiche en grande citation : 1 seul paragraphe court (3-4 phrases), sans tableau ni liste.
« À retenir » : exactement 3 puces d'une phrase chacune.

## Règles de rédaction

- Ton de professeur qui s'adresse à un débutant : on définit chaque terme à sa première apparition.
- Contenu pédagogique, jamais un conseil personnalisé. Chaque module se termine par la mention : *« Contenu pédagogique, pas un conseil financier personnalisé. »*
- Taux, plafonds et règles fiscales : toujours signalés « à vérifier » et listés dans `verifier`.
- Quiz : 3 questions, une bonne réponse, explication obligatoire.
- Sur le site, les questions du quiz sont des **points de contrôle** placés dans la leçon : la 1re après « Le concept », la 2e après « Exemple chiffré », la 3e après « L'erreur classique ». Écris chaque question pour qu'elle porte sur la section qui la précède.
- Chaque terme de `termes` doit avoir sa définition dans `definitions`.
