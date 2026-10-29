# Design System Master File — FitBook « Éléments » (feu, nature, eau)

> **LOGIC:** When building a specific page, first check `design-system/fitbook/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

## 0. Direction artistique FitBook : néomorphisme + verre dépoli + dégradés feu / nature / eau

**Cette section 0 est la source de vérité.** La section générée automatiquement plus bas
(« Vibrant & Block-based ») n'est conservée qu'en référence : le générateur ne sait pas
composer néomorphisme et glassmorphism, la combinaison est donc spécifiée ici à partir des
fiches de style vérifiées `glassmorphism` et `neumorphism` du catalogue UI/UX Pro Max.

### 0.1 Concept

Trois éléments, trois rôles :

| Élément | Couleur | Rôle dans l'interface |
|---------|---------|-----------------------|
| **Feu** | rouge → orange → ambre | Action et énergie : bouton « Réserver », primaire, alertes de places restantes |
| **Nature** | vert forêt → vert → lime | Disponibilité et succès : créneau libre, réservation confirmée, coach disponible |
| **Eau / ciel** | bleu profond → bleu ciel → cyan | Navigation et information : liens, onglet actif, cartes Leaflet, infos |

- **Fond** : surface néomorphique mate gris-bleu froid, sur laquelle flottent des **taches de
  dégradés** (« aurores ») floutées en arrière-plan.
- **Cartes et navigation** : **verre dépoli** (`backdrop-filter: blur`) qui laisse transparaître
  les aurores, bordure claire 1px, reflet en haut.
- **Contrôles** (boutons secondaires, champs, toggles) : **néomorphisme** — relief doux (double
  ombre claire/sombre) au repos, enfoncé (ombre interne) à l'état pressé ou actif.
- **Actions principales** : boutons pleins en **dégradé profond** de l'élément concerné, texte
  blanc, lueur colorée au survol.
- **Lumière** : source unique en haut à gauche (−x, −y) pour toutes les ombres.

### 0.2 Palette

Base néomorphique (ni blanc ni noir pur, sinon le relief disparaît) :

| Rôle | Clair | Sombre | Token |
|------|-------|--------|-------|
| Fond page = surface néomorphique | `#EEF1F7` | `#1C2230` | `--color-bg`, `--color-surface` |
| Ombre claire | `#FFFFFF` | `#262E3F` | `--neu-light` |
| Ombre sombre | `#C9D0DD` | `#10141C` | `--neu-dark` |
| Texte | `#0F172A` | `#F1F5F9` | `--color-text` |
| Texte secondaire | `#475569` | `#94A3B8` | `--color-text-muted` |
| Bordure fine | `#DDE3EE` | `#2B3444` | `--color-border` |

Dégradés vifs (décor, aurores, barres, titres ≥ 32px, pastilles ; texte **slate** `#0F172A` uniquement) :

| Nom | Stops (angle) | Token |
|-----|---------------|-------|
| Feu | `#DC2626 → #F97316 → #FBBF24` (135°) | `--grad-fire` |
| Nature | `#15803D → #22C55E → #A3E635` (135°) | `--grad-nature` |
| Eau | `#1D4ED8 → #0EA5E9 → #22D3EE` (135°) | `--grad-water` |
| Éléments (les trois) | `#EF4444 0% → #F97316 20% → #FBBF24 35% → #22C55E 60% → #0EA5E9 85% → #2563EB 100%` (120°) | `--grad-elements` |

Le dégradé « Éléments » passe par l'ambre et le cyan pour éviter les mélanges brunâtres du
rouge → vert et verdâtres du vert → bleu.

Dégradés profonds (boutons pleins, texte **blanc** ; chaque stop ≥ 4,8:1 sur blanc) :

| Nom | Stops | Token | Usage |
|-----|-------|-------|-------|
| Feu profond | `#B91C1C → #C2410C` (rouge → orange profond, pour se distinguer du bouton danger en aplat `#B91C1C`) | `--grad-cta` | Bouton principal (réserver, valider, connexion) |
| Nature profonde | `#166534 → #15803D` | `--grad-cta-success` | Confirmer, « disponible » cliquable |
| Eau profonde | `#1E40AF → #0369A1` | `--grad-cta-info` | Voir la carte, filtrer, actions de navigation |

Couleurs unies dérivées :

| Rôle | Clair | Sombre | Token |
|------|-------|--------|-------|
| Primaire (feu : icônes, anneau de focus, bordures actives) | `#DC2626` | `#F87171` | `--color-primary` |
| Liens et texte cliquable (eau) | `#1D4ED8` (5,9:1 sur `#EEF1F7`) | `#38BDF8` (7,4:1) | `--color-link` |
| Accent texte (nature) | `#166534` (6,3:1) | `#4ADE80` (9,1:1) | `--color-accent-text` |
| Succès | `#15803D` | `#4ADE80` | `--color-success` (+ `-light: #DCFCE7`) |
| Danger | `#B91C1C` | `#F87171` | `--color-danger` (+ `-light: #FEE2E2`) |
| Avertissement | `#92400E` | `#FBBF24` | `--color-warning` (+ `-light: #FEF3C7`) |
| Info | `#0369A1` | `#38BDF8` | `--color-info` (+ `-light: #E0F2FE`) |
| Étoiles de notation | `#D97706` | `#FBBF24` | `--color-star` |

Verre :

| Propriété | Clair | Sombre | Token |
|-----------|-------|--------|-------|
| Fond verre | `rgba(255,255,255,0.45)` | `rgba(30,41,59,0.45)` | `--glass-bg` |
| Fond verre fort (nav, modales) | `rgba(255,255,255,0.65)` | `rgba(30,41,59,0.70)` | `--glass-bg-strong` |
| Bordure verre | `rgba(255,255,255,0.60)` | `rgba(255,255,255,0.12)` | `--glass-border` |
| Reflet (haut) | `linear-gradient(180deg, rgba(255,255,255,.55), transparent 40%)` | idem à 0.10 | `--glass-shine` |
| Flou | `16px` | `18px` | `--glass-blur` |

### 0.3 Typographie

- **Titres** : **Outfit** 600/700 (fiche typographie « geometric, modern, clean »),
  letter-spacing −0,01em. Les H1 de héro peuvent être en dégradé `--grad-elements` via
  `background-clip: text` **uniquement ≥ 32px**, avec `color` de repli `--color-text`.
- **Corps** : **Inter** 400/500/600 (déjà chargée), 16px minimum sur mobile, line-height 1,5.
- Google Fonts : `https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap`
- Échelle : 12 (légende) / 14 (secondaire) / 16 (corps) / 18 / 22 / 28 / 36 / 48 (héro).

### 0.4 Tokens CSS (à placer dans `frontend/src/styles.scss`)

```css
:root {
  /* base néomorphique */
  --color-bg: #eef1f7;
  --color-surface: #eef1f7;
  --neu-light: #ffffff;
  --neu-dark: #c9d0dd;
  --color-text: #0f172a;
  --color-text-muted: #475569;
  --color-border: #dde3ee;

  /* éléments */
  --color-primary: #dc2626;        /* feu */
  --color-link: #1d4ed8;           /* eau */
  --color-accent-text: #166534;    /* nature */
  --color-success: #15803d; --color-success-light: #dcfce7;
  --color-danger: #b91c1c;  --color-danger-light: #fee2e2;
  --color-warning: #92400e; --color-warning-light: #fef3c7;
  --color-info: #0369a1;    --color-info-light: #e0f2fe;

  /* dégradés vifs (décor, texte slate) */
  --grad-fire:     linear-gradient(135deg, #dc2626 0%, #f97316 50%, #fbbf24 100%);
  --grad-nature:   linear-gradient(135deg, #15803d 0%, #22c55e 50%, #a3e635 100%);
  --grad-water:    linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 50%, #22d3ee 100%);
  --grad-elements: linear-gradient(120deg, #ef4444 0%, #f97316 20%, #fbbf24 35%,
                                   #22c55e 60%, #0ea5e9 85%, #2563eb 100%);

  /* dégradés profonds (boutons, texte blanc) */
  --grad-cta:         linear-gradient(135deg, #b91c1c 0%, #c2410c 100%);
  --grad-cta-success: linear-gradient(135deg, #166534 0%, #15803d 100%);
  --grad-cta-info:    linear-gradient(135deg, #1e40af 0%, #0369a1 100%);

  /* lueurs colorées */
  --glow-fire:   0 8px 24px rgba(220, 38, 38, 0.35);
  --glow-nature: 0 8px 24px rgba(34, 197, 94, 0.35);
  --glow-water:  0 8px 24px rgba(14, 165, 233, 0.35);

  /* verre */
  --glass-bg: rgba(255, 255, 255, 0.45);
  --glass-bg-strong: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.6);
  --glass-shine: linear-gradient(180deg, rgba(255,255,255,.55) 0%, rgba(255,255,255,0) 40%);
  --glass-blur: 16px;

  /* relief néomorphique (lumière en haut à gauche) */
  --neu-raised:     -6px -6px 14px var(--neu-light), 6px 6px 14px var(--neu-dark);
  --neu-raised-sm:  -3px -3px 8px var(--neu-light), 3px 3px 8px var(--neu-dark);
  --neu-pressed:    inset -4px -4px 10px var(--neu-light), inset 4px 4px 10px var(--neu-dark);
  --neu-pressed-sm: inset -2px -2px 5px var(--neu-light), inset 2px 2px 5px var(--neu-dark);

  /* forme et espace */
  --radius-sm: 10px; --radius: 16px; --radius-lg: 24px; --radius-pill: 999px;
  --space-xs: 4px; --space-sm: 8px; --space-md: 16px; --space-lg: 24px;
  --space-xl: 32px; --space-2xl: 48px; --space-3xl: 64px;

  --font-heading: 'Outfit', 'Inter', system-ui, sans-serif;
  --font: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --header-height: 64px; --bottom-tabs-height: 64px; --sidebar-width: 240px;

  --ease-out: cubic-bezier(.22,.61,.36,1);
  --dur-fast: 150ms; --dur-base: 220ms; --dur-slow: 400ms;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #1c2230; --color-surface: #1c2230;
    --neu-light: #262e3f; --neu-dark: #10141c;
    --color-text: #f1f5f9; --color-text-muted: #94a3b8; --color-border: #2b3444;
    --color-primary: #f87171; --color-link: #38bdf8; --color-accent-text: #4ade80;
    --color-success: #4ade80; --color-danger: #f87171; --color-warning: #fbbf24; --color-info: #38bdf8;
    --glass-bg: rgba(30, 41, 59, 0.45); --glass-bg-strong: rgba(30, 41, 59, 0.7);
    --glass-border: rgba(255, 255, 255, 0.12);
    --glass-shine: linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,0) 40%);
    --glass-blur: 18px;
  }
}
:root[data-theme="dark"] { /* mêmes valeurs que le bloc ci-dessus */ }
```

### 0.5 Recettes de composants

**Aurores de fond** (une fois, dans le layout racine ; `aria-hidden="true"`) : feu en haut à
gauche, eau en bas à droite, la nature naît de leur rencontre au centre.

```css
.aurora { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; }
.aurora::before, .aurora::after {
  content: ''; position: absolute; width: 60vmax; height: 60vmax; border-radius: 50%;
  filter: blur(80px); opacity: .5;
}
.aurora::before { background: var(--grad-fire);  top: -25vmax; left: -20vmax; }
.aurora::after  { background: var(--grad-water); bottom: -30vmax; right: -20vmax; }
```

**Carte verre** (listes de salles, cours, coachs) :

```css
.card-glass {
  position: relative; background: var(--glass-bg);
  -webkit-backdrop-filter: blur(var(--glass-blur)); backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border); border-radius: var(--radius-lg);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  transition: transform var(--dur-base) var(--ease-out), box-shadow var(--dur-base) var(--ease-out);
}
.card-glass::before { content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: var(--glass-shine); pointer-events: none; }
.card-glass:hover { transform: translateY(-3px); box-shadow: 0 16px 40px rgba(15,23,42,.12); }
@supports not (backdrop-filter: blur(1px)) { .card-glass { background: var(--glass-bg-strong); } }
```

Variante **bordure élément** (carte de cours = feu, de coach = nature, de salle = eau) :
un liseré 3px en haut via `::after { height: 3px; background: var(--grad-fire); }`.

**Carte néomorphique** (panneaux de réglages, résumé de réservation, KPI) :

```css
.card-neu { background: var(--color-surface); border-radius: var(--radius-lg);
  box-shadow: var(--neu-raised); border: 1px solid rgba(255,255,255,.4); }
.card-neu--inset { box-shadow: var(--neu-pressed); }
```

**Bouton principal (feu)** :

```css
.btn-primary {
  background: var(--grad-cta); color: #fff; border: 0;
  padding: 12px 22px; min-height: 44px; border-radius: var(--radius-pill);
  font-weight: 600; box-shadow: var(--glow-fire);
  background-size: 150% 150%;
  transition: background-position var(--dur-slow) var(--ease-out),
    transform var(--dur-fast), box-shadow var(--dur-base);
}
.btn-primary:hover { background-position: 100% 50%; box-shadow: 0 12px 32px rgba(220,38,38,.45); }
.btn-primary:active { transform: scale(.98); }
.btn-success { background: var(--grad-cta-success); box-shadow: var(--glow-nature); }
.btn-info    { background: var(--grad-cta-info);    box-shadow: var(--glow-water); }
```

**Bouton secondaire (néomorphique)** :

```css
.btn-neu { background: var(--color-surface); color: var(--color-text);
  border: 1px solid rgba(255,255,255,.5);
  border-radius: var(--radius-pill); min-height: 44px; padding: 10px 20px;
  box-shadow: var(--neu-raised-sm); transition: box-shadow var(--dur-fast); }
.btn-neu:active, .btn-neu[aria-pressed="true"] { box-shadow: var(--neu-pressed-sm); }
```

**Champs de formulaire (enfoncés)** : label visible au-dessus, jamais placeholder seul.

```css
.input { background: var(--color-surface); border: 1px solid transparent;
  border-radius: var(--radius); padding: 12px 16px; font-size: 16px; min-height: 44px;
  box-shadow: var(--neu-pressed-sm); color: var(--color-text); }
.input:focus-visible { outline: 2px solid var(--color-link); outline-offset: 2px; }
.input[aria-invalid="true"] { border-color: var(--color-danger); }
```

**Barre d'onglets mobile et en-tête** : verre fort (`--glass-bg-strong`), bordure `--glass-border`
en haut (tabs) ou en bas (header), icône + libellé ; item actif = pastille `--grad-water` sous
l'icône + libellé en `--color-link`. Hauteur 64px, cibles ≥ 44×44px,
`padding-bottom: env(safe-area-inset-bottom)`.

**Chips / badges** : fond `--glass-bg`, bordure verre, texte 14px 500 ; « disponible » =
`--grad-nature` + texte `#0F172A` + icône ✓ ; « dernières places » = `--grad-fire` + texte
`#0F172A` + icône flamme ; « complet » = `--color-danger-light` + texte `--color-danger` + icône.

**Barre de remplissage d'un cours** : piste néomorphique enfoncée, remplissage `--grad-nature`
sous 70 %, `--grad-fire` au-dessus, pourcentage écrit à côté (jamais la couleur seule).

**Carte Leaflet** : conteneur `.card-glass` avec `overflow: hidden` ; popups en `--glass-bg-strong`
+ flou ; marqueurs en pastille `--grad-water` 32px avec icône SVG blanche, marqueur sélectionné
en `--grad-fire`.

**Focus global** :

```css
:focus-visible { outline: 2px solid var(--color-link); outline-offset: 3px; border-radius: 4px; }
```

### 0.6 Accessibilité (risque « élevé » pour le néomorphisme selon la fiche — règles bloquantes)

Ratios mesurés (WCAG, texte normal ≥ 4,5:1) :

| Paire | Ratio |
|-------|-------|
| Blanc sur `#B91C1C` / `#DC2626` | 6,5 / 4,8 |
| Blanc sur `#166534` / `#15803D` | 7,1 / 5,0 |
| Blanc sur `#1E40AF` / `#0369A1` | 8,7 / 5,9 |
| Slate `#0F172A` sur `#22C55E` / `#0EA5E9` / `#F97316` / `#FBBF24` | 7,8 / 6,4 / 6,4 / 10,7 |
| Slate sur `#EF4444` (stop rouge de `--grad-elements`) | 4,7 |
| Lien `#1D4ED8` sur `#EEF1F7` ; `#38BDF8` sur `#1C2230` | 5,9 ; 7,4 |
| Texte secondaire `#475569` sur `#EEF1F7` ; `#94A3B8` sur `#1C2230` | 6,7 ; 6,2 |

1. **Blanc** uniquement sur les dégradés profonds (`--grad-cta*`). **Jamais** de blanc sur
   `--grad-fire`, `--grad-nature`, `--grad-water` ou `--grad-elements` (ambre 1,7:1, vert 2,3:1,
   ciel 2,8:1).
2. **Slate `#0F172A`** sur les dégradés vifs : la zone rouge `#EF4444` est à 4,7:1, donc pas de
   texte ≤ 14px dessus ; préférer les chips sur `--grad-nature` / `--grad-fire` côté ambre.
3. Texte secondaire : `#475569`, jamais `#64748B` (4,2:1 sur la base néomorphique).
4. Le relief néomorphique seul ne signale pas un contrôle : bordure 1px translucide, icône ou
   libellé, et `:focus-visible` bleu contrasté sur chaque bouton néo.
5. Le verre n'héberge du texte qu'au-dessus d'aurores atténuées (opacité ≤ 0,5) ; vérifier le
   contraste sur la zone la plus colorée.
6. `@media (prefers-reduced-motion: reduce)` : supprimer translations, lueurs animées et
   déplacement de dégradé ; garder les fondus ≤ 150ms.
7. `@media (prefers-reduced-transparency: reduce)` et `@supports not (backdrop-filter)` :
   `--glass-bg` → `--glass-bg-strong` opaque à 0,92.
8. Information jamais portée par la couleur seule : icône + texte pour disponible / complet /
   erreur (rouge et vert côte à côte sont indiscernables pour un daltonien).

### 0.7 Mouvement (5/10)

- Entrée des listes de cartes : fondu + scale 0,96 → 1 + montée 12px, 320ms, décalage 60ms par
  carte (preset « Stagger List »). En Angular : `@angular/animations` `query/stagger` ou classes
  CSS avec `animation-delay` ; GSAP non installé, ne pas l'ajouter.
- Survol carte : −3px en 220ms ; pression bouton : scale 0,98 en 150ms ; relief → enfoncé en 150ms.
- Dégradé des CTA : déplacement de `background-position` en 400ms au survol.
- Aurores : dérive très lente (60s, `transform` uniquement), désactivée en mouvement réduit.

### 0.8 Anti-patterns spécifiques

- ❌ Néomorphisme sur fond blanc pur ou noir pur (relief invisible).
- ❌ Verre sur verre : une seule couche de `backdrop-filter` par pile.
- ❌ Plus de deux aurores par écran ; jamais d'aurore sous un bloc de texte long.
- ❌ Dégradé rouge → vert direct (mélange brun) : toujours passer par l'ambre ; vert → bleu
  toujours par le cyan.
- ❌ Bouton principal en néomorphisme : les CTA sont toujours en dégradé profond.
- ❌ Texte en dégradé sous 32px ou sans couleur de repli.
- ❌ Hex en dur dans les composants Angular : tout passe par `var(--...)`.
- ❌ Emojis comme icônes : SVG Lucide/Heroicons 20/24px, `aria-hidden` si décoratif.

### 0.9 Implémentation (état au 29/10/2026)

- `frontend/src/styles.scss` porte tous les tokens de la section 0.4, les classes globales
  (`.card` = verre, `.btn` = néomorphique, `.btn-primary/.btn-success/.btn-info` = dégradés profonds,
  `.btn-danger` = aplat, `.input` = enfoncé, `.kpi` = relief, `.modal` = verre fort, `.badge-fire/-nature/-water`,
  `.text-gradient`, `.aurora`), le mode sombre, `prefers-reduced-motion`, `prefers-reduced-transparency`
  et le repli sans `backdrop-filter`. Alias conservés : `--color-dark`, `--shadow`, `--shadow-hover`.
- Icônes : composant `app-icon` (`shared/components/icon/icon.component.ts`, tracés Lucide inline,
  `aria-hidden` par défaut, `label` pour une icône porteuse de sens). Plus aucun emoji de chrome ;
  les icônes d'activité saisies par l'admin restent des données.
- Fond : `<div class="aurora">` dans `app.ts`. Navbar, onglets du bas, barre latérale, menus,
  barres fixes mobiles et popups Leaflet en verre fort.
- Exception volontaire : les cadres de QR code (`my-bookings`) restent blancs opaques pour rester
  lisibles par les lecteurs.

### 0.10 Stack

Angular 21 (standalone, signals), SCSS global + styles par composant, Leaflet, pas de Tailwind.
Tokens dans `frontend/src/styles.scss` ; `index.html` charge Outfit + Inter ; `theme-color`
mobile = `#EEF1F7` (clair) / `#1C2230` (sombre).

---

## Section générée par UI/UX Pro Max (référence, non prioritaire)

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#F97316` | `--color-primary` |
| On Primary | `#0F172A` | `--color-on-primary` |
| Secondary | `#FB923C` | `--color-secondary` |
| On Secondary | `#0F172A` | `--color-on-secondary` |
| Accent/CTA | `#22C55E` | `--color-accent` |
| On Accent/CTA | `#0F172A` | `--color-on-accent` |
| Background | `#1F2937` | `--color-background` |
| Foreground | `#F8FAFC` | `--color-foreground` |
| Card | `#313742` | `--color-card` |
| Card Foreground | `#F8FAFC` | `--color-card-foreground` |
| Muted | `#37414F` | `--color-muted` |
| Muted Foreground | `#CBD5E1` | `--color-muted-foreground` |
| Border | `#374151` | `--color-border` |
| Destructive | `#EF4444` | `--color-destructive` |
| On Destructive | `#000000` | `--color-on-destructive` |
| Ring | `#F97316` | `--color-ring` |

**Color Notes:** Energy orange + success green

### Typography

- **Heading Font:** Barlow Condensed
- **Body Font:** Barlow
- **Mood:** sports, fitness, athletic, energetic, condensed, action
- **Google Fonts:** [Barlow Condensed + Barlow](https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500;600;700&display=swap');
```

### Spacing Variables

*Density: 6/10 — Standard*

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #22C55E;
  color: #0F172A;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #F97316;
  border: 2px solid #F97316;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #1F2937;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #F97316;
  outline: none;
  box-shadow: 0 0 0 3px #F9731620;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Vibrant & Block-based

**Keywords:** Bold, energetic, playful, block layout, geometric shapes, high color contrast, duotone, modern, energetic

**Best For:** Startups, creative agencies, gaming, social media, youth-focused, entertainment, consumer

**Key Effects:** Large sections (48px+ gaps), animated patterns, bold hover (color shift), scroll-snap, large type (32px+), 200-300ms

### Page Pattern

**Pattern Name:** Feature-Rich Showcase

- **Conversion Strategy:** Clear feature hierarchy. One key message per card. Strong CTA repetition.
- **CTA Placement:** Hero (sticky) + After features + Bottom
- **Section Order:** Hero (value prop) > Feature grid/cards (4-6) > Use cases or benefits > Social proof or logos > CTA

---

## Motion

**Stagger List** (Standard) — Trigger: load or scroll | Duration: 300-450ms | Easing: `back.out(1.4)`

```js
gsap.from('.grid-item', { opacity: 0, scale: 0.92, y: 16, duration: 0.4, stagger: { each: 0.06, from: 'start', grid: 'auto' }, ease: 'back.out(1.4)' });
```

**Framework notes:** grid: 'auto' lets GSAP infer rows/columns from a CSS grid layout for a natural wave stagger; Use matchMedia('(prefers-reduced-motion: reduce)') to skip non-essential motion and render the final state immediately

- ✅ Combine with from: 'center' for a bento-grid layout to draw the eye inward first
- ❌ Don't use back.out on dense data tables; the overshoot reads as sloppy on informational UI
- ⚡ Group DOM writes; avoid interleaving layout reads (getBoundingClientRect) between staggered tweens

---

## Anti-Patterns (Do NOT Use)

- ❌ Static design
- ❌ No gamification

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile
