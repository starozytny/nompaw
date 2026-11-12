  // ─────────────────────────────────────────────────────────────────
  // DATA
  // ─────────────────────────────────────────────────────────────────

  // ── NIVEAUX D'ALLURE (selon le dernier test 10 km) : [niveau, EF, SEU, INT, AS] ──
  const LV = [
    ['1h02','7:20–7:50','6:17–6:22','5:52–5:57','6:27'],
    ['59:00','7:05–7:35','5:59–6:04','5:34–5:39','6:09'],
    ['57:00','6:50–7:20','5:47–5:52','5:22–5:27','5:57'],
    ['53:00','6:25–6:55','5:23–5:28','4:58–5:03','5:40'],
  ];
  const B = (name,dur,desc,allure,zone,color,lite) => ({name,dur,desc,allure,zone,color,lite});
  const S = (type,typeLabel,emoji,short,objectif,phases,conseil,nutrition) =>
    ({type,typeLabel,emoji,short,detail:{objectif,phases,conseil:conseil||'',nutrition:nutrition||''}});

  // ── Utilitaires de durée ──
  const toSec = (s) => {
    s = String(s).trim(); let m;
    if ((m = s.match(/^(\d+)'(\d+)?$/))) return +m[1]*60 + (m[2] ? +m[2] : 0);
    if ((m = s.match(/^(\d+)"$/))) return +m[1];
    return null;
  };
  const paceSec = (p) => { const m = String(p).match(/(\d+):(\d+)/); return +m[1]*60 + +m[2]; };
  // La FC prime sur l'allure en endurance : l'allure EF affichée est élargie de 10 s/km en haut
  // de fourchette et devient un repère indicatif (voir docs/RUNNING_CONTEXT.md, bilan S3).
  const widenEFPace = (range) => {
    const [lo, hi] = range.split('–');
    const [hm, hs] = hi.split(':').map(Number);
    const total = hm*60 + hs + 10;
    return `${lo}–${Math.floor(total/60)}:${String(total%60).padStart(2,'0')}`;
  };
  const repSec = (t, pace) => {
    const s = toSec(t); if (s !== null) return s;
    const m = String(t).match(/^([\d\s]+)\s*(km|m)$/);
    const meters = parseFloat(m[1].replace(/\s/g,'')) * (m[2] === 'km' ? 1000 : 1);
    return meters / 1000 * paceSec(pace);
  };
  const fmtMin = (sec) => '≈ ' + Math.max(1, Math.round(sec/60)) + ' min';

  function H(l){
    const [,EF,SEU,INT,AS] = LV[l];
    const ef = EF+' /km', seu = SEU+' /km', int = INT+' /km', as = AS+' /km';
    const efFC = widenEFPace(EF)+' /km, selon la FC';
    const reps = (label, n, t, r, pace, paceTxt, zone, extra, lite) => {
      const total = n*repSec(t, pace) + (n-1)*toSec(r);
      return [
        B(`${n} × ${t} ${label}`, fmtMin(total)+' (récups incluses)',
          `<strong>${n} répétitions de ${t} à ${paceTxt}.</strong> ${extra}`, paceTxt, zone, 'interval', lite),
        B('Récupération entre les répétitions', `${r} × ${n-1}`,
          `<strong>${r} de récupération entre chaque répétition</strong> : trot très lent (8:30–9:30 /km) ou marche, jamais à l'arrêt complet. Repars quand ta FC est redescendue sous 150 bpm. Après la dernière répétition, pas de récupération : tu enchaînes avec le retour au calme.`,
          'trot 8:30–9:30 /km ou marche', 'Z1', 'recovery', `${r} de trot très lent ou marche`),
      ];
    };
    return {
      wu:(m)=>B('Échauffement',m+' min',`Footing très facile : démarre à 8:30–9:00 /km et accélère progressivement jusqu'à ton allure EF (${ef}). FC sous 150 bpm. Termine par 30 s de mobilité active : talons-fesses, montées de genoux, cercles de chevilles.`,ef,'Z2','warmup','Footing très facile, progressif'),
      cd:(m)=>B('Retour au calme',m+' min',`Trot très lent (8:30–9:30 /km) pendant ${Math.max(m-2,2)} min, puis 2 min de marche. FC sous 130 bpm à la fin. Étirements doux ensuite : mollets, quadriceps, ischio-jambiers, psoas (30 s par muscle).`,'≥ 8:30 /km','Z1','cooldown','Trot léger puis marche, étirements'),
      ef:(dur,desc)=>B('Endurance fondamentale',dur,desc||`Allure conversationnelle : tu dois pouvoir parler en phrases complètes. FC entre 145 et 160 bpm ; au-delà de 160, ralentis ou marche 30 s.`,efFC,'Z2','main','Allure conversationnelle · FC ≤ 160'),
      seu:(n,t,r)=>reps('seuil',n,t,r,SEU,seu,'Z4',`Dur mais tenable : respiration forte, tu ne peux dire que quelques mots. La FC se stabilise entre 175 et 185 bpm à partir de la 2e minute. Garde la même allure sur toutes les répétitions : si la dernière est plus lente de plus de 10 s/km, tu es parti trop vite.`,'Dur mais tenable, respiration forte'),
      int:(n,t,r)=>reps('intervalles',n,t,r,INT,int,'Z5',`Effort soutenu mais contrôlé (≈ 8/10), la FC monte à 185–195 bpm en fin de répétition. Les 2 premières doivent sembler faciles ; la dernière doit être aussi rapide que la première. Si tu ne tiens plus l'allure, arrête la série plutôt que de ralentir.`,'Effort soutenu, pas un sprint'),
      asb:(n,t,r)=>reps('à allure semi',n,t,r,AS,as,'Z3',`Allure régulière et relâchée : c'est l'allure du jour J. FC entre 160 et 175 bpm. Épaules basses, foulée courte et rythmée.`,'Allure objectif semi, régulière'),
      as:(t,d)=>B(`Allure semi — ${t}`,'—',d||`Allure objectif semi, régulière et relâchée : c'est l'allure du jour J. FC entre 160 et 175 bpm.`,as,'Z3','interval','Allure objectif semi, régulière'),
      tempo:(t)=>B(`${t} min seuil continu`,t+' min',`Pas de récupération dans ce bloc. Pendant les 2 premières minutes, pars 5 s/km plus lent que l'allure seuil, puis stabilise. La FC monte vers 170 bpm puis se stabilise entre 175 et 185. Respiration forte et rythmée. Si tu dois ralentir, ralentis de 5–10 s/km sans t'arrêter : l'allure était trop rapide.`,seu,'Z4','interval','Allure seuil régulière, sans pause'),
      strides:(n)=>[
        B(`${n} × 20 s lignes droites`, fmtMin(n*20+(n-1)*90)+' (récups incluses)',
          `<strong>${n} lignes droites de 20 s, en fin de footing, sur terrain plat.</strong> De 0 à 8 s : accélère progressivement depuis ton allure EF. De 8 à 16 s : tiens ${int} (≈ 90 % de ta vitesse max, ce n'est pas un sprint). De 16 à 20 s : relâche en décélérant. Foulée longue, bras relâchés, épaules basses, mâchoire détendue.`,
          int,'Z3','interval','Accélérations progressives, pas un sprint'),
        B('Récupération entre les lignes droites', `1'30 × ${n-1}`,
          `<strong>1'30 de récupération entre chaque ligne droite</strong> : 60 s de marche, puis 30 s de trot très lent (8:30–9:30 /km). Repars quand ta respiration est redevenue normale (FC sous 150 bpm). Après la dernière, reprends simplement ton footing facile : l'objectif est la qualité du geste, pas la fatigue.`,
          'marche puis trot 8:30–9:30 /km','Z1','recovery',`1'30 : 60 s de marche + 30 s de trot lent`),
      ],
      hills:(n,t)=>{
        const ts = toSec(t), r = ts <= 45 ? `1'30` : `2'`;
        const len = ts <= 30 ? '100' : ts <= 45 ? '130' : '180';
        return [
          B(`${n} × ${t} côte`, fmtMin(n*ts+(n-1)*toSec(r))+' (récups incluses)',
            `<strong>${n} montées de ${t} dans une côte régulière de 6–8 % (≈ ${len} m).</strong> Effort soutenu mais contrôlé : la FC monte à 175–187 bpm en haut. Foulée courte, genoux hauts, bras actifs, regard à 10 m devant. Tu cherches la poussée, pas la vitesse.`,
            'à l\'effort','Z4','interval','Effort soutenu en montée'),
          B('Récupération entre les côtes', `${r} × ${n-1}`,
            `<strong>${r} de récupération entre chaque côte</strong> : redescends en marchant, puis trot très lent (8:30–9:30 /km) jusqu'au pied de la côte. Repars quand ta FC est sous 150 bpm. Après la dernière côte, redescends en marchant puis reprends ton footing facile.`,
            'marche puis trot lent','Z1','recovery',`${r} : redescente en marchant`),
        ];
      },
      efP:ef,
    };
  }

  // ── Générateurs de séances ──
  const easy = (h,km,o={}) => {
    const ph = [h.ef(km+' km',o.desc)];
    if (o.hl) ph.push(...h.hills(o.hl[0],o.hl[1]));
    if (o.st) ph.push(...h.strides(o.st));
    return S('z2',o.label||'Endurance Z2','🏃',o.short||`${km} km EF${o.hl?' + côtes':''}${o.st?' + lignes droites':''}`,
      o.obj||'Développer la base aérobie et récupérer des séances dures.', ph,
      o.tip||'Si tu ne peux plus parler en phrases, ralentis.', o.nut||'');
  };
  const qual = (h,kind,wu,n,t,r,cd) => {
    const blocks = kind==='int'?h.int(n,t,r):kind==='seu'?h.seu(n,t,r):h.asb(n,t,r);
    const meta = {
      int:['vma','Intervalles','⚡','INT',`Développer la puissance aérobie (VMA) et l'économie de course.`,`Les premières répétitions doivent sembler faciles : garde de la marge pour les dernières.`],
      seu:['seuil','Seuil','🔥','SEUIL',`Repousser le seuil lactique : l'allure que tu peux tenir longtemps.`,`Inconfortable mais tenable. Si tu dois t'arrêter, ralentis de 10 s/km.`],
      asb:['seuil','Allure semi','🎯','AS',`Habituer le corps à l'allure du semi.`,`Allure régulière et relâchée : c'est l'allure du jour J.`],
    }[kind];
    return S(meta[0],meta[1],meta[2],`${n}×${t} ${meta[3]}`,meta[4],[h.wu(wu),...blocks,h.cd(cd)],meta[5],'Pas de séance à jeun : manger 1h30 avant, eau pendant.');
  };
  const tempoS = (h,wu,t,cd) => S('seuil','Tempo seuil','🔥',`${t}' seuil continu`,
    `Tenir l'allure seuil sur la durée : repousse le « mur ».`,[h.wu(wu),h.tempo(t),h.cd(cd)],
    `Départ un peu en dessous de l'allure, puis stabilise.`,'Pas de séance à jeun.');
  const longEF = (h,km,o={}) => S('long','Sortie longue','🏞️',`${km} km EF${o.note?' — '+o.note:''}`,
    o.obj||`Construire l'endurance fondamentale sur la durée.`,[h.ef(km+' km','Footing continu régulier'+(o.note?' · '+o.note:'')+'. FC entre 145 et 160 bpm ; si elle dérive au-dessus de 165 dans la 2e moitié, ralentis de 15 s/km plutôt que de t\'arrêter. Dernier kilomètre libre : si les jambes sont bonnes, tu peux finir à 7:00 /km.')],
    o.tip||`Tout se joue en EF : tu dois finir en pouvant encore parler.`, km>=10?'Eau à 30 et 60 min. Au-delà d\'1h15, un gel ou une datte.':'Eau avant et après.');
  const test = (km,exp,tip) => S('race','⏱ TEST','⏱️',`Test ${km} km à fond`,
    `Mesurer ta forme pour recalibrer les allures${km===5?' (10 km ≈ 5 km × 2,08)':''}. Résultat attendu : ${exp}.`,
    [B('Échauffement','15 min','2 km EF (FC sous 150), puis 4 lignes droites de 20 s avec 1\'30 de récupération en marchant, puis 3 min de marche avant le départ.','—','Z2','warmup','2 km EF + 4 lignes droites'),
     B(`${km} km à fond`,'—','Allure régulière, jamais plus vite au début qu\'à la fin. Tout donner sur le dernier km.','à fond','Z5','interval','Allure régulière, tout donner sur le dernier km'),
     B('Retour au calme','10 min','Trot très lent (8:30–9:30 /km) 8 min puis 2 min de marche. Étirements doux : mollets, quadriceps, ischio-jambiers.','≥ 8:30 /km','Z1','cooldown','Trot léger puis marche')],
    tip,'Petit-déjeuner habituel 2h30 avant · eau.');

  // ── Jours fixes de la semaine ──
  const REST = (note,short) => S('rest','Repos','😴',short||'Repos',note,[B('Repos','—',note,'—','—','cooldown')]);

  const ex = (num,name,dur,desc,lite) => B(`Exercice ${num} · ${name}`,dur,desc,'—','—','main',lite);
  const LUN = (su) => S('muscu','Renfo bas du corps','💪',`Renfo jambes ${su?'30':'25'}'`,
    'Renforcer quadriceps, fessiers et mollets : base anti-crampes et protection des genoux.',
    [B('Échauffement','4 min','2 min de marche rapide ou de montées de genoux sur place, puis 10 squats poids du corps, 10 fentes arrière sans charge et 10 ponts fessiers, sans repos entre les mouvements.','—','—','warmup','2 min de marche + 10 squats, 10 fentes, 10 ponts'),
     B('Format : circuit, 3 tours',su?'≈ 22 min':'≈ 18 min',`<strong>Tu ne fais pas 3 séries d'affilée du même exercice.</strong> Tu fais 1 série de chaque exercice dans l'ordre (1 → ${su?5:4}), puis tu recommences au début : 3 tours au total, soit 3 séries de chaque exercice. <strong>Repos : 30 s entre deux exercices, 60 s entre deux tours.</strong> Tempo : descente lente 3 s, remontée 1 s. Charge : poids du corps les 4 premières semaines, puis 2 haltères de 5 kg. Arrête chaque série avec 2 répétitions « en réserve ».`,'—','—','main','3 tours · repos 30 s entre exercices, 60 s entre tours'),
     ex(1,'Squats','10 reps',`Pieds largeur d'épaules, haltères contre la poitrine. Descente en 3 s jusqu'à ce que les cuisses soient parallèles au sol, remontée en 1 s. Genoux dans l'axe des pieds, talons au sol, dos droit. Repos 30 s ensuite.`,'Descente 3 s, remontée 1 s · repos 30 s'),
     ex(2,'Fentes arrière','8 reps par jambe',`Un grand pas en arrière, genou avant à 90°, genou arrière qui frôle le sol, buste droit. Descente 2 s, remontée 1 s. Fais les 8 répétitions d'une jambe puis les 8 de l'autre. Repos 30 s ensuite.`,'Genou avant à 90° · repos 30 s'),
     ex(3,'Montées de mollets lentes','12 reps',`Debout sur le bord d'une marche. Montée en 1 s, descente en 3 s sous le niveau de la marche (excentrique) : c'est l'exercice clé contre les crampes. Passe à une jambe à la fois quand 12 répétitions deviennent faciles. Repos 30 s ensuite.`,'Descente 3 s sous la marche · repos 30 s'),
     ex(4,'Pont fessier une jambe','10 reps par jambe',`Dos au sol, un pied à plat, l'autre jambe tendue en l'air. Pousse sur le talon, bassin à plat, maintien 1 s en haut, descente en 2 s. ${su?'Repos 30 s ensuite.':'Fin du tour : 60 s de repos.'}`,su?'Maintien 1 s en haut · repos 30 s':'Maintien 1 s en haut · repos 60 s (fin du tour)'),
     ...(su?[ex(5,'Montées de marche (step-ups)','10 reps par jambe',`Banc ou marche haute (≈ 40 cm), pied entier posé dessus. Monte en poussant avec la jambe d'appui, sans élan avec l'autre jambe, et redescends en 3 s. Fais les 10 répétitions d'une jambe puis les 10 de l'autre. Fin du tour : 60 s de repos.`,'Descente 3 s · repos 60 s (fin du tour)')]:[]),
     B('Entre les tours','60 s × 2',`Après le dernier exercice du tour : 60 s de repos complet (respire, bois), puis retour à l'exercice 1. Répète jusqu'au 3e tour ; après le 3e tour, passe directement au retour au calme.`,'—','—','recovery','60 s de repos complet'),
     B('Retour au calme','3 min','Étirements de 30 s : quadriceps, ischio-jambiers, mollets (contre un mur), fessiers.','—','—','cooldown','Étirements 30 s par muscle')],
    'Pas de renfo des jambes dans les 5 jours avant une course. Progression : +2 reps ou +1 tour toutes les 2 semaines.','Collation protéinée dans les 30 min : fromage blanc + banane.');
  const PILATES = (opt) => S('pilates','Pilates','🧘','Pilates 18h–19h',
    'Gainage profond et mobilité des hanches : complément direct de la course.',
    [B('Séance Pilates','60 min','Focus : stabilisation lombaire, mobilité des hanches et des chevilles, respiration diaphragmatique','—','—','recovery')],
    'Pas de course le soir.'+(opt?' Option : footing EF de 30\' le midi avant le Pilates (≈ 3,5 km).':''));
  const GAINAGE = S('muscu','Gainage & mobilité','🧱',`Gainage + mobilité 15–20'`,
    'Stabilité du tronc et du bassin, mobilité : moins de pertes de foulée en fin de course.',
    [B('Échauffement','2 min','À quatre pattes : 10 cercles de bassin dans chaque sens, puis 10 allers-retours dos rond / dos creux (chat-vache).','—','—','warmup','Cercles de bassin + chat-vache'),
     B('Format : circuit, 3 tours','≈ 12 min',`<strong>Tu ne fais pas 3 séries d'affilée du même exercice.</strong> Tu fais 1 série de chaque exercice dans l'ordre (1 → 3), puis tu recommences au début : 3 tours au total. <strong>Repos : 20 s entre deux exercices, 45 s entre deux tours.</strong> Pas de charge : seule la qualité du placement compte. Si le bassin s'affaisse ou si le dos se creuse, arrête la série.`,'—','—','main','3 tours · repos 20 s entre exercices, 45 s entre tours'),
     ex(1,'Planche frontale','40 s',`Avant-bras au sol, coudes sous les épaules, corps droit de la tête aux talons, fessiers et abdos serrés, respiration normale. Progression : +5 s par semaine jusqu'à 60 s. Repos 20 s ensuite.`,'Corps droit · repos 20 s'),
     ex(2,'Gainage latéral','30 s par côté',`Sur l'avant-bras, hanches alignées avec l'épaule et les chevilles, hanche haute. Enchaîne l'autre côté après 10 s pour te retourner. Repos 20 s ensuite.`,'Hanche haute · repos 20 s'),
     ex(3,'Bird-dog','10 reps par côté',`À quatre pattes, étends le bras droit et la jambe gauche en même temps, tiens 2 s, reviens en 2 s, puis change de côté. Dos plat, bassin immobile, comme si un verre d'eau était posé sur le bas du dos. Fin du tour : 45 s de repos.`,'Dos plat, bassin immobile · repos 45 s (fin du tour)'),
     B('Mobilité','4 min',`10 cercles de cheville par sens et par pied · rotation de hanche en position « 90/90 » 30 s par côté · étirement du mollet contre un mur 30 s par jambe · étirement du psoas en fente basse 30 s par côté.`,'—','—','cooldown','Chevilles, hanches, mollets, psoas')]);

  // ── Courses ──
  const race11 = S('race','🏆 COURSE','🏁','11 km mixte (50 % sentier) — ≈ 1h15–1h22',
    'Course d\'entraînement : finir frais, tester matériel et nutrition. Pas de chrono visé.',
    [B('Échauffement','15–20 min','Trot Z1–Z2 + 4 lignes droites progressives','—','Z1–Z2','warmup'),
     B('Km 0 → 3','—','Départ prudent, même si tu te sens bien. Laisse partir les autres.','6:50–7:10 /km route · 7:30–8:30 /km sentier','Z2','main'),
     B('Km 3 → 8','—','Allure régulière, marche dans les raidillons, relance en descente.','à l\'effort','Z2–Z3','main'),
     B('Km 8 → fin','—','Accélération progressive si les réserves le permettent.','à l\'effort','Z3','interval')],
    'L\'erreur classique : partir trop vite. Garde de l\'énergie pour la fin.','J-1 : pâtes ou riz le soir + eau. Course : eau aux ravitaillements, gel ou datte vers le km 7 si besoin.');
  const raceTrail = S('race','🏆 TRAIL','🏔️','Trail 18 km · D+ 550 — ≈ 2h35–2h55',
    'Finir en gérant l\'effort : départ lent, côtes raides marchées, nutrition régulière.',
    [B('Échauffement','10–15 min','Trot très léger + mobilité','—','Z1–Z2','warmup'),
     B('Km 0 → 3','—','9:00 /km maximum, laisse partir le peloton.','≤ 9:00 /km','Z2','main'),
     B('Montées','—','Marche dans les pentes supérieures à 10 %, mains sur les cuisses si besoin.','marche active','Z2–Z3','main'),
     B('Descentes','—','Contrôlées, foulée courte, regard 3 m devant.','à l\'effort','Z2','main'),
     B('Dernier tiers','—','Si les jambes répondent, relance progressive sur le plat.','à l\'effort','Z3','interval')],
    'Course test avant le semi : l\'objectif est de finir bien, pas vite.','30–40 g de glucides par heure dès 45 min, 400–500 ml d\'eau par heure.');
  const raceTrail28 = S('race','🏆 TRAIL','🏔️','Trail 28 km · D+ 1 000 — Au cœur du Forez, départ 8h, limite 5h',
    'Finir en gérant l\'effort : départ lent, côtes raides marchées, nutrition régulière dès 45 min.',
    [B('Échauffement','10 min','Trot très léger + mobilité','—','Z1–Z2','warmup'),
     B('Km 0 → 5','—','Départ lent, laisse partir le peloton : 9:00 /km maximum.','≤ 9:00 /km','Z2','main'),
     B('Montées','—','Marche active dans les pentes supérieures à 10 %, mains sur les cuisses.','marche active','Z2–Z3','main'),
     B('Descentes','—','Contrôlées, foulée courte, regard 3 m devant : économise les quadriceps pour les 10 derniers km.','à l\'effort','Z2','main'),
     B('Km 20 → fin','—','Si les jambes répondent, relance progressive sur le plat. Sinon, marche active et régularité.','à l\'effort','Z2–Z3','interval')],
    'Course principale du printemps : limite de temps 5h, donc vise ≈ 4h00–4h40 sans t\'épuiser. 2 bières sur le parcours, 1 à l\'arrivée : à ne pas boire avant la fin !','30–40 g de glucides par heure dès 45 min, 400–500 ml d\'eau par heure, sel si chaleur.');
  const raceSemi2 = S('race','🏆 SEMI-MARATHON','🏆','Semi-marathon de Salon-de-Provence 21,1 km — objectif : sub-2h (5:40 /km)',
    'Objectif ambitieux : passer sous les 2h (5:40 /km), à confirmer par le test 10 km du 26 septembre (≤ 53:30). Sinon plan B : 2h05 (5:57 /km) ou 2h10 (6:09 /km).',
    [B('Échauffement (30 min avant)','20 min','15 min de trot Z1–Z2 + 4 lignes droites + mobilité dynamique','—','Z1–Z2','warmup'),
     B('Km 0 → 3','—','Conserver : partir trop vite est la première cause d\'échec sur un chrono ambitieux. Laisser partir les autres.','5:45–5:50 /km','Z2–Z3','main'),
     B('Km 3 → 15','—','Allure cible régulière. Passages : 5 km en 28:20, 10 km en 56:40, 15 km en 1h25. Boire à chaque ravito.','5:40 /km','Z3','main'),
     B('Km 15 → 18 ⚠️','—','Zone critique : épaules basses, bras actifs. Aucune accélération avant le km 16.','5:40 /km','Z3–Z4','main'),
     B('Km 18 → fin','—','Si les réserves sont là, accélération progressive. Sous 2h = arrivée avant 1h59:30.','< 5:40 /km','Z4','interval')],
    'Si les 10 premiers km sont difficiles à 5:40, bascule sur le plan B (5:57) sans te blâmer.','Gel vers les km 6, 12 et 17 · eau à chaque ravito · rien de nouveau le jour J.');
  const raceSemi = S('race','🏆 SEMI-MARATHON','🏆','Semi-marathon 21,1 km — Objectif 2h10',
    'OBJECTIF PRINCIPAL : finir le semi en 2h10 (6:09 /km), confortablement.',
    [B('Échauffement (30 min avant)','20 min','15 min de trot Z1–Z2 + 4 lignes droites + mobilité dynamique','—','Z1–Z2','warmup'),
     B('Km 0 → 3','—','Conserver. Laisser partir les autres. Passage au km 5 : 30:45.','6:15–6:20 /km','Z2–Z3','main'),
     B('Km 3 → 15','—','Allure cible régulière. Passages : 10 km en 1:01:30, 15 km en 1:32:15. Boire à chaque ravito.','6:09 /km','Z3','interval'),
     B('Km 15 → 18 ⚠️','—','Zone critique : épaules relâchées, bras actifs, foulée courte. Aucune accélération avant le km 16.','6:09 /km','Z3','interval'),
     B('Km 18 → fin','—','Si les réserves le permettent : accélération progressive. Finir fort.','< 6:09 /km','Z3–Z4','interval')],
    'La règle des règles : discipline entre le km 0 et le km 3. L\'euphorie du départ est ton plus grand ennemi.',
    'Gel (25–30 g de glucides) vers les km 8 et 15 · Eau à chaque ravitaillement · Petit-déjeuner 2h30–3h avant · Rien de nouveau le jour J.');

  // ── Construction des semaines ──
  const MOIS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
  const JOURS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const JOURS_L = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  function dayInfo(start,off){
    const d = new Date(Date.UTC(start[0],start[1]-1,start[2]+off));
    const w = d.getUTCDay(), n = d.getUTCDate(), m = MOIS[d.getUTCMonth()];
    return {date:`${JOURS[w]} ${n} ${m.slice(0,3)}`, label:`${JOURS_L[w]} ${n} ${m}`, iso:d.toISOString().slice(0,10)};
  }
  function mkWeek(o){
    const h = H(o.lvl||0), days = [];
    const add = (off,s) => { if (s) days.push(Object.assign(dayInfo(o.start,off),s)); };
    add(0, o.lun===null ? null : (o.lun || LUN(o.n>=4)));
    add(1, PILATES(o.n>=9));
    add(2, o.mer(h));
    add(3, GAINAGE);
    add(4, o.ven(h));
    if (o.sam) add(5, o.sam);
    add(6, o.dim(h));
    return {id:'w'+o.n, n:o.n, phase:o.phase, iso0:dayInfo(o.start,0).iso, lvl:o.lvl||0, title:'Semaine '+o.n, dates:o.dates, label:o.label, volume:o.volume,
            charge:o.charge, desc:o.desc, isRace:!!o.race, raceDate:o.race, days};
  }

  const WEEKS = [
    // ── PHASE 1 : 11 km mixte (les semaines 1 et 2, du 13 au 25 oct, n'ont pas été suivies : on repart de la semaine 3) ──
    mkWeek({n:3,phase:'p1',start:[2026,10,26],dates:'26 oct – 1er nov 2026',label:'Affûtage — 11 km du 1er novembre',volume:'≈ 19 km (dont 3,7 km déjà courus mercredi)',charge:35,lvl:0,race:'1er novembre',
      desc:`Ton dernier entraînement (mercredi, 3,7 km à 7:00/km, FC 165) montre des jambes correctes mais une FC élevée pour l'allure : pars prudemment. Une dernière sortie courte vendredi, repos samedi, puis course d'entraînement : pas de chrono visé, attendu ≈ 1h15–1h22.`,
      mer:h=>easy(h,4,{short:'3,7 km EF (réalisé mercredi)',desc:'Sortie déjà réalisée'}),
      ven:h=>easy(h,4,{st:4,obj:'Activer les jambes sans les fatiguer avant la course.'}),
      sam:REST('Repos complet : eau, glucides complexes ce soir (pâtes ou riz).','Repos'),
      dim:h=>race11}),

    // ── PHASE 2 : trail 18 km ──
    mkWeek({n:4,phase:'p2',start:[2026,11,2],dates:'2 – 8 nov 2026',label:'Récupération post-course',volume:'≈ 16 km',charge:45,lvl:0,
      lun:REST('Repos des jambes le lendemain de la course.','Repos post-course'),
      desc:`Semaine de récupération active après la course : tous les footings en Z2 strict. Retour en douceur après le 11 km. Si les jambes sont encore raides, remplace le footing de mercredi par du repos.`,
      mer:h=>easy(h,4,{desc:'Très facile, jambes libres',short:'4 km EF très facile (ou repos)'}),
      ven:h=>easy(h,4,{st:4}),
      dim:h=>longEF(h,8,{note:'sentier'})}),
    mkWeek({n:5,phase:'p2',start:[2026,11,9],dates:'9 – 15 nov 2026',label:'Intervalles & côtes',volume:'≈ 20 km',charge:65,lvl:0,
      desc:`Montée en charge pour le trail : intervalles de 3 minutes, côtes, première sortie longue avec dénivelé (réglée sur la durée).`,
      mer:h=>qual(h,'int',15,4,`3'`,`2'`,8),
      ven:h=>easy(h,5,{hl:[6,'45"'],obj:'Renforcer les quadriceps et la foulée en montée.'}),
      dim:h=>S('long','Sortie longue trail','🏞️',`1h30 (≈ 10 km) · D+ 250`,
        'Habituer les jambes au dénivelé : effort EF, marche dans les raidillons.',
        [B('Sortie trail EF','1h30','Sentier, D+ 250 m. Effort Z2 (FC < 160), marche dans les pentes raides',h.efP,'Z2','main')],
        'Cours à l\'effort, pas à l\'allure.','Eau toutes les 20–30 min, une datte ou un gel après 1h.')}),
    mkWeek({n:6,phase:'p2',start:[2026,11,16],dates:'16 – 22 nov 2026',label:'Pic de préparation trail',volume:'≈ 23 km',charge:80,lvl:0,
      desc:`Semaine la plus chargée avant le trail. La sortie longue sert de répétition générale : matériel, nutrition, gestion des montées. Si tu es fatigué, ramène-la à 10 km.`,
      mer:h=>qual(h,'seu',15,3,`5'`,`2'`,8),
      ven:h=>easy(h,5,{hl:[6,`1'`],short:`5 km EF + 6×1' côte`,obj:'Dernière séance de côtes : D+ cumulé ≈ 80 m.'}),
      dim:h=>S('long','Sortie longue trail','🏞️',`1h50 (≈ 13 km) · D+ 350`,
        'Répétition générale du trail : effort EF, marche en côte, test de la nutrition.',
        [B('Sortie trail EF','1h50','Sentier, D+ 350 m. Effort Z2 (FC < 160), marche dans les pentes > 10 %',h.efP,'Z2','main')],
        'Même tenue, mêmes chaussures, même nutrition que le jour J.','30–40 g de glucides par heure dès 45 min, 400–500 ml d\'eau par heure.')}),
    mkWeek({n:7,phase:'p2',start:[2026,11,23],dates:'23 – 29 nov 2026',label:'Affûtage — Trail du 29 novembre',volume:'≈ 27 km (dont 18 km de trail)',charge:40,lvl:0,race:'29 novembre',
      desc:`Dernière séance de seuil légère, puis repos. Le trail est un test avant le semi : finir bien, pas vite (attendu ≈ 2h35–2h55).`,
      mer:h=>qual(h,'seu',12,3,`4'`,`2'`,8),
      ven:h=>easy(h,3,{st:4,obj:'Activer les jambes sans les fatiguer avant le trail.'}),
      sam:REST('Repos complet. Dîner glucides complexes, hydratation, préparer le matériel.','Repos'),
      dim:h=>raceTrail}),

    // ── PHASE 3 : base & vitesse ──
    mkWeek({n:8,phase:'p3',start:[2026,11,30],dates:'30 nov – 6 déc 2026',label:'Récupération post-trail',volume:'≈ 16 km',charge:40,lvl:0,
      lun:REST('Repos des jambes après le trail.','Repos post-trail'),
      desc:`Une semaine pour absorber le trail. Footings très faciles uniquement.`,
      mer:h=>easy(h,4,{desc:'Très facile, jambes libres',short:'4 km EF très facile (ou repos)'}),
      ven:h=>easy(h,4),
      dim:h=>longEF(h,8)}),
    mkWeek({n:9,phase:'p3',start:[2026,12,7],dates:'7 – 13 déc 2026',label:'Intervalles courts',volume:'≈ 21 km (+ 3,5 km en option)',charge:55,lvl:0,
      desc:`Retour des intervalles courts. Option dès cette semaine : footing EF de 30' le mardi midi.`,
      mer:h=>qual(h,'int',15,6,`2'`,`1'30`,10),
      ven:h=>easy(h,5,{st:5}),
      dim:h=>longEF(h,10)}),
    mkWeek({n:10,phase:'p3',start:[2026,12,14],dates:'14 – 20 déc 2026',label:'Seuil + test 5 km',volume:'≈ 22 km',charge:65,lvl:0,
      desc:`Séance de seuil, côtes, puis test 5 km dimanche. Résultat attendu : 28:30–30:30. ≤ 28:30 (10 km ≈ 59 min) → passe sur la ligne 59:00 ; sinon reste sur la ligne 1h02.`,
      mer:h=>qual(h,'seu',15,4,`5'`,`2'`,10),
      ven:h=>S('z2','Endurance + côtes','⛰️',`20' EF + 6×40" côte + 10' EF`,'Entretenir la force et la foulée.',
        [h.wu(20),...h.hills(6,'40"'),h.cd(10)],'Redescente en marchant : c\'est la récupération.'),
      dim:h=>test(5,'28:30–30:30','Pars régulier : le 1er km ne doit pas être le plus rapide.')}),
    mkWeek({n:11,phase:'p3',start:[2026,12,21],dates:'21 – 27 déc 2026',label:'Seuil long',volume:'≈ 24 km',charge:65,lvl:0,
      desc:`Allures de la ligne 1h02 (ligne 59:00 si ton test 5 km était ≤ 28:30). Blocs de seuil plus longs pendant la semaine de Noël ; si besoin, décale les séances d'un jour.`,
      mer:h=>qual(h,'seu',15,3,`8'`,`2'`,10),
      ven:h=>easy(h,5,{st:6}),
      dim:h=>longEF(h,11)}),
    mkWeek({n:12,phase:'p3',start:[2026,12,28],dates:'28 déc – 3 jan 2027',label:'Semaine allégée (fêtes)',volume:'≈ 20 km',charge:40,lvl:0,
      desc:`Semaine d'assimilation : le volume baisse, l'intensité reste courte. Profite des fêtes sans culpabiliser.`,
      mer:h=>qual(h,'int',15,6,`1'`,`1'30`,8),
      ven:h=>easy(h,5),
      dim:h=>longEF(h,9)}),
    mkWeek({n:13,phase:'p3',start:[2027,1,4],dates:'4 – 10 jan 2027',label:'VMA longue + tempo',volume:'≈ 26 km',charge:75,lvl:0,
      desc:`Reprise de la charge : intervalles de 1 000 m, tempo continu de 20 minutes, sortie longue de 12 km.`,
      mer:h=>qual(h,'int',15,5,'1 000 m',`2'30`,10),
      ven:h=>tempoS(h,10,20,10),
      dim:h=>longEF(h,12)}),
    mkWeek({n:14,phase:'p3',start:[2027,1,11],dates:'11 – 17 jan 2027',label:'Seuil en blocs',volume:'≈ 28 km',charge:80,lvl:0,
      desc:`Semaine la plus chargée de la phase : blocs de seuil de 6 minutes, côtes, sortie longue de 14 km.`,
      mer:h=>qual(h,'seu',15,4,`6'`,`2'`,10),
      ven:h=>easy(h,6,{hl:[8,'45"']}),
      dim:h=>longEF(h,14)}),
    mkWeek({n:15,phase:'p3',start:[2027,1,18],dates:'18 – 24 jan 2027',label:'Test 10 km',volume:'≈ 24 km',charge:55,lvl:0,
      desc:`Semaine allégée avant le test 10 km du 24 janvier. Résultat attendu : 59:00–61:30. ≤ 59:30 → passe sur la ligne 59:00 (allure semi 6:09/km).`,
      mer:h=>qual(h,'seu',15,4,`3'`,`2'`,8),
      ven:h=>easy(h,5,{st:5}),
      dim:h=>test(10,'59:00–61:30','Départ régulier : vise la même allure sur chaque kilomètre.')}),
    mkWeek({n:16,phase:'p3',start:[2027,1,25],dates:'25 – 31 jan 2027',label:'Reprise après le test',volume:'≈ 30 km',charge:80,lvl:1,
      desc:`Allures de la ligne 59:00 (reste sur 1h02 si le test du 24 janvier était au-dessus de 61:30). Intervalles de 800 m, tempo de 25 minutes, sortie longue de 15 km.`,
      mer:h=>qual(h,'int',15,6,'800 m',`2'`,10),
      ven:h=>tempoS(h,10,25,10),
      dim:h=>longEF(h,15)}),

    // ── PHASE 4 : semi ──
    mkWeek({n:17,phase:'p4',start:[2027,2,1],dates:'1 – 7 fév 2027',label:'Entrée à allure semi',volume:'≈ 31 km',charge:85,lvl:1,
      desc:`Première séance à allure semi (6:09/km) : 3 blocs de 2 km. Sortie longue de 16 km en EF.`,
      mer:h=>qual(h,'asb',15,3,'2 km',`2'`,10),
      ven:h=>easy(h,6,{st:6}),
      dim:h=>longEF(h,16)}),
    mkWeek({n:18,phase:'p4',start:[2027,2,8],dates:'8 – 14 fév 2027',label:'Charge spécifique',volume:'≈ 32 km',charge:90,lvl:1,
      desc:`Seuil en blocs de 4 minutes, séance de 8 km dont 5 à allure semi, sortie longue de 16 km.`,
      mer:h=>qual(h,'seu',15,5,`4'`,`1'30`,10),
      ven:h=>S('seuil','Allure semi','🎯','8 km dont 5 km à AS','Tenir l\'allure semi sur une durée plus longue.',
        [B('Échauffement','2 km','Footing facile',h.efP,'Z2','warmup'),h.as('5 km'),h.cd(10)],'Reste relâché : c\'est la séance de confiance.'),
      dim:h=>longEF(h,16)}),
    mkWeek({n:19,phase:'p4',start:[2027,2,15],dates:'15 – 21 fév 2027',label:'Test 10 km décisif',volume:'≈ 25 km',charge:60,lvl:1,
      desc:`Test décisif du 21 février. ≤ 57:30 → tu peux viser 2h05 (allure semi 5:57/km). ≤ 59:30 → on confirme 2h10 (6:09/km). 59:30–63:00 → repli sur 2h15–2h20 (6:24–6:38/km). > 63:00 → finir en 2h20+ et prendre du plaisir. Résultat attendu : 57:00–60:00.`,
      mer:h=>qual(h,'int',15,6,`2'`,`1'30`,8),
      ven:h=>easy(h,5,{st:6}),
      dim:h=>test(10,'57:00–60:00','Dernier repère avant le semi : pars régulier et note ta sensation au km 8.')}),
    mkWeek({n:20,phase:'p4',start:[2027,2,22],dates:'22 – 28 fév 2027',label:'Pic de volume',volume:'≈ 33 km',charge:100,lvl:1,
      desc:`Pic de la préparation, avec l'allure semi à 6:09/km. La sortie de dimanche est la répétition générale : 8 km à allure semi au milieu de 18 km.`,
      mer:h=>qual(h,'asb',15,2,'3 km',`3'`,10),
      ven:h=>easy(h,6,{st:6}),
      dim:h=>S('long','Sortie longue spécifique','🏞️','18 km = 6 EF + 8 AS + 4 EF','Répétition générale du semi : 8 km à allure semi avec les jambes déjà chargées.',
        [B('6 km EF','—','Footing régulier',h.efP,'Z2','main'),h.as('8 km','Allure semi, jambes fatiguées : tiens coûte que coûte'),B('4 km EF','—','Retour en endurance',h.efP,'Z2','cooldown')],
        'Si tu tiens ces 8 km à 6:09, tu es prêt pour le semi.','Eau toutes les 20 min, 1 gel vers 1h et un second vers 1h45.')}),
    mkWeek({n:21,phase:'p4',start:[2027,3,1],dates:'1 – 7 mars 2027',label:'Affûtage (1/2)',volume:'≈ 24 km',charge:60,lvl:1,
      desc:`Le volume baisse d'environ un quart ; l'intensité reste présente mais courte.`,
      mer:h=>qual(h,'asb',15,3,'1 km',`1'30`,8),
      ven:h=>easy(h,5,{st:4}),
      dim:h=>longEF(h,12)}),
    mkWeek({n:22,phase:'p4',start:[2027,3,8],dates:'8 – 14 mars 2027',label:'Affûtage final — Semi du 14 mars',volume:'≈ 30 km (9 hors course)',charge:30,lvl:1,race:'14 mars',
      desc:`Les jambes DOIVENT être fraîches le 14 mars. La forme est construite : elle ne peut plus s'améliorer cette semaine. Seulement se préserver. Samedi : repos.`,
      mer:h=>S('seuil','Allure semi','🎯',`4×1' AS`,'Garder la vivacité sans créer de fatigue.',[h.wu(10),...h.asb(4,`1'`,`1'30`),h.cd(8)],'Court et agréable.'),
      ven:h=>easy(h,4,{st:4,obj:'Dernière sortie : jambes légères, esprit prêt.'}),
      sam:REST('Repos complet. Pâtes ou riz ce soir, 2 L d\'eau dans la journée, 8 h de sommeil, préparer le matériel.','Repos total'),
      dim:h=>raceSemi}),

    // ── PHASE 5 : récupération puis trail 28 km (15 mai 2027) ──
    mkWeek({n:23,phase:'p5',start:[2027,3,15],dates:'15 – 21 mars 2027',label:'Récupération post-semi',volume:'≈ 14 km',charge:30,lvl:1,
      desc:`Une semaine pour récupérer du semi : footings courts et faciles, pas d'intensité. Si une douleur persiste, on prolonge le repos.`,
      lun:REST('Repos : marche ou vélo léger si tu en as envie.','Repos'),
      mer:h=>easy(h,5,{obj:'Relancer les jambes sans les fatiguer.'}),
      ven:h=>easy(h,5),
      dim:h=>longEF(h,8,{note:'très facile'})}),
    mkWeek({n:24,phase:'p5',start:[2027,3,22],dates:'22 – 28 mars 2027',label:'Reprise, premières côtes',volume:'≈ 22 km',charge:55,lvl:1,
      desc:`Reprise du renfo et des côtes courtes, qui préparent les muscles aux montées et descentes du trail.`,
      mer:h=>easy(h,7,{hl:[6,'30"']}),
      ven:h=>easy(h,6,{st:4}),
      dim:h=>longEF(h,12,{note:'terrain vallonné si possible'})}),
    mkWeek({n:25,phase:'p5',start:[2027,3,29],dates:'29 mars – 4 avr 2027',label:'Construction trail (1/4)',volume:'≈ 26 km',charge:70,lvl:1,
      desc:`Sortie longue en sentier (≈ 350 m de D+). Côtes de 45 s en semaine.`,
      mer:h=>easy(h,8,{hl:[6,'45"']}),
      ven:h=>easy(h,6,{st:4}),
      dim:h=>longEF(h,14,{note:'sentier, ≈ 350 m de D+, marche dans les raidillons',obj:'Habituer les jambes au dénivelé et à la marche active.'})}),
    mkWeek({n:26,phase:'p5',start:[2027,4,5],dates:'5 – 11 avr 2027',label:'Construction trail (2/4)',volume:'≈ 29 km',charge:80,lvl:1,
      desc:`Seuil court pour garder de la vitesse et sortie longue de 16 km en sentier (≈ 500 m de D+).`,
      mer:h=>qual(h,'seu',15,3,`6'`,`2'`,10),
      ven:h=>easy(h,6,{st:4}),
      dim:h=>longEF(h,16,{note:'sentier, ≈ 500 m de D+',obj:'Travailler la descente : foulée courte, contrôle.'})}),
    mkWeek({n:27,phase:'p5',start:[2027,4,12],dates:'12 – 18 avr 2027',label:'Allègement',volume:'≈ 22 km',charge:55,lvl:1,
      desc:`Semaine d'assimilation : on garde les côtes mais on réduit la sortie longue.`,
      mer:h=>easy(h,7,{hl:[6,'45"']}),
      ven:h=>easy(h,5,{st:4}),
      dim:h=>longEF(h,10,{note:'sentier'})}),
    mkWeek({n:28,phase:'p5',start:[2027,4,19],dates:'19 – 25 avr 2027',label:'Construction trail (3/4)',volume:'≈ 32 km',charge:90,lvl:1,
      desc:`Sortie longue de 20 km en sentier (≈ 700 m de D+) pour tester le sac, l'alimentation et les chaussures.`,
      mer:h=>qual(h,'seu',15,4,`6'`,`2'`,10),
      ven:h=>easy(h,6,{st:4}),
      dim:h=>longEF(h,20,{note:'sentier, ≈ 700 m de D+, gel toutes les 45 min',obj:'Répétition générale : même sac, mêmes chaussures, même nutrition que le jour J.'})}),
    mkWeek({n:29,phase:'p5',start:[2027,4,26],dates:'26 avr – 2 mai 2027',label:'Pic trail (4/4)',volume:'≈ 34 km',charge:100,lvl:1,
      desc:`Dernière grosse semaine : sortie de 22 km en sentier (≈ 900 m de D+), la plus longue de la préparation.`,
      mer:h=>easy(h,8,{hl:[8,'45"']}),
      ven:h=>easy(h,6,{st:4}),
      dim:h=>longEF(h,22,{note:'sentier, ≈ 900 m de D+',obj:'Dernier test grandeur nature, 2 semaines et demie avant la course.'})}),
    mkWeek({n:30,phase:'p5',start:[2027,5,3],dates:'3 – 9 mai 2027',label:'Affûtage (1/2)',volume:'≈ 24 km',charge:60,lvl:1,
      desc:`Le volume baisse d'un tiers ; l'intensité reste présente mais courte.`,
      mer:h=>qual(h,'seu',15,3,`4'`,`2'`,10),
      ven:h=>easy(h,5,{st:4}),
      dim:h=>longEF(h,12,{note:'sentier, sans forcer'})}),
    mkWeek({n:31,phase:'p5',start:[2027,5,10],dates:'10 – 16 mai 2027',label:'Affûtage final — Trail du 15 mai',volume:'≈ 33 km (5 hors course)',charge:30,lvl:1,race:'15 mai',
      desc:`Les jambes doivent être fraîches samedi. Une seule sortie courte mercredi, repos vendredi. Le trail a lieu le samedi 15 mai, le dimanche est consacré à la récupération.`,
      lun:REST('Repos ou mobilité douce.','Repos'),
      mer:h=>S('z2','Dernier footing','🏃','5 km EF + 4 lignes droites','Garder la vivacité sans fatigue.',[h.ef('5 km'),...h.strides(4)],'Court et agréable.'),
      ven:h=>REST('Repos complet. Glucides complexes ce soir, 2 L d\'eau dans la journée, matériel prêt.','Repos'),
      sam:raceTrail28,
      dim:h=>REST('Récupération : marche, étirements doux, bien manger et boire.','Récup')}),

    // ── PHASE 6 : semi de Salon-de-Provence (10 octobre 2027) — objectif provisoire à recalibrer par les tests ──
    ...(() => {
      const MN = ['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];
      const lab = (y,m,dd) => { const a = new Date(Date.UTC(y,m-1,dd)), z = new Date(Date.UTC(y,m-1,dd+6));
        return `${a.getUTCDate()} ${MN[a.getUTCMonth()]} – ${z.getUTCDate()} ${MN[z.getUTCMonth()]} ${z.getUTCFullYear()}`; };
      const SAT = {40:5,42:6,43:6,44:6,46:6,48:7,49:7}, VOL = {40:35,42:36,43:37,44:38,46:39,48:41,49:43};
      const spec = [
        [32,'Récupération post-trail',15,30,'Une semaine pour récupérer du trail : footings courts et faciles, aucune intensité.',
          {lun:REST('Repos : marche ou vélo léger.','Repos'),mer:h=>easy(h,5),ven:h=>easy(h,4),dim:h=>longEF(h,6,{note:'très facile'})}],
        [33,'Reprise',20,50,'Reprise du renfo et de petites côtes.',{mer:h=>easy(h,7,{hl:[6,'30"']}),ven:h=>easy(h,6,{st:4}),dim:h=>longEF(h,12)}],
        [34,'Base aérobie (1/3)',24,65,'Volume en endurance, lignes droites pour garder la vivacité.',{mer:h=>easy(h,8,{st:6}),ven:h=>easy(h,6,{st:4}),dim:h=>longEF(h,14)}],
        [35,'Base aérobie (2/3)',26,75,'Côtes de 45 s pour la puissance, sortie longue de 16 km.',{mer:h=>easy(h,8,{hl:[8,'45"']}),ven:h=>easy(h,6,{st:4}),dim:h=>longEF(h,16)}],
        [36,'Allègement',20,50,'Semaine d\'assimilation avant le test.',{mer:h=>easy(h,6,{st:6}),ven:h=>easy(h,5),dim:h=>longEF(h,10)}],
        [37,'Test 5 km (27 juin)',23,60,'Test du 27 juin : 10 km ≈ 5 km × 2,08. Pour viser le sub-2h il faut un 10 km vers 53:30, soit un 5 km vers 25:45. Cours tôt le matin : il fait chaud.',
          {mer:h=>easy(h,6,{st:6}),ven:h=>easy(h,5,{st:4}),dim:h=>test(5,'26:00–28:30','Départ régulier, tout donner sur le dernier km.')}],
        [38,'Vitesse (1/2)',27,80,'Intervalles de VMA pour relever le plafond.',{mer:h=>qual(h,'int',15,6,`2'`,`1'30`,10),ven:h=>easy(h,6),dim:h=>longEF(h,15)}],
        [39,'Vitesse (2/2)',29,85,'Intervalles plus longs, sortie de 17 km.',{mer:h=>qual(h,'int',15,5,`3'`,`2'`,10),ven:h=>easy(h,7),dim:h=>longEF(h,17)}],
        [40,'Seuil',30,90,'Seuil en blocs de 5 minutes.',{mer:h=>qual(h,'seu',15,4,`5'`,`1'30`,10),ven:h=>easy(h,6,{st:4}),dim:h=>longEF(h,18)}],
        [41,'Allègement estival',22,55,'Semaine plus légère : la chaleur ralentit la récupération. Cours avant 9h ou après 20h et emporte de l\'eau.',{mer:h=>easy(h,7),ven:h=>easy(h,5),dim:h=>longEF(h,12)}],
        [42,'Spécifique (1/10)',30,85,'Début du bloc spécifique : seuil long et sortie de 16 km.',{mer:h=>qual(h,'seu',15,3,`8'`,`2'`,10),ven:h=>easy(h,6,{st:4}),dim:h=>longEF(h,16)}],
        [43,'Spécifique (2/10)',31,90,'Première séance à allure semi : 3 blocs de 2 km.',{mer:h=>qual(h,'asb',15,3,'2 km',`2'`,10),ven:h=>easy(h,6),dim:h=>longEF(h,18)}],
        [44,'Spécifique (3/10)',32,95,'Seuil en blocs de 4 minutes, sortie de 18 km.',{mer:h=>qual(h,'seu',15,5,`4'`,`1'30`,10),ven:h=>easy(h,6,{st:4}),dim:h=>longEF(h,18)}],
        [45,'Allègement',24,55,'Semaine d\'assimilation à mi-bloc.',{mer:h=>easy(h,7,{hl:[6,'45"']}),ven:h=>easy(h,5),dim:h=>longEF(h,12)}],
        [46,'Spécifique (4/10)',33,95,'Blocs plus longs à allure semi : 2 × 3 km.',{mer:h=>qual(h,'asb',15,2,'3 km',`3'`,10),ven:h=>easy(h,6),dim:h=>longEF(h,19)}],
        [47,'Test 10 km (5 sept)',26,65,'Test intermédiaire du 5 septembre : pour rester dans la course au sub-2h, vise ≤ 55:30.',{mer:h=>qual(h,'int',15,5,`2'`,`1'30`,10),ven:h=>easy(h,5,{st:4}),dim:h=>test(10,'54:30–57:00','Pars régulier et note ta sensation au km 8.')}],
        [48,'Spécifique (5/10)',34,95,'Seuil en blocs de 6 minutes, sortie de 20 km.',{mer:h=>qual(h,'seu',15,4,`6'`,`2'`,10),ven:h=>easy(h,6,{st:4}),dim:h=>longEF(h,21)}],
        [49,'Pic de volume',36,100,'Pic de la préparation : séance à allure semi puis sortie de 22 km, dont les 8 derniers km à allure semi, avec un footing le samedi (4 sorties).',{mer:h=>qual(h,'asb',15,3,'3 km',`3'`,10),ven:h=>easy(h,7),dim:h=>longEF(h,22,{note:'finir les 8 derniers km à allure semi (5:40)'})}],
        [50,'Test 10 km décisif (26 sept)',27,65,'Test décisif : ≤ 53:30 → on tente le sub-2h (5:40/km) · ≤ 57:30 → 2h05 (5:57/km) · ≤ 59:30 → 2h10 (6:09/km) · au-dessus → 2h15 ou plus.',{mer:h=>qual(h,'int',15,6,`2'`,`1'30`,8),ven:h=>easy(h,5),dim:h=>test(10,'53:00–56:00','Dernier repère avant le semi.')}],
        [51,'Affûtage (1/2)',24,60,'Le volume baisse d\'un quart ; l\'intensité reste courte.',{mer:h=>qual(h,'asb',15,3,'1 km',`1'30`,8),ven:h=>easy(h,5,{st:4}),dim:h=>longEF(h,12)}],
      ];
      const out = spec.map((s,i) => {
        const t = new Date(Date.UTC(2027,4,17+7*i));
        const o = Object.assign({n:s[0],phase:'p6',start:[t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate()],
          dates:lab(t.getUTCFullYear(),t.getUTCMonth()+1,t.getUTCDate()),label:s[1],volume:'≈ '+s[2]+' km',charge:s[3],lvl:s[0]>=47?3:s[0]>=43?2:1,desc:s[4]}, s[5]);
        const sat = SAT[s[0]]; if (sat) o.sam = easy(H(o.lvl), sat, {label:'Footing du samedi', obj:'4e sortie : volume facile pour tendre vers le sub-2h. Reste en Z2 strict, jambes fraîches pour le dimanche.'});
        if (VOL[s[0]]) o.volume = '≈ '+VOL[s[0]]+' km';
        return mkWeek(o);
      });
      out.push(mkWeek({n:52,phase:'p6',start:[2027,10,4],dates:'4 – 10 oct 2027',label:'Affûtage final — Semi de Salon',volume:'≈ 30 km (9 hors course)',charge:30,lvl:2,race:'10 octobre',
        desc:`Les jambes doivent être fraîches le 10 octobre. La forme est construite : seulement se préserver. Samedi : repos.`,
        mer:h=>S('seuil','Allure semi','🎯',`4×1' AS`,'Garder la vivacité sans créer de fatigue.',[h.wu(10),...h.asb(4,`1'`,`1'30`),h.cd(8)],'Court et agréable.'),
        ven:h=>easy(h,4,{st:4,obj:'Dernière sortie : jambes légères, esprit prêt.'}),
        sam:REST('Repos complet. Pâtes ou riz ce soir, 2 L d\'eau dans la journée, 8 h de sommeil, matériel prêt.','Repos total'),
        dim:h=>raceSemi2}));
      return out;
    })(),

  ];

export { WEEKS, LV };
