'use strict';
const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { const open = navigation.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
navigation.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.querySelector('#year').textContent = new Date().getFullYear();
const grid = document.querySelector('#hospital-grid');
const empty = document.querySelector('#hospital-empty');
const feedback = document.querySelector('#hospital-feedback');
const retry = document.querySelector('#hospital-retry');
const search = document.querySelector('#hospital-search');
const state = document.querySelector('#hospital-state');
let hospitals = [];
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function element(tag, text, className) { const node = document.createElement(tag); if (text) node.textContent = text; if (className) node.className = className; return node; }
function safeURL(value) { try { const url = new URL(value); return url.protocol === 'https:' && !url.username ? url.href : null; } catch { return null; } }
function render() {
  grid.replaceChildren();
  const query = normalize(search.value.trim());
  const matches = hospitals.filter(h => (!state.value || h.state === state.value) && normalize(`${h.name} ${h.city}`).includes(query));
  document.querySelector('#hospital-count').textContent = `${matches.length} ${matches.length === 1 ? 'hospital encontrado' : 'hospitais encontrados'}`;
  feedback.textContent = hospitals.length && !matches.length ? 'Nenhum hospital encontrado. Experimente outra cidade ou estado.' : '';
  for (const h of matches) {
    const card = element('article', '', 'hospital-card');
    if (h.image && safeURL(h.image)) { const img = element('img'); img.src = safeURL(h.image); img.alt = h.image_alt || ''; img.loading = 'lazy'; card.append(img); }
    const body = element('div', '', 'hospital-card-body');
    body.append(element('p', `${h.city} · ${h.state}`, 'hospital-location'), element('h3', h.name), element('p', h.description));
    const tags = element('div', '', 'hospital-tags');
    for (const tag of h.specialties || []) tags.append(element('span', tag));
    body.append(tags);
    const details = element('details'); details.append(element('summary', 'Informações da instituição'));
    for (const [label, values] of [['Atendimento', h.care_types], ['Convênios', h.insurance]]) if (values?.length) details.append(element('p', `${label}: ${values.join(', ')}`));
    if (h.cnes) details.append(element('p', `CNES: ${h.cnes}`));
    details.append(element('p', `Dados revisados em ${h.reviewed_at.split('-').reverse().join('/')}. Confirme condições e disponibilidade diretamente com a instituição.`));
    if (safeURL(h.verification_url)) { const source = element('a', 'Fonte das informações'); source.href = safeURL(h.verification_url); source.target = '_blank'; source.rel = 'noopener noreferrer'; details.append(source); }
    body.append(details);
    const contacts = element('div', '', 'hospital-contact');
    if (/^\d{10,15}$/.test(h.phone)) { const phone = element('a', 'Ligar para o hospital'); phone.href = `tel:+${h.phone}`; contacts.append(phone); }
    if (safeURL(h.website)) { const link = element('a', 'Site da instituição ↗'); link.href = safeURL(h.website); link.target = '_blank'; link.rel = 'noopener noreferrer'; contacts.append(link); }
    body.append(contacts); card.append(body); grid.append(card);
  }
}
async function load() {
  retry.hidden = true; feedback.textContent = 'Carregando informações dos hospitais…';
  try {
    const response = await fetch('/data/hospitais.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Catálogo indisponível');
    const data = await response.json();
    if (!Array.isArray(data.hospitals) || data.hospitals.some(h => !h || ['name', 'city', 'state', 'description', 'reviewed_at'].some(key => typeof h[key] !== 'string') || !Array.isArray(h.specialties))) throw new Error('Catálogo inválido');
    hospitals = data.hospitals;
    state.replaceChildren(element('option', 'Todos os estados')); state.firstChild.value = '';
    for (const uf of [...new Set(hospitals.map(h => h.state))].sort()) { const option = element('option', uf); option.value = uf; state.append(option); }
    document.querySelector('#directory-toolbar').hidden = !hospitals.length;
    empty.hidden = Boolean(hospitals.length); render();
  } catch {
    empty.hidden = true; feedback.textContent = 'Não foi possível carregar o catálogo. Tente novamente ou entre em contato com a Braga Saúde.'; retry.hidden = false;
  }
}
search.addEventListener('input', render); state.addEventListener('change', render); retry.addEventListener('click', load); load();
