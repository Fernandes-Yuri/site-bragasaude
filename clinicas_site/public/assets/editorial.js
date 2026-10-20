/* Leitura pública: sem login, permissões, gravação ou credenciais no frontend. */
(function () {
  'use strict';
  const API = 'https://api.bragasaude.online/api/editorial/articles';
  const main = document.querySelector('main[data-editorial-mode]');
  if (!main || !window.BragaEditorial) return;
  const render = window.BragaEditorial;
  let pending = false;
  function notFound() {
    const meta = document.createElement('meta'); meta.name = 'robots'; meta.content = 'noindex'; document.head.append(meta);
    // O destino não existe: Firebase entrega a página 404 com status HTTP real.
    location.replace('/conteudo-nao-encontrado');
  }
  function show(result) {
    const parsed = new DOMParser().parseFromString(result.html, 'text/html');
    main.replaceChildren(...Array.from(parsed.querySelector('main').childNodes).map(node => document.importNode(node, true)));
    main.setAttribute('aria-busy', 'false');
    document.title = parsed.title;
    for (const selector of ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property^="og:"]', 'meta[name^="twitter:"]', 'script[type="application/ld+json"]']) {
      document.head.querySelectorAll(selector).forEach(node => node.remove());
      parsed.head.querySelectorAll(selector).forEach(node => document.head.append(document.importNode(node, true)));
    }
  }
  function unavailable() {
    main.replaceChildren();
    const title = document.createElement('h1'); title.textContent = 'Não foi possível carregar o conteúdo agora.';
    const text = document.createElement('p'); text.textContent = 'Tente novamente em instantes. Você também pode voltar ao início e conversar com a equipe.';
    const retry = document.createElement('button'); retry.type = 'button'; retry.className = 'button'; retry.textContent = 'Tentar novamente'; retry.addEventListener('click', load);
    main.append(title, text, retry); main.setAttribute('aria-busy', 'false');
  }
  async function load() {
    if (pending) return;
    let endpoint = API;
    const params = new URLSearchParams(location.search);
    const page = Number(params.get('page') || 1);
    const slug = location.pathname.replace(/\/$/, '').split('/')[2];
    if (main.dataset.editorialMode === 'article') {
      if (!/^\/noticias\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/.test(location.pathname)) { notFound(); return; }
      endpoint += '/' + encodeURIComponent(slug);
    } else {
      if (!Number.isInteger(page) || page < 1 || page > 10000) { notFound(); return; }
      endpoint += '?page=' + page;
    }
    pending = true; main.setAttribute('aria-busy', 'true');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, { signal: controller.signal, credentials: 'omit', headers: { Accept: 'application/json' } });
      if (response.status === 404) { notFound(); return; }
      if (!response.ok) throw new Error('Conteúdo indisponível.');
      const data = await response.json();
      if (main.dataset.editorialMode === 'article') show(render.article(data));
      else {
        if (page > 1 && !data.items.length) { notFound(); return; }
        show(render.listing(data, page));
      }
    } catch (_) { unavailable(); }
    finally { clearTimeout(timeout); pending = false; }
  }
  load();
}());
