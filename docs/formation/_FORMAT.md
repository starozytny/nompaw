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
prerequis: []                   # slugs des modules à valider avant
deblocage: null                 # condition d'accès, ex. "reserve >= 3 mois" (modules investissement)
indicateur: "Revenu net réel, dépenses nettes"   # lien avec le suivi du site
termes: ["revenu réel", "transfert"]             # entrées du glossaire citées
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

## Règles de rédaction

- Ton de professeur qui s'adresse à un débutant : on définit chaque terme à sa première apparition.
- Contenu pédagogique, jamais un conseil personnalisé. Chaque module se termine par la mention : *« Contenu pédagogique, pas un conseil financier personnalisé. »*
- Taux, plafonds et règles fiscales : toujours signalés « à vérifier » et listés dans `verifier`.
- Quiz : 3 questions, une bonne réponse, explication obligatoire.
