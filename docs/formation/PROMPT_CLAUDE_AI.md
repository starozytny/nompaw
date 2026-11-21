# Prompt à coller dans claude.ai pour rédiger un module

Joins le fichier `_FORMAT.md` à la conversation (ou colle son contenu), puis colle le texte ci-dessous en remplaçant les [crochets].

---

Rédige le module de formation n°[NN] sur le thème : **[thème, ex. « ETF et fonds indiciels »]**.

**Format** : respecte strictement `_FORMAT.md` (joint) : frontmatter YAML complet, 6 sections dans l'ordre, mise en forme limitée aux éléments du tableau « Mise en forme autorisée ». Le fichier est intégré tel quel dans un site, tout écart casse l'affichage.

**Livrable** : un seul fichier Markdown complet dans un bloc de code, nommé `[NN]-[slug].md` (slug en minuscules avec tirets). Rien d'autre autour : pas de résumé, pas de variante.

**Points à ne pas oublier** :
- `module: [NN]`, `prerequis: ["[slug du module précédent]"]`, `maj:` à la date du jour (AAAA-MM-JJ).
- `termes` : 3 à 5 termes, chacun avec sa définition d'une phrase dans `definitions` (mêmes clés, même orthographe).
- `chiffre_cle` : le chiffre le plus parlant de l'« Exemple chiffré » (`valeur` courte, ex. « 7 % » ou « 12 400 € », `libelle` en minuscules, `contexte` d'une ligne).
- Quiz de 3 questions, chacune vérifie la section qui la précède sur le site : Q1 → « Le concept », Q2 → « Exemple chiffré », Q3 → « L'erreur classique ». 3 options courtes, `reponse` = index à partir de 0, `explication` d'1 ou 2 phrases.
- Taux, plafonds, règles fiscales : écrire « (à vérifier) » dans le texte et les lister dans `verifier`.
- `deblocage` : une condition conseillée en clair si le module a plus de sens après un jalon réel (ex. « épargne de précaution ≥ 3 mois »), sinon `null`. Elle s'affiche à titre indicatif : tous les chapitres restent consultables.
- Les exemples chiffrés peuvent s'appuyer sur ma situation (brief INVEST_CONTEXT : 2 260 € de revenu, PEA/AV/CTO à 100 €/mois chacun, etc.), présentée comme un cas d'étude, jamais comme un conseil.
- Termine le corps par : *Contenu pédagogique, pas un conseil financier personnalisé.*

**Parcours existant** (pour les prérequis et éviter les redites) :
- 00 `revenus-reels` — Revenus réels, transferts et remboursements
- 01 `budget-epargne` — Budget, taux d'épargne et enveloppes
- 02 `enveloppes` — Les enveloppes : livrets, assurance-vie, PEA et CTO
- 03 `etf-fonds` — ETF et fonds : diversifier à faible coût
- 04 `allocation` — Allocation, risque et horizon de placement
- 05 `fiscalite` — La fiscalité des placements : comprendre l'impôt sur tes gains
- 06 `patrimoine` — Construire son patrimoine : le temps, la régularité et la retraite
- [ajoute ici chaque nouveau module validé]

---

## Ensuite, côté Claude Code

Dépose le fichier dans `docs/formation/` puis dis simplement :

> intègre docs/formation/[NN]-[slug].md

Claude Code crée `modules/M[NN][Slug].jsx`, l'ajoute au parcours, retire le thème des « Prochains chapitres » s'il y figure, et vérifie l'affichage.
