/* FAQ local: perguntas não saem do navegador e não são persistidas. */
(function () {
  'use strict';
  const topics = [
    { id: 'urgent', title: 'Preciso de ajuda agora', keys: ['ajuda agora', 'urgencia', 'emergencia', 'socorro', 'me machucar', 'me matar', 'suicidio', 'suicida', 'quero morrer', 'risco de vida'], answer: 'Em uma urgência, procure ajuda imediata pelo SAMU 192. Para apoio emocional, o CVV atende pelo 188. O contato informativo da Braga Saúde não substitui os serviços de urgência.', links: [['Ligar para o SAMU · 192', 'tel:192'], ['Apoio emocional · CVV 188', 'tel:188']] },
    { id: 'contact', title: 'Conversar com a equipe', keys: ['whatsapp', 'atendente', 'equipe', 'contato', 'telefone', 'falar com alguem', 'falar com uma pessoa', 'conversar com alguem', 'humano'], answer: 'Você pode começar com um olá e pedir informações para você ou para alguém próximo. Ao abrir o WhatsApp, confira e envie a mensagem quando quiser. Esse contato é informativo.', links: [['Conversar pelo WhatsApp', 'contact']] },
    { id: 'cost', title: 'Valores e convênios', keys: ['valor', 'valores', 'preco', 'precos', 'custo', 'custos', 'custa', 'quanto custa', 'convenio', 'convenios', 'plano de saude', 'planos de saude', 'particular', 'pagamento', 'unimed', 'sulamerica', 'sul america', 'bradesco', 'bradesco saude'], answer: 'Trabalhamos com hospitais conveniados à Unimed, SulAmérica, Bradesco Saúde e outras operadoras. A aceitação depende do hospital, do plano e da rede credenciada. Valores e condições de atendimento devem ser confirmados diretamente com a instituição; cobertura e eventuais autorizações, com o hospital e a operadora. Você pode conversar com a equipe para pedir informações sobre o seu convênio.', links: [['Pedir informações à equipe', 'contact']] },
    { id: 'sus', title: 'Atendimento pelo SUS', keys: ['sus', 'caps', 'ubs', 'publico', 'publica', 'gratuito', 'gratuita', 'de graca'], answer: 'Os Centros de Atenção Psicossocial (CAPS) fazem parte da rede pública de saúde mental, inclusive para necessidades relacionadas ao álcool e outras drogas. Você pode se informar na UBS ou na Secretaria de Saúde do seu município.', links: [['Conheça os CAPS no Ministério da Saúde', 'https://www.gov.br/saude/pt-br/composicao/saes/desmad/raps/caps']] },
    { id: 'admission', title: 'Preciso de internação?', keys: ['internacao', 'internar', 'internamento', 'internado', 'internada', 'tratamento'], answer: 'Buscar ajuda não significa precisar de internação. Existem diferentes formas de cuidado, incluindo acompanhamento ambulatorial e atenção psicossocial. A indicação depende de uma avaliação individual por um profissional de saúde.', links: [['Conversar sobre possibilidades', 'contact']] },
    { id: 'family', title: 'Quero ajudar um familiar', keys: ['familia', 'familiar', 'familiares', 'amigo', 'amiga', 'mae', 'pai', 'filho', 'filha', 'marido', 'esposa', 'outra pessoa', 'alguem que amo'], answer: 'Sim, familiares e pessoas próximas também podem iniciar a conversa para buscar informações. Conte apenas o que se sentir à vontade e preserve a privacidade da pessoa que você quer ajudar.', links: [['Buscar informações para alguém', 'contact']] },
    { id: 'hospitals', title: 'Hospitais e disponibilidade', keys: ['hospitais', 'hospital', 'clinica', 'clinicas', 'vaga', 'vagas', 'cidade', 'localizacao', 'endereco', 'onde fica', 'onde voces ficam'], answer: 'Este site é um canal de informações e contato, não um hospital. O catálogo publica apenas instituições com dados revisados. A disponibilidade de vagas e as condições de atendimento precisam ser confirmadas diretamente com cada instituição.', links: [['Ver o catálogo de hospitais', '#hospitais'], ['Pedir informações à equipe', 'contact']] },
    { id: 'diagnosis', title: 'Preciso saber o diagnóstico?', keys: ['diagnostico', 'diagnosticos', 'laudo', 'avaliacao', 'medicamento', 'remedio', 'receita'], answer: 'Você pode começar buscando informações, mesmo sem saber um diagnóstico. O diagnóstico, a indicação de tratamento e dúvidas sobre medicamentos dependem de avaliação por um profissional de saúde. Este chat responde apenas dúvidas gerais sobre o site e as possibilidades de cuidado.', links: [['Conhecer o primeiro passo', '#como-funciona']] },
    { id: 'app', title: 'Aplicativo Braga Saúde', keys: ['aplicativo', 'app', 'baixar', 'download', 'android'], answer: 'O aplicativo gratuito e o site oficial continuam em bragasaude.online. Este espaço de clínicas é dedicado a informações sobre saúde mental e instituições de cuidado.', links: [['Conhecer o aplicativo', 'https://bragasaude.online/']] },
    { id: 'care', title: 'Em quais situações buscar apoio?', keys: ['ansiedade', 'panico', 'depressao', 'tristeza', 'aposta', 'apostas', 'jogo', 'jogos', 'alcool', 'bebida', 'drogas', 'dependencia', 'dependencias', 'saude mental'], answer: 'Este espaço reúne informações para quem busca cuidado em saúde mental, incluindo ansiedade, tristeza persistente, dificuldades com apostas, álcool e outras drogas, além de apoio à família. Você pode começar buscando informação e conhecendo possibilidades de cuidado.', links: [['Conhecer os caminhos de cuidado', '#cuidados'], ['Conversar com a equipe', 'contact']] },
    { id: 'start', title: 'Como funciona o primeiro passo?', keys: ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'como funciona', 'primeiro passo', 'comecar', 'inicio', 'ajuda', 'ajudar', 'atendimento', 'agendar', 'consulta'], answer: 'Você pode começar pedindo informações para você ou para quem você ama. Conte apenas o que se sentir à vontade, conheça as possibilidades e converse com um profissional de saúde para definir os próximos passos. Iniciar uma conversa não significa decidir por um tratamento.', links: [['Conversar pelo WhatsApp', 'contact'], ['Ver como funciona', '#como-funciona']] }
  ];
  const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function findTopic(question) {
    const value = ` ${normalize(question)} `;
    // A ordem dá prioridade a ajuda imediata e perguntas específicas.
    return topics.find(topic => topic.keys.some(key => value.includes(` ${key} `))) || null;
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { topics, findTopic };
  if (typeof document === 'undefined') return;
  const panel = document.querySelector('#faq-chat');
  const launcher = document.querySelector('#faq-launcher');
  const avatar = document.querySelector('#faq-avatar');
  if (!panel || !launcher || !avatar) return;
  const log = panel.querySelector('[data-faq-log]');
  const scroller = panel.querySelector('.faq-chat-scroll');
  const suggestions = panel.querySelector('[data-faq-suggestions]');
  const toggle = panel.querySelector('[data-faq-toggle]');
  const form = panel.querySelector('form');
  const input = panel.querySelector('input');
  const close = panel.querySelector('[data-faq-close]');
  const contact = document.querySelector('[data-contact]');
  const contactURL = contact ? contact.href : '#contato';
  const caption = avatar.querySelector('.faq-avatar-caption');
  const welcomeImage = avatar.querySelector('[data-avatar-welcome]');
  const pointImage = avatar.querySelector('[data-avatar-point]');
  const preferredTopics = ['start', 'family', 'admission', 'cost'];
  let returnFocus = launcher;
  let initialized = false;
  let avatarTimer = null;
  pointImage.addEventListener('load', () => { avatar.dataset.poseReady = 'true'; });
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function react(state) {
    if (panel.hidden || document.hidden) return;
    clearTimeout(avatarTimer);
    avatar.dataset.state = state;
    caption.textContent = state === 'responding' ? 'Vamos por partes.' : state === 'suggesting' ? 'Pode escolher aqui.' : 'Escolha uma pergunta.';
    if (state === 'greeting' || state === 'responding') avatarTimer = setTimeout(() => {
      if (!panel.hidden) { avatar.dataset.state = 'idle'; caption.textContent = 'Escolha uma pergunta.'; }
    }, 1600);
  }
  function addMessage(text, from, links) {
    const message = node('div', '', `faq-message faq-message-${from}`);
    message.append(node('span', from === 'user' ? 'Você' : 'Braga Saúde', 'faq-message-author'), node('p', text));
    if (links) {
      const actions = node('div', '', 'faq-message-links');
      for (const [label, href] of links) {
        const link = node('a', label);
        link.href = href === 'contact' ? contactURL : href;
        if (link.href.startsWith('https:')) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
        if (href.startsWith('#')) link.addEventListener('click', () => {
          setOpen(false, false);
          const target = document.querySelector(href);
          if (target) { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
        });
        actions.append(link);
      }
      message.append(actions);
    }
    log.append(message);
    while (log.children.length > 41) log.firstElementChild.remove();
    return message;
  }
  function revealMessage(message) {
    requestAnimationFrame(() => {
      if (panel.hidden) return;
      const top = message.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
      scroller.scrollTop = message.offsetHeight > scroller.clientHeight - 32 ? Math.max(0, top - 12) : scroller.scrollHeight;
    });
  }
  function showSuggestions(open, focus = false) {
    suggestions.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '⌃' : '⌄';
    if (open) {
      renderSuggestions(false);
      react('suggesting');
      requestAnimationFrame(() => {
        if (panel.hidden) return;
        scroller.scrollTop = scroller.scrollHeight;
        if (focus) suggestions.querySelector('button').focus({ preventScroll: true });
      });
    }
  }
  function renderSuggestions(all) {
    suggestions.replaceChildren();
    const ids = all ? ['start', 'family', 'admission', 'cost', 'sus', 'hospitals', 'care', 'diagnosis', 'app', 'urgent'] : preferredTopics;
    for (const id of ids) {
      const topic = topics.find(item => item.id === id);
      const button = node('button', topic.title);
      button.type = 'button';
      button.addEventListener('pointerenter', () => react('suggesting'));
      button.addEventListener('focus', () => react('suggesting'));
      button.addEventListener('click', () => { answer(topic.title, topic); input.focus({ preventScroll: true }); });
      suggestions.append(button);
    }
    if (!all) {
      const more = node('button', 'Ver todos os assuntos', 'faq-more-topics'); more.type = 'button';
      more.addEventListener('click', () => { renderSuggestions(true); suggestions.querySelector('button').focus({ preventScroll: true }); react('suggesting'); });
      suggestions.append(more);
    }
  }
  function answer(question, topic) {
    if (panel.hidden) return;
    showSuggestions(false);
    addMessage(question, 'user');
    const reply = addMessage(topic ? topic.answer : 'Não encontrei uma resposta pronta para essa dúvida. Você pode escolher uma pergunta sugerida ou conversar com a equipe.', 'bot', topic ? topic.links : [['Conversar com a equipe', 'contact']]);
    react('responding');
    revealMessage(reply);
  }
  function restart() {
    log.replaceChildren(); input.value = '';
    addMessage('Olá! Escolha uma pergunta ou digite sua dúvida. As respostas são automáticas.', 'bot');
    showSuggestions(true);
    react('greeting');
  }
  function setOpen(open, restoreFocus = true) {
    if (open) returnFocus = document.activeElement;
    panel.hidden = !open;
    avatar.hidden = !open;
    launcher.hidden = open;
    launcher.setAttribute('aria-expanded', String(open));
    clearTimeout(avatarTimer); avatarTimer = null;
    if (open) {
      if (!welcomeImage.getAttribute('src')) {
        welcomeImage.src = '/assets/avatar/boas-vindas.webp';
        pointImage.src = '/assets/avatar/sugestoes.webp';
      }
      if (!initialized) { restart(); initialized = true; } else react('greeting');
      close.focus({ preventScroll: true });
      const last = log.lastElementChild; if (last && suggestions.hidden) revealMessage(last);
    } else {
      avatar.dataset.state = 'closed';
      if (restoreFocus && returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
    }
  }
  toggle.addEventListener('click', () => showSuggestions(suggestions.hidden, suggestions.hidden));
  avatar.addEventListener('click', () => { if (!panel.hidden) showSuggestions(true, true); });
  suggestions.addEventListener('pointerleave', () => { if (avatar.dataset.state === 'suggesting') react('idle'); });
  launcher.addEventListener('click', () => setOpen(true));
  close.addEventListener('click', () => setOpen(false));
  panel.querySelector('[data-faq-restart]').addEventListener('click', restart);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { setOpen(false); event.preventDefault(); } });
  document.addEventListener('visibilitychange', () => {
    avatar.classList.toggle('is-suspended', document.hidden);
    if (document.hidden) { clearTimeout(avatarTimer); avatarTimer = null; avatar.dataset.state = panel.hidden ? 'closed' : 'idle'; }
  });
  new MutationObserver(() => { if (document.body.classList.contains('consent-visible') && !panel.hidden) setOpen(false, false); }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim().slice(0, 240);
    if (!question) { input.focus(); return; }
    answer(question, findTopic(question)); input.value = '';
  });
  for (const button of document.querySelectorAll('[data-faq-open]')) {
    button.hidden = false; button.addEventListener('click', () => setOpen(true));
  }
  launcher.hidden = false;
}());
