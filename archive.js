'use strict';

const { characters, mods, priorityMods, sources, types } = window.CHARACTER_ARCHIVE;
const byId = new Map(characters.map(character => [character.id, character]));
const modById = new Map(mods.map(mod => [mod.id, mod]));
const priority = new Set(priorityMods);
const byRank = (a, b) => b.popularityScore - a.popularityScore || byName(a, b);
const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base', numeric: true });
const ranks = new Map([...characters].sort(byRank).map((character, index) => [character.id, index + 1]));
const pageSize = 24;
let selectedMod = 'all';
let page = 1;

const $ = id => document.getElementById(id);
const search = $('search');
const clear = $('clear-search');
const typeSelect = $('type-select');
const sortSelect = $('sort-select');
const modSelect = $('mod-select');
const grid = $('grid');
const profile = $('profile');
const about = $('about');

function node(tag, className, label) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (label !== undefined) element.textContent = label;
  return element;
}

function button(className, label, onClick) {
  const element = node('button', className, label);
  element.type = 'button';
  element.addEventListener('click', onClick);
  return element;
}

function external(label, url) {
  const anchor = node('a', '', label);
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  return anchor;
}

function option(value, label) {
  const element = node('option', '', label);
  element.value = value;
  return element;
}

function normalize(text) {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/&/g, ' and ')
    .replace(/[’']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function appeared(character) {
  return character.mods.filter(appearance => appearance.status !== 'Archived / planned');
}

const modFilters = [
  { id: 'all', name: 'All Mods', color: '#b7f777' },
  ...mods.filter(mod => priority.has(mod.id)),
  { id: 'other-mods', name: 'Other Fan Mods', color: '#b4a0f8' },
  { id: 'fanon', name: 'Standalone Fan OCs', color: '#f2a8d4' },
];

function matchesMod(character, modId) {
  if (modId === 'all') return true;
  if (modId === 'fanon') return character.origin === 'Standalone fan OC';
  if (modId === 'other-mods') return appeared(character).some(appearance => !priority.has(appearance.id));
  return appeared(character).some(appearance => appearance.id === modId);
}

const searchable = new Map(characters.map(character => [character.id, normalize([
  character.name, ...character.aliases, ...appeared(character).map(appearance => modById.get(appearance.id).name),
].join(' '))]));

const sorters = {
  popular: byRank,
  least: (a, b) => a.popularityScore - b.popularityScore || byName(a, b),
  az: byName,
  za: (a, b) => byName(b, a),
  mod: (a, b) => sortMod(a).localeCompare(sortMod(b)) || byName(a, b),
  recent: (a, b) => b.addedOrder - a.addedOrder,
};

function sortMod(character) {
  return appeared(character).map(appearance => modById.get(appearance.id).name).sort()[0] || 'ZZZ';
}

function modBadge(mod, label = mod.short) {
  const element = node('span', 'badge', label);
  element.style.setProperty('--tone', mod.color);
  return element;
}

function portrait(character, detailed = false) {
  const element = node('div', 'portrait');
  const mod = modById.get((appeared(character)[0] || character.mods[0])?.id);
  if (mod) element.style.setProperty('--glow', mod.glow);
  const fallback = node('span', 'no-image');
  fallback.append(node('strong', '', character.image ? 'Image unavailable' : 'Missing image'),
    node('small', '', character.image ? 'See file credit in profile' : 'No verified portrait'));
  fallback.hidden = Boolean(character.image);
  element.append(fallback);
  if (!detailed) element.append(node('span', 'rank', '#' + ranks.get(character.id)));
  if (character.image) {
    element.classList.add('is-loading');
    const image = node('img');
    image.alt = detailed ? character.name + ' portrait' : '';
    image.decoding = 'async';
    image.loading = detailed ? 'eager' : 'lazy';
    image.referrerPolicy = 'no-referrer';
    image.addEventListener('load', () => element.classList.remove('is-loading'), { once: true });
    image.addEventListener('error', () => {
      element.classList.remove('is-loading');
      image.remove();
      fallback.hidden = false;
    }, { once: true });
    image.src = character.image.local || character.image.url;
    element.append(image);
  }
  return element;
}

function card(character) {
  const element = node('a', 'card');
  element.href = '#character/' + encodeURIComponent(character.id);
  element.setAttribute('aria-label', 'Open ' + character.name + ' profile');
  element.dataset.character = character.id;
  const copy = node('div', 'card-info');
  const badges = node('div', 'badges');
  const appearances = appeared(character);
  for (const appearance of appearances.slice(0, 2)) badges.append(modBadge(modById.get(appearance.id)));
  if (appearances.length > 2) {
    const more = node('span', 'badge', '+' + (appearances.length - 2));
    more.title = appearances.slice(2).map(appearance => modById.get(appearance.id).name).join(', ');
    badges.append(more);
  }
  if (!appearances.length) badges.append(node('span', 'badge', character.mods.length ? 'Archived roster' : 'Fanon'));
  const displayType = ['Alternate Forms', 'Main Characters', 'Secret Characters', 'Bosses', 'Supporting Characters', 'Fan-made OCs', 'Other']
    .find(type => character.types.includes(type));
  copy.append(node('strong', 'card-name', character.name), badges,
    node('span', 'card-type', displayType),
    node('span', 'card-desc', character.description));
  element.append(portrait(character), copy);
  return element;
}

function renderPages(total) {
  const nav = $('pages');
  const count = Math.ceil(total / pageSize);
  nav.replaceChildren();
  nav.hidden = count < 2;
  if (nav.hidden) return;
  const add = (label, target, ariaLabel, disabled = false) => {
    const element = button('', label, () => {
      page = target;
      render();
      $('index-title').scrollIntoView({ block: 'start' });
    });
    element.setAttribute('aria-label', ariaLabel);
    element.disabled = disabled;
    if (label === String(page)) element.setAttribute('aria-current', 'page');
    nav.append(element);
  };
  add('‹', page - 1, 'Previous page', page === 1);
  const visible = [...new Set([1, ...Array.from({ length: 5 }, (_, i) => page + i - 2), count])]
    .filter(n => n > 0 && n <= count).sort((a, b) => a - b);
  visible.forEach((n, index) => {
    if (index && n - visible[index - 1] > 1) nav.append(node('span', 'counter', '…'));
    add(String(n), n, 'Page ' + n);
  });
  add('›', page + 1, 'Next page', page === count);
}

function render() {
  const query = normalize(search.value);
  const terms = query ? query.split(/\s+/) : [];
  const type = typeSelect.value;
  const results = characters.filter(character => matchesMod(character, selectedMod) &&
    (type === 'all' || character.types.includes(type)) &&
    terms.every(term => searchable.get(character.id).includes(term)));
  results.sort(sorters[sortSelect.value]);
  const start = (page - 1) * pageSize;
  const visible = results.slice(start, start + pageSize);
  $('results-count').textContent = results.length.toLocaleString('en') + (results.length === 1 ? ' ENTRY' : ' ENTRIES');
  $('index-title').textContent = selectedMod === 'all' ? 'All Characters' : modFilters.find(mod => mod.id === selectedMod).name;
  $('sort-note').textContent = [sortSelect.value === 'popular' || sortSelect.value === 'least' ? 'Estimated popularity' : '',
    visible.length ? 'Showing ' + (start + 1) + '–' + (start + visible.length) + ' of ' + results.length : ''].filter(Boolean).join(' · ');
  grid.replaceChildren(...visible.map(card));
  $('empty').hidden = results.length > 0;
  clear.hidden = !search.value;
  renderPages(results.length);
}

function changeFilters() {
  page = 1;
  render();
}

function chooseMod(modId) {
  selectedMod = modId;
  modSelect.value = modId;
  for (const modButton of $('mod-list').children) {
    modButton.setAttribute('aria-pressed', String(modButton.dataset.mod === modId));
  }
  changeFilters();
}

function makeSection(parent, label, content) {
  parent.append(node('h3', '', label), content);
}

function relations(ids) {
  const list = node('div', 'related');
  if (!ids.length) list.append(node('span', 'card-type', 'Unknown'));
  for (const id of ids) {
    const character = byId.get(id);
    if (!character) continue;
    const anchor = node('a', 'badge', character.name);
    anchor.href = '#character/' + encodeURIComponent(id);
    list.append(anchor);
  }
  return list;
}

function showProfile(character) {
  if (about.open) about.close();
  const content = node('article', 'profile-content');
  const close = button('close', '×', () => profile.close());
  close.setAttribute('aria-label', 'Close character profile');
  const art = node('div', 'profile-art');
  art.append(portrait(character, true));
  if (character.image) {
    const credit = node('p', 'art-credit');
    credit.append(document.createTextNode('Image credit '), external(character.image.filename, character.image.file),
      document.createTextNode(' · ' + (character.image.credit || 'See source file for attribution')));
    art.append(credit);
  }
  const copy = node('div', 'profile-copy');
  const title = node('h2', '', character.name);
  title.id = 'profile-title';
  const badges = node('div', 'badges');
  for (const type of character.types) badges.append(node('span', 'badge', type));
  copy.append(node('p', 'eyebrow', 'ENTRY ' + String(character.addedOrder).padStart(3, '0') + ' / ' + character.origin.toUpperCase()),
    title, badges, node('p', '', character.description));
  const list = node('ul');
  for (const appearance of character.mods) {
    const mod = modById.get(appearance.id);
    const item = node('li');
    item.append(external(mod.name, appearance.source), document.createTextNode(' · ' + appearance.status));
    list.append(item);
  }
  makeSection(copy, 'Associated mods', list.childElementCount ? list : node('span', 'card-type', 'No confirmed mod appearance'));
  makeSection(copy, 'Known aliases', node('span', 'card-type', character.aliases.join(' · ') || 'Unknown'));
  const related = relations(character.relatedCharacters);
  if (character.relationLabels?.length) {
    const labels = node('p', 'art-credit', character.relationLabels.join(' · '));
    related.append(labels);
  }
  makeSection(copy, 'Documented relationships', related);
  if (character.formOf) makeSection(copy, 'Base character', relations([character.formOf]));
  makeSection(copy, 'Alternate forms', relations(character.alternateForms));
  const sourceLinks = node('div', 'source-links');
  for (const source of character.sources) sourceLinks.append(external(source.label + ' · ' + source.section, source.url));
  makeSection(copy, 'Sources', sourceLinks);
  const evidence = character.popularityEvidence;
  makeSection(copy, 'Estimated popularity', node('span', 'card-type',
    '#' + ranks.get(character.id) + ' · ' + character.popularityScore + ' points (' +
    evidence.spotlight + ' spotlight + ' + evidence.coverage + ' coverage + ' + evidence.prominence + ' prominence)'));
  content.append(art, copy);
  $('profile-body').replaceChildren(close, content);
  if (!profile.open) profile.showModal();
  profile.scrollTop = 0;
  close.focus({ preventScroll: true });
}

function openFromHash() {
  const prefix = '#character/';
  if (!location.hash.startsWith(prefix)) {
    if (profile.open) profile.close();
    return;
  }
  let id;
  try {
    id = decodeURIComponent(location.hash.slice(prefix.length));
  } catch {
    return;
  }
  const character = byId.get(id);
  if (character) showProfile(character);
}

for (const mod of modFilters) {
  const total = characters.filter(character => matchesMod(character, mod.id)).length;
  modSelect.append(option(mod.id, mod.name));
  const element = button('', undefined, () => chooseMod(mod.id));
  element.dataset.mod = mod.id;
  element.style.setProperty('--tone', mod.color);
  element.append(node('span', 'mod-dot'), node('span', '', mod.name), node('small', '', String(total)));
  $('mod-list').append(element);
}

typeSelect.append(option('all', 'All Characters'), ...types.map(type => option(type, type)));
$('stat-entries').textContent = characters.length.toLocaleString('en');
$('stat-mods').textContent = mods.filter(mod => characters.some(character => matchesMod(character, mod.id))).length.toLocaleString('en');
$('stat-images').textContent = characters.filter(character => character.image).length.toLocaleString('en');
for (const id of ['dave', 'bambi', 'tristan']) {
  const character = byId.get(id);
  if (!character?.image) continue;
  const image = node('img');
  image.alt = '';
  image.decoding = 'async';
  image.referrerPolicy = 'no-referrer';
  image.addEventListener('error', () => image.style.visibility = 'hidden', { once: true });
  image.src = character.image.local || character.image.url;
  $('hero-portraits').append(image);
}
for (const source of sources) $('general-sources').append(external(source.label, source.url));
for (const trigger of document.querySelectorAll('[data-about]')) trigger.addEventListener('click', () => about.showModal());
for (const dialog of [profile, about]) dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
profile.addEventListener('close', () => {
  if (location.hash.startsWith('#character/')) history.replaceState(null, '', '#collection');
});
$('filters').addEventListener('submit', event => event.preventDefault());
search.addEventListener('input', changeFilters);
clear.addEventListener('click', () => {
  search.value = '';
  changeFilters();
  search.focus();
});
modSelect.addEventListener('change', () => chooseMod(modSelect.value));
typeSelect.addEventListener('change', changeFilters);
sortSelect.addEventListener('change', changeFilters);
$('reset').addEventListener('click', () => {
  search.value = '';
  typeSelect.value = 'all';
  sortSelect.value = 'popular';
  chooseMod('all');
  search.focus();
});
window.addEventListener('hashchange', openFromHash);
window.addEventListener('keydown', event => {
  if (event.key === '/' && !profile.open && !about.open && !event.target.closest('input, select, textarea, [contenteditable]')) {
    event.preventDefault();
    search.focus();
  }
});
chooseMod('all');
openFromHash();
