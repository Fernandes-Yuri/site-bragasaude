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
  if (!panel || !launcher) return;
  const log = panel.querySelector('[data-faq-log]');
  const suggestions = panel.querySelector('[data-faq-suggestions]');
  const form = panel.querySelector('form');
  const input = panel.querySelector('input');
  const close = panel.querySelector('[data-faq-close]');
  const contact = document.querySelector('[data-contact]');
  const contactURL = contact ? contact.href : '#contato';
  let returnFocus = launcher;
  let initialized = false;
  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text) el.textContent = text;
    if (className) el.className = className;
    return el;
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
    log.scrollTop = log.scrollHeight;
  }
  function answer(question, topic) {
    addMessage(question, 'user');
    addMessage(topic ? topic.answer : 'Não encontrei uma resposta pronta para essa dúvida. Você pode escolher um dos assuntos abaixo ou conversar com a equipe pelo WhatsApp.', 'bot', topic ? topic.links : [['Conversar com a equipe', 'contact']]);
  }
  function restart() {
    log.replaceChildren();
    input.value = '';
    addMessage('Olá! Posso ajudar com dúvidas frequentes sobre este espaço. Escolha um assunto abaixo ou digite sua pergunta.', 'bot');
  }
  function setOpen(open, restoreFocus = true) {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      returnFocus = document.activeElement;
      if (!initialized) { restart(); initialized = true; }
      close.focus();
      log.scrollTop = log.scrollHeight;
    } else if (restoreFocus) returnFocus.focus();
  }
  for (const id of ['start', 'family', 'admission', 'cost', 'sus', 'hospitals', 'care', 'diagnosis', 'app', 'urgent']) {
    const topic = topics.find(item => item.id === id);
    const button = node('button', topic.title);
    button.type = 'button';
    button.addEventListener('click', () => answer(topic.title, topic));
    suggestions.append(button);
  }
  launcher.addEventListener('click', () => setOpen(panel.hidden));
  close.addEventListener('click', () => setOpen(false));
  panel.querySelector('[data-faq-restart]').addEventListener('click', restart);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) { setOpen(false); event.preventDefault(); } });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const question = input.value.trim().slice(0, 240);
    if (!question) { input.focus(); return; }
    answer(question, findTopic(question));
    input.value = '';
  });
  for (const button of document.querySelectorAll('[data-faq-open]')) {
    button.hidden = false;
    button.addEventListener('click', () => setOpen(true));
  }
  launcher.hidden = false;
}());
