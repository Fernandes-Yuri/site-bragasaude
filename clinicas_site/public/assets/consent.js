/* Escolha local de documentos e privacidade. Não autoriza rastreadores. */
(function () {
  'use strict';
  const VERSION = '2026-10-20-v1';
  const KEY = 'braga_clinicas_privacy_choice';
  const RETENTION = 180 * 24 * 60 * 60 * 1000;
  function createChoice(status, now = Date.now()) {
    if (!['accepted', 'rejected'].includes(status)) throw new Error('Escolha inválida');
    return { version: VERSION, status, termsAccepted: status === 'accepted', privacyAcknowledged: status === 'accepted', cookies: 'necessary-only', decidedAt: new Date(now).toISOString(), expiresAt: new Date(now + RETENTION).toISOString() };
  }
  function parseChoice(raw, now = Date.now()) {
    try {
      const value = JSON.parse(raw);
      if (!value || value.version !== VERSION || !['accepted', 'rejected'].includes(value.status) || value.cookies !== 'necessary-only') return null;
      const accepted = value.status === 'accepted';
      if (value.termsAccepted !== accepted || value.privacyAcknowledged !== accepted) return null;
      if (typeof value.decidedAt !== 'string' || typeof value.expiresAt !== 'string') return null;
      const decided = Date.parse(value.decidedAt), expires = Date.parse(value.expiresAt);
      if (!Number.isFinite(decided) || !Number.isFinite(expires) || decided > now + 300000 || expires <= now || expires <= decided || expires - decided > RETENTION) return null;
      return value;
    } catch { return null; }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { VERSION, KEY, RETENTION, createChoice, parseChoice };
  if (typeof document === 'undefined') return;
  let current = null;
  try { const stored = localStorage.getItem(KEY); current = parseChoice(stored); if (stored && !current) localStorage.removeItem(KEY); } catch { /* Navegação continua com escolha apenas em memória. */ }
  let persistent = Boolean(current);
  let hadStoredChoice = persistent;
  const region = document.createElement('section');
  region.id = 'privacy-choice';
  region.className = 'consent-banner';
  region.setAttribute('role', 'region');
  region.setAttribute('aria-labelledby', 'consent-title');
  region.hidden = true;
  region.innerHTML = `
    <div class="consent-intro"><img src="/assets/braga-logo.svg" width="32" height="32" alt=""><div><h2 id="consent-title" tabindex="-1">Sua privacidade, sua escolha</h2><p>Conheça as condições deste espaço antes de registrar seu aceite.</p></div><button class="consent-close" type="button" aria-label="Fechar preferências" data-consent-close hidden>×</button></div>
    <form class="consent-form" aria-label="Aceite de documentos e privacidade">
      <div class="consent-content"><p>Usamos apenas armazenamento necessário para lembrar sua decisão por até 180 dias. Não usamos cookies de publicidade ou análise de visitas.</p>
      <div class="consent-documents"><a href="/privacidade.html" target="_blank" rel="noopener noreferrer">Política de Privacidade <span aria-hidden="true">↗</span></a><a href="/termos.html" target="_blank" rel="noopener noreferrer">Termos de Uso <span aria-hidden="true">↗</span></a><a href="/cookies.html" target="_blank" rel="noopener noreferrer">Política de Cookies <span aria-hidden="true">↗</span></a></div>
      <label class="consent-check"><input id="consent-terms" type="checkbox" required><span>Li e aceito os Termos de Uso.</span></label>
      <label class="consent-check"><input id="consent-privacy" type="checkbox" required><span>Li e estou ciente das Políticas de Privacidade e de Cookies.</span></label>
      <details class="consent-details"><summary>O que fica no navegador?</summary><p><strong>Necessário:</strong> somente a escolha, a versão dos documentos e as datas da decisão e da validade. Sem nome, contato, histórico de navegação ou mensagens do chat. Nenhum cookie opcional é ativado pelo aceite.</p></details>
      <p class="consent-feedback" data-consent-feedback role="status"></p></div>
      <div class="consent-actions"><button class="consent-action" type="submit" data-consent-accept disabled>Aceitar e continuar</button><button class="consent-action" type="button" data-consent-reject>Continuar sem aceitar</button><p>A consulta às informações públicas continua disponível em qualquer escolha.</p><button class="consent-withdraw" type="button" data-consent-withdraw hidden>Retirar meu aceite</button></div>
    </form>`;
  document.body.append(region);
  const terms = region.querySelector('#consent-terms');
  const privacy = region.querySelector('#consent-privacy');
  const accept = region.querySelector('[data-consent-accept]');
  const close = region.querySelector('[data-consent-close]');
  const withdraw = region.querySelector('[data-consent-withdraw]');
  const feedback = region.querySelector('[data-consent-feedback]');
  const title = region.querySelector('#consent-title');
  let returnFocus = null;
  function measure() {
    if (!region.hidden) document.body.style.setProperty('--consent-height', `${Math.ceil(region.getBoundingClientRect().height)}px`);
  }
  function hide() {
    region.hidden = true;
    document.body.classList.remove('consent-visible');
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  }
  function open(focus = false) {
    const accepted = current && current.status === 'accepted';
    terms.checked = Boolean(accepted); privacy.checked = Boolean(accepted);
    accept.disabled = !accepted;
    withdraw.hidden = !accepted;
    close.hidden = !current;
    feedback.textContent = current ? `Escolha atual: ${accepted ? 'aceite registrado' : 'sem aceite, apenas o necessário'}. Registrada em ${new Date(current.decidedAt).toLocaleDateString('pt-BR')}.${persistent ? '' : ' Válida somente nesta página.'}` : '';
    region.hidden = false;
    document.body.classList.add('consent-visible');
    measure();
    if (focus) { returnFocus = document.activeElement; title.focus({ preventScroll: true }); }
  }
  function save(status) {
    current = createChoice(status);
    let saved = true;
    try { localStorage.setItem(KEY, JSON.stringify(current)); hadStoredChoice = true; } catch {
      saved = false;
      try { localStorage.removeItem(KEY); hadStoredChoice = false; } catch { /* Aviso informa que a nova escolha é só desta página. */ }
    }
    persistent = saved;
    hide();
    if (!saved) {
      const notice = document.createElement('div'); notice.className = 'consent-notice'; notice.setAttribute('role', 'status');
      const text = document.createElement('p'); text.textContent = 'Sua escolha foi aplicada nesta página. O navegador não permitiu salvá-la para a próxima visita.';
      const dismiss = document.createElement('button'); dismiss.type = 'button'; dismiss.textContent = 'Entendi'; dismiss.addEventListener('click', () => notice.remove());
      notice.append(text, dismiss); document.body.append(notice);
    }
  }
  for (const checkbox of [terms, privacy]) checkbox.addEventListener('change', () => { accept.disabled = !(terms.checked && privacy.checked); });
  region.querySelector('form').addEventListener('submit', event => { event.preventDefault(); if (terms.checked && privacy.checked) save('accepted'); });
  region.querySelector('[data-consent-reject]').addEventListener('click', () => save('rejected'));
  close.addEventListener('click', hide);
  withdraw.addEventListener('click', () => {
    try { localStorage.removeItem(KEY); } catch {
      if (hadStoredChoice) { feedback.textContent = 'Não foi possível apagar a escolha salva. Você pode remover os dados deste site nas configurações do navegador.'; return; }
    }
    hadStoredChoice = false;
    current = null; persistent = false; open(); feedback.textContent = 'Seu aceite foi retirado. Você pode continuar sem aceitar ou registrar uma nova escolha.';
  });
  for (const button of document.querySelectorAll('[data-privacy-settings]')) {
    button.hidden = false;
    button.addEventListener('click', () => open(true));
  }
  region.addEventListener('keydown', event => { if (event.key === 'Escape' && current) { hide(); event.preventDefault(); } });
  window.addEventListener('storage', event => {
    if (event.key !== KEY && event.key !== null) return;
    try { current = parseChoice(localStorage.getItem(KEY)); } catch { current = null; }
    persistent = Boolean(current);
    hadStoredChoice = persistent;
    if (current) hide(); else open();
  });
  window.addEventListener('resize', measure);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(region);
  if (!current) open();
}());
