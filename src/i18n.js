// -----------------------------------------------------------------------------
// Texts of the integration, in English, French, German and Spanish (English
// fallback).
//
// The manifest carries its own labels; these are the texts the code writes at
// runtime: calendar and event names, widget contents, scene summaries, status
// of the Configuration screen. Vocabulary of the Gladys interface: Mes
// calendriers / My calendars / Meine Kalender / Mis calendarios; of the
// gardening calendars: jour racines, lune montante, Wurzeltag, Fruchttag…
// -----------------------------------------------------------------------------

const LANGUAGES = ['en', 'fr', 'de', 'es'];

const TEXTS = {
  // day types
  type_fruit: { en: 'Fruit day', fr: 'Jour fruits', de: 'Fruchttag', es: 'Día de fruto' },
  type_root: { en: 'Root day', fr: 'Jour racines', de: 'Wurzeltag', es: 'Día de raíz' },
  type_flower: { en: 'Flower day', fr: 'Jour fleurs', de: 'Blütentag', es: 'Día de flor' },
  type_leaf: { en: 'Leaf day', fr: 'Jour feuilles', de: 'Blatttag', es: 'Día de hoja' },
  short_fruit: { en: 'Fruit', fr: 'Fruits', de: 'Frucht', es: 'Fruto' },
  short_root: { en: 'Root', fr: 'Racines', de: 'Wurzel', es: 'Raíz' },
  short_flower: { en: 'Flower', fr: 'Fleurs', de: 'Blüte', es: 'Flor' },
  short_leaf: { en: 'Leaf', fr: 'Feuilles', de: 'Blatt', es: 'Hoja' },

  // constellations
  aries: { en: 'Aries', fr: 'Bélier', de: 'Widder', es: 'Aries' },
  taurus: { en: 'Taurus', fr: 'Taureau', de: 'Stier', es: 'Tauro' },
  gemini: { en: 'Gemini', fr: 'Gémeaux', de: 'Zwillinge', es: 'Géminis' },
  cancer: { en: 'Cancer', fr: 'Cancer', de: 'Krebs', es: 'Cáncer' },
  leo: { en: 'Leo', fr: 'Lion', de: 'Löwe', es: 'Leo' },
  virgo: { en: 'Virgo', fr: 'Vierge', de: 'Jungfrau', es: 'Virgo' },
  libra: { en: 'Libra', fr: 'Balance', de: 'Waage', es: 'Libra' },
  scorpio: { en: 'Scorpio', fr: 'Scorpion', de: 'Skorpion', es: 'Escorpio' },
  sagittarius: { en: 'Sagittarius', fr: 'Sagittaire', de: 'Schütze', es: 'Sagitario' },
  capricorn: { en: 'Capricorn', fr: 'Capricorne', de: 'Steinbock', es: 'Capricornio' },
  aquarius: { en: 'Aquarius', fr: 'Verseau', de: 'Wassermann', es: 'Acuario' },
  pisces: { en: 'Pisces', fr: 'Poissons', de: 'Fische', es: 'Piscis' },

  // trajectory and phase
  trajectory_ascending: {
    en: 'Ascending moon',
    fr: 'Lune montante',
    de: 'Aufsteigender Mond',
    es: 'Luna ascendente',
  },
  trajectory_descending: {
    en: 'Descending moon',
    fr: 'Lune descendante',
    de: 'Absteigender Mond',
    es: 'Luna descendente',
  },
  phase_waxing: {
    en: 'Waxing moon',
    fr: 'Lune croissante',
    de: 'Zunehmender Mond',
    es: 'Luna creciente',
  },
  phase_waning: {
    en: 'Waning moon',
    fr: 'Lune décroissante',
    de: 'Abnehmender Mond',
    es: 'Luna menguante',
  },
  quarter_0: { en: 'New moon', fr: 'Nouvelle lune', de: 'Neumond', es: 'Luna nueva' },
  quarter_1: {
    en: 'First quarter',
    fr: 'Premier quartier',
    de: 'Erstes Viertel',
    es: 'Cuarto creciente',
  },
  quarter_2: { en: 'Full moon', fr: 'Pleine lune', de: 'Vollmond', es: 'Luna llena' },
  quarter_3: {
    en: 'Last quarter',
    fr: 'Dernier quartier',
    de: 'Letztes Viertel',
    es: 'Cuarto menguante',
  },

  // days to avoid
  avoid_perigee: { en: 'Perigee', fr: 'Périgée', de: 'Erdnähe', es: 'Perigeo' },
  avoid_apogee: { en: 'Apogee', fr: 'Apogée', de: 'Erdferne', es: 'Apogeo' },
  avoid_ascending_node: {
    en: 'Ascending node',
    fr: 'Nœud ascendant',
    de: 'Aufsteigender Mondknoten',
    es: 'Nodo ascendente',
  },
  avoid_descending_node: {
    en: 'Descending node',
    fr: 'Nœud descendant',
    de: 'Absteigender Mondknoten',
    es: 'Nodo descendente',
  },
  avoid_lunar_eclipse: {
    en: 'Lunar eclipse',
    fr: 'Éclipse de lune',
    de: 'Mondfinsternis',
    es: 'Eclipse lunar',
  },
  avoid_solar_eclipse: {
    en: 'Solar eclipse',
    fr: 'Éclipse de soleil',
    de: 'Sonnenfinsternis',
    es: 'Eclipse solar',
  },
  dayToAvoid: {
    en: 'Day to avoid',
    fr: 'Jour à éviter',
    de: 'Ungünstiger Tag',
    es: 'Día desfavorable',
  },

  // advice
  advice_fruit: {
    en: 'Fruit vegetables: tomatoes, beans, peas, squash, cereals, fruit trees.',
    fr: 'Légumes-fruits : tomates, haricots, pois, courges, céréales, arbres fruitiers.',
    de: 'Fruchtgemüse: Tomaten, Bohnen, Erbsen, Kürbisse, Getreide, Obstbäume.',
    es: 'Hortalizas de fruto: tomates, judías, guisantes, calabazas, cereales, frutales.',
  },
  advice_root: {
    en: 'Root vegetables: carrots, radishes, potatoes, onions, garlic, beetroot.',
    fr: 'Légumes-racines : carottes, radis, pommes de terre, oignons, ail, betteraves.',
    de: 'Wurzelgemüse: Karotten, Radieschen, Kartoffeln, Zwiebeln, Knoblauch, Rote Bete.',
    es: 'Hortalizas de raíz: zanahorias, rábanos, patatas, cebollas, ajos, remolachas.',
  },
  advice_flower: {
    en: 'Flowers and flower vegetables: flowers, artichokes, broccoli, cauliflower.',
    fr: 'Fleurs et légumes-fleurs : fleurs, artichauts, brocolis, chou-fleur.',
    de: 'Blumen und Blütengemüse: Blumen, Artischocken, Brokkoli, Blumenkohl.',
    es: 'Flores y hortalizas de flor: flores, alcachofas, brócoli, coliflor.',
  },
  advice_leaf: {
    en: 'Leaf vegetables: lettuce, spinach, cabbage, leeks, herbs, lawn.',
    fr: 'Légumes-feuilles : salades, épinards, choux, poireaux, aromatiques, gazon.',
    de: 'Blattgemüse: Salat, Spinat, Kohl, Lauch, Kräuter, Rasen.',
    es: 'Hortalizas de hoja: lechugas, espinacas, coles, puerros, aromáticas, césped.',
  },
  advice_ascending: {
    en: 'Ascending moon: sow, graft, harvest fruit and leaves.',
    fr: 'Lune montante : semer, greffer, récolter fruits et feuilles.',
    de: 'Aufsteigender Mond: säen, veredeln, Früchte und Blätter ernten.',
    es: 'Luna ascendente: sembrar, injertar, cosechar frutos y hojas.',
  },
  advice_descending: {
    en: 'Descending moon: plant out, transplant, prune, work the soil, harvest roots.',
    fr: 'Lune descendante : planter, repiquer, tailler, travailler le sol, récolter les racines.',
    de: 'Absteigender Mond: pflanzen, umpflanzen, schneiden, Boden bearbeiten, Wurzeln ernten.',
    es: 'Luna descendente: plantar, trasplantar, podar, trabajar la tierra, cosechar raíces.',
  },
  advice_avoid: {
    en: 'Day to avoid ({reasons}): no sowing nor planting, weed or tidy up instead.',
    fr: 'Jour à éviter ({reasons}) : ni semis ni plantation, désherbez ou rangez plutôt.',
    de: 'Ungünstiger Tag ({reasons}): weder säen noch pflanzen, lieber jäten oder aufräumen.',
    es: 'Día desfavorable ({reasons}): ni siembra ni plantación, mejor desherbar u ordenar.',
  },

  // calendar
  calendarName: {
    en: 'Lunar gardening calendar',
    fr: 'Calendrier lunaire du jardinier',
    de: 'Mondkalender für den Garten',
    es: 'Calendario lunar del huerto',
  },
  calendarDescription: {
    en: 'Fruit, root, flower and leaf days, ascending and descending moon, days to avoid (Maria Thun method, computed locally).',
    fr: 'Jours fruits, racines, fleurs et feuilles, lune montante et descendante, jours à éviter (méthode Maria Thun, calculée localement).',
    de: 'Frucht-, Wurzel-, Blüten- und Blatttage, auf- und absteigender Mond, ungünstige Tage (Methode Maria Thun, lokal berechnet).',
    es: 'Días de fruto, raíz, flor y hoja, luna ascendente y descendente, días desfavorables (método Maria Thun, calculado localmente).',
  },
  eventType: {
    en: '{type} · {constellation}',
    fr: '{type} · {constellation}',
    de: '{type} · {constellation}',
    es: '{type} · {constellation}',
  },
  eventAvoid: {
    en: 'Day to avoid: {reasons}',
    fr: 'Jour à éviter : {reasons}',
    de: 'Ungünstiger Tag: {reasons}',
    es: 'Día desfavorable: {reasons}',
  },

  // sentences
  until: { en: 'until {time}', fr: 'jusqu’à {time}', de: 'bis {time}', es: 'hasta las {time}' },
  untilDay: { en: 'until {day}', fr: 'jusqu’au {day}', de: 'bis {day}', es: 'hasta el {day}' },
  then: { en: 'then {what}', fr: 'puis {what}', de: 'dann {what}', es: 'luego {what}' },
  fromTime: { en: 'from {time}', fr: 'dès {time}', de: 'ab {time}', es: 'desde las {time}' },
  summary_today: {
    en: 'Today: {types}. {trajectory}, {phase}.',
    fr: 'Aujourd’hui : {types}. {trajectory}, {phase}.',
    de: 'Heute: {types}. {trajectory}, {phase}.',
    es: 'Hoy: {types}. {trajectory}, {phase}.',
  },
  summary_tomorrow: {
    en: 'Tomorrow: {types}. {trajectory}, {phase}.',
    fr: 'Demain : {types}. {trajectory}, {phase}.',
    de: 'Morgen: {types}. {trajectory}, {phase}.',
    es: 'Mañana: {types}. {trajectory}, {phase}.',
  },
  summaryAvoid: {
    en: '{day} is a day to avoid ({reasons}).',
    fr: '{day} est un jour à éviter ({reasons}).',
    de: '{day} ist ein ungünstiger Tag ({reasons}).',
    es: '{day} es un día desfavorable ({reasons}).',
  },
  todayWord: { en: 'Today', fr: 'Aujourd’hui', de: 'Heute', es: 'Hoy' },
  tomorrowWord: { en: 'Tomorrow', fr: 'Demain', de: 'Morgen', es: 'Mañana' },
  summaryTypeChange: {
    en: '{type}: moon in {constellation} ({until}).',
    fr: '{type} : lune en {constellation} ({until}).',
    de: '{type}: Mond im Sternbild {constellation} ({until}).',
    es: '{type}: luna en {constellation} ({until}).',
  },
  summaryTrajectoryChange: {
    en: '{trajectory} {until}.',
    fr: '{trajectory} {until}.',
    de: '{trajectory} {until}.',
    es: '{trajectory} {until}.',
  },

  // widgets
  widgetNow: { en: 'Now', fr: 'Maintenant', de: 'Jetzt', es: 'Ahora' },
  widgetNext: { en: 'Next', fr: 'Ensuite', de: 'Danach', es: 'Después' },
  widgetMoon: { en: 'Moon', fr: 'Lune', de: 'Mond', es: 'Luna' },
  widgetAvoid: { en: 'To avoid', fr: 'À éviter', de: 'Ungünstig', es: 'Evitar' },
  widgetLegend: {
    en: '↑ ascending moon · ↓ descending moon',
    fr: '↑ lune montante · ↓ lune descendante',
    de: '↑ aufsteigender Mond · ↓ absteigender Mond',
    es: '↑ luna ascendente · ↓ luna descendente',
  },

  // status of the Configuration screen
  statusRunning: {
    en: 'Computed locally for {timezone}: {type} now, {trajectory}.',
    fr: 'Calculé localement pour {timezone} : {type} en ce moment, {trajectory}.',
    de: 'Lokal berechnet für {timezone}: jetzt {type}, {trajectory}.',
    es: 'Calculado localmente para {timezone}: ahora {type}, {trajectory}.',
  },
};

/**
 * @description True for a language of the integration.
 * @param {unknown} language - The language.
 * @returns {boolean} True when known.
 */
const isLanguage = (language) => LANGUAGES.includes(language);

/**
 * @description A text in a language, with its {placeholders} replaced.
 * @param {string} key - The TEXTS key.
 * @param {string} language - The language (English when unknown).
 * @param {object} [values] - The substitutions.
 * @returns {string} The text.
 * @example
 * t('type_root', 'fr'); // -> 'Jour racines'
 */
function t(key, language, values = {}) {
  const entry = TEXTS[key];
  if (!entry) {
    return key;
  }
  const template = entry[language] ?? entry.en;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? ''));
}

/**
 * @description The text in every language, for a multi-language message.
 * @param {string} key - The TEXTS key.
 * @param {object|Function} [values] - The substitutions, or `(language) => values`.
 * @returns {{ en: string, fr: string, de: string, es: string }} The message.
 */
function all(key, values = {}) {
  return Object.fromEntries(
    LANGUAGES.map((language) => [
      language,
      t(key, language, typeof values === 'function' ? values(language) : values),
    ]),
  );
}

/**
 * @description Truncate a text to a bound, with an ellipsis.
 * @param {string} value - The text.
 * @param {number} max - The bound.
 * @returns {string} The text.
 */
function clip(value, max) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const locale = (language) => (isLanguage(language) ? language : 'en');

/**
 * @description A calendar day written in a language: "Tuesday, April 28"
 * (long), "Thu, Apr 30" (short). Never shifted by a timezone.
 * @param {string} iso - YYYY-MM-DD.
 * @param {string} language - The language.
 * @param {'long'|'short'} [style] - The style.
 * @returns {string} The text.
 * @example
 * formatDay('2026-04-28', 'fr'); // -> 'mardi 28 avril'
 */
function formatDay(iso, language, style = 'long') {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale(language), {
    weekday: style,
    day: 'numeric',
    month: style,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * @description A calendar day written briefly, without the weekday: "Nov 24",
 * "24 nov.".
 * @param {string} iso - YYYY-MM-DD.
 * @param {string} language - The language.
 * @returns {string} The text.
 */
function formatDate(iso, language) {
  const [year, month, day] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(locale(language), {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export { LANGUAGES, TEXTS, isLanguage, t, all, clip, formatDay, formatDate };
