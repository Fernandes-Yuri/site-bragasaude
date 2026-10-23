/**
 * ==========================================================================
 * Braga Saúde — Script Oficial de Interatividade
 * Versão modular e desacoplada (Zero JS inline no HTML)
 * ==========================================================================
 */

(function () {
  'use strict';

  // ── 1. Estado da Simulação do Celular ──
  const simScreens = ['home', 'vitals', 'hydration', 'family'];
  let currentSimIndex = 0;
  let simAutoplayTimer = null;
  let isAutoplayPaused = false;
  let manualPauseUntil = 0;
  let manualNavigation = false;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function switchSimScreen(screenName) {
    if (!document.getElementById('sim-' + screenName)) return;
    const screens = document.querySelectorAll('.sim-screen');
    const buttons = document.querySelectorAll('.phone-tab-btn');

    screens.forEach(screen => {
      screen.classList.toggle('active', screen.id === 'sim-' + screenName);
    });

    buttons.forEach(btn => {
      const active = btn.getAttribute('data-sim') === screenName;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    const autoplayIndex = simScreens.indexOf(screenName);
    if (autoplayIndex >= 0) currentSimIndex = autoplayIndex;
    const content = document.querySelector('.phone-app-content');
    if (content) content.scrollTop = 0;
  }

  function startSimAutoplay() {
    if (simAutoplayTimer) clearInterval(simAutoplayTimer);
    simAutoplayTimer = setInterval(() => {
      if (manualNavigation || isAutoplayPaused || Date.now() < manualPauseUntil || reducedMotion.matches || document.hidden) return;
      currentSimIndex = (currentSimIndex + 1) % simScreens.length;
      switchSimScreen(simScreens[currentSimIndex]);
    }, 5500);
  }

  function setupSimulator() {
    const tabButtons = document.querySelectorAll('.phone-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const screenName = btn.getAttribute('data-sim');
        if (screenName) {
          manualNavigation = true;
          switchSimScreen(screenName);
          // Pausa temporária quando o usuário interage voluntariamente
          manualPauseUntil = Date.now() + 12000;
        }
      });
    });

    document.querySelectorAll('[data-sim-go]').forEach(button => {
      button.addEventListener('click', () => {
        const screenName = button.dataset.simGo;
        const screen = document.getElementById('sim-' + screenName);
        if (!screen) return;
        manualNavigation = true;
        if (screenName === 'vitals') window.switchVitalsTab(0);
        switchSimScreen(screenName);
        const focusTarget = screen.querySelector('.sim-back-btn, .sim-nav-item');
        if (focusTarget) focusTarget.focus({ preventScroll: true });
      });
    });

    document.querySelectorAll('[data-sim-dose]').forEach(button => {
      button.addEventListener('click', () => {
        const taken = button.getAttribute('aria-pressed') !== 'true';
        document.querySelectorAll('[data-sim-dose]').forEach(control => {
          control.setAttribute('aria-pressed', String(taken));
          control.textContent = taken ? 'Desfazer' : 'Já tomei';
        });
        document.querySelectorAll('[data-sim-dose-status]').forEach(label => {
          label.textContent = taken ? 'Dose confirmada' : 'Próximo lembrete';
        });
      });
    });

    const examButton = document.getElementById('sim-exam-open');
    const examDetail = document.getElementById('sim-exam-detail');
    if (examButton && examDetail) {
      examButton.addEventListener('click', () => {
        examDetail.hidden = !examDetail.hidden;
        examButton.setAttribute('aria-expanded', String(!examDetail.hidden));
        examButton.textContent = examDetail.hidden ? 'Ver resultado de exemplo' : 'Fechar resultado';
      });
    }

    const phoneFrame = document.querySelector('.phone-frame');
    if (phoneFrame) {
      const simulator = document.getElementById('demonstracao');
      let hovered = false;
      function updatePause() {
        isAutoplayPaused = hovered || simulator.contains(document.activeElement);
      }
      simulator.addEventListener('mouseenter', () => { hovered = true; updatePause(); });
      simulator.addEventListener('mouseleave', () => { hovered = false; updatePause(); });
      simulator.addEventListener('focusin', updatePause);
      simulator.addEventListener('focusout', () => { requestAnimationFrame(updatePause); });
      phoneFrame.addEventListener('pointerdown', () => { manualPauseUntil = Date.now() + 12000; });
      phoneFrame.addEventListener('wheel', () => { manualPauseUntil = Date.now() + 12000; }, { passive: true });
      setupPhonePerspective(phoneFrame);
    }

    switchSimScreen(simScreens[currentSimIndex]);
    startSimAutoplay();
  }

  // Inclinação discreta, sem renderização contínua ou dependências 3D pesadas.
  function setupPhonePerspective(phoneFrame) {
    const stage = phoneFrame.closest('.phone-stage');
    const desktopPointer = window.matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
    if (!stage) return;
    let pendingFrame = null;
    let pointerX = 0.5;
    let pointerY = 0.5;

    function resetPerspective() {
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
      pendingFrame = null;
      phoneFrame.style.removeProperty('--phone-rotate-x');
      phoneFrame.style.removeProperty('--phone-rotate-y');
      phoneFrame.style.removeProperty('--phone-light-x');
    }

    stage.addEventListener('pointermove', event => {
      if (!desktopPointer.matches || reducedMotion.matches || event.pointerType !== 'mouse') return;
      const bounds = stage.getBoundingClientRect();
      pointerX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      pointerY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      if (pendingFrame !== null) return;
      pendingFrame = requestAnimationFrame(() => {
        phoneFrame.style.setProperty('--phone-rotate-x', (2 + (0.5 - pointerY) * 6) + 'deg');
        phoneFrame.style.setProperty('--phone-rotate-y', (-7 + (pointerX - 0.5) * 10) + 'deg');
        phoneFrame.style.setProperty('--phone-light-x', (20 + pointerX * 60) + '%');
        pendingFrame = null;
      });
    });
    stage.addEventListener('pointerleave', resetPerspective);
    desktopPointer.addEventListener('change', resetPerspective);
    reducedMotion.addEventListener('change', resetPerspective);
  }

  // ── 1b. Orb Assistente — Tutorial Interativo ──
  function setupOrb() {
    const orb = document.getElementById('sim-orb');
    const toast = document.getElementById('sim-orb-toast');
    const iconMic = orb ? orb.querySelector('.sim-orb-icon-mic') : null;
    const iconCheck = orb ? orb.querySelector('.sim-orb-icon-check') : null;
    if (!orb) return;

    let isBusy = false;
    let currentStep = 0;

    const tutorialSteps = [
      {
        screen: 'home',
        title: 'Bem-vindo ao Braga Saúde!',
        text: 'Este é o painel inicial. Aqui você vê seus sinais vitais, lembretes de remédio e mensagens da família.',
        highlight: '.sim-emerald-header'
      },
      {
        screen: 'home',
        title: 'Atalhos Rápidos',
        text: 'Toque nestes ícones para acessar rapidamente Água, Pressão, Lembretes, Família e Exames.',
        highlight: '.sim-quick-nav'
      },
      {
        screen: 'home',
        title: 'Próximo Remédio',
        text: 'O app lembra quando tomar seu remédio. Toque em "Já tomei" para registrar.',
        highlight: '.sim-med-alert'
      },
      {
        screen: 'home',
        title: 'Sinais Vitais',
        text: 'Veja sua pressão, glicemia e batimentos cardíacos em tempo real.',
        highlight: '.sim-vitals-row'
      },
      {
        screen: 'vitals',
        title: 'Registrar Pressão',
        text: 'Digite os valores sistólica e diastólica. O app classifica automaticamente conforme diretrizes SBC/OMS.',
        highlight: '.sim-vitals-tabs'
      },
      {
        screen: 'vitals',
        title: 'Classificação Automática',
        text: 'Veja se sua pressão está Normal, Elevada ou Hipertensão. Sempre consulte seu médico.',
        highlight: '.sim-risk-badge'
      },
      {
        screen: 'hydration',
        title: 'Hidratação Diária',
        text: 'Acompanhe quanto de água você bebeu. Meta: 35 ml por kg de peso corporal.',
        highlight: '.sim-hydration-circle'
      },
      {
        screen: 'hydration',
        title: 'Registrar Água',
        text: 'Toque nos botões para adicionar rapidamente 150ml, 200ml, 300ml ou 500ml.',
        highlight: '.sim-hydration-buttons'
      },
      {
        screen: 'family',
        title: 'Ponte Familiar',
        text: 'Seus familiares podem acompanhar sua saúde à distância. Conecte-se via QR Code ou código de 8 dígitos.',
        highlight: '.sim-family-bond'
      },
      {
        screen: 'family',
        title: 'Mensagens de Afeto',
        text: 'Receba recados carinhosos e lembretes dos seus familiares. Eles ficam mais tranquilos!',
        highlight: '.sim-family-messages'
      }
    ];

    function showTutorialStep() {
      const step = tutorialSteps[currentStep];
      
      // Navega para a tela correta
      switchSimScreen(step.screen);
      
      // Mostra toast com a instrução
      if (toast) {
        toast.querySelector('span').innerHTML = `<strong>${step.title}</strong><br>${step.text}`;
        toast.classList.add('visible');
      }

      // Destaca o elemento (pulso sutil)
      const highlightEl = document.querySelector(step.highlight);
      if (highlightEl) {
        highlightEl.style.transition = 'box-shadow 0.3s ease';
        highlightEl.style.boxShadow = '0 0 0 3px rgba(0, 137, 123, 0.4)';
        setTimeout(() => {
          highlightEl.style.boxShadow = '';
        }, 3000);
      }
    }

    orb.addEventListener('click', () => {
      if (isBusy) return;
      isBusy = true;

      // Animação do orb
      orb.classList.add('listening');
      if (iconMic) iconMic.style.display = 'none';
      if (iconCheck) iconCheck.style.display = 'none';

      setTimeout(() => {
        // Mostra passo do tutorial
        showTutorialStep();

        // Estado: concluído
        orb.classList.remove('listening');
        orb.classList.add('done');
        if (iconCheck) iconCheck.style.display = 'block';

        // Próximo passo
        currentStep = (currentStep + 1) % tutorialSteps.length;

        // Esconde toast após 4s
        setTimeout(() => {
          if (toast) toast.classList.remove('visible');
        }, 4000);

        // Volta ao normal
        setTimeout(() => {
          orb.classList.remove('done');
          if (iconMic) iconMic.style.display = 'block';
          if (iconCheck) iconCheck.style.display = 'none';
          isBusy = false;
        }, 1500);
      }, 800);
    });
  }

  // ── 1c. Tabs de Sinais Vitais ──
  window.switchVitalsTab = function(tabIndex) {
    const tabs = document.querySelectorAll('.sim-vitals-tab');
    const contents = document.querySelectorAll('.sim-vitals-tab-content');
    
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', i === tabIndex);
    });
    
    contents.forEach((content, i) => {
      content.style.display = i === tabIndex ? 'block' : 'none';
    });
  };

  // ── 1d. Hidratação: Adicionar Água ──
  let currentHydration = 1200;
  const targetHydration = 2000;

  window.addWater = function(amount) {
    currentHydration += amount;
    if (currentHydration > targetHydration) currentHydration = targetHydration;
    
    const percent = Math.round((currentHydration / targetHydration) * 100);
    const circumference = 2 * Math.PI * 52; // r=52
    const offset = circumference - (percent / 100) * circumference;
    
    // Atualiza círculo
    const progressCircle = document.querySelector('.sim-hydration-svg circle:nth-child(2)');
    if (progressCircle) {
      progressCircle.setAttribute('stroke-dashoffset', offset);
    }
    
    // Atualiza texto
    const valueEl = document.querySelector('.sim-hydration-value');
    const percentEl = document.querySelector('.sim-hydration-percent');
    if (valueEl) valueEl.textContent = currentHydration.toLocaleString('pt-BR') + ' ml';
    if (percentEl) percentEl.textContent = percent + '% alcançado';
    
    // Adiciona registro na lista
    const logsSection = document.querySelector('.sim-logs-section');
    if (logsSection) {
      const now = new Date();
      const time = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      
      const newLog = document.createElement('div');
      newLog.className = 'sim-log-item';
      newLog.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#00897B"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
        <span class="sim-log-amount">+${amount} ml</span>
        <span class="sim-log-time">${time}</span>
      `;
      newLog.style.animation = 'fadeIn 0.3s ease';
      logsSection.appendChild(newLog);
    }
  };

  // ── 2. Navegação entre Landing Page e Documentos Legais ──
  function showLandingView() {
    const landingView = document.getElementById('landing-view');
    const legalView = document.getElementById('legal-view');

    if (landingView && legalView) {
      landingView.style.display = 'block';
      legalView.classList.remove('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function showLegalView(tabName) {
    const landingView = document.getElementById('landing-view');
    const legalView = document.getElementById('legal-view');

    if (landingView && legalView) {
      landingView.style.display = 'none';
      legalView.classList.add('active');
      switchLegalDoc(tabName || 'termos');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function switchLegalDoc(docName) {
    const docTermos = document.getElementById('doc-termos');
    const docPrivacidade = document.getElementById('doc-privacidade');
    const btnTermos = document.getElementById('legal-btn-termos');
    const btnPrivacidade = document.getElementById('legal-btn-privacidade');

    const isTermos = docName === 'termos';

    if (docTermos && docPrivacidade) {
      docTermos.style.display = isTermos ? 'block' : 'none';
      docPrivacidade.style.display = isTermos ? 'none' : 'block';
    }

    if (btnTermos && btnPrivacidade) {
      btnTermos.classList.toggle('active', isTermos);
      btnPrivacidade.classList.toggle('active', !isTermos);
    }

    if (history.pushState) {
      history.pushState(null, '', '#' + (isTermos ? 'termos' : 'privacidade'));
    } else {
      window.location.hash = isTermos ? 'termos' : 'privacidade';
    }
  }

  function setupLegalNavigation() {
    const btnTermos = document.getElementById('legal-btn-termos');
    const btnPrivacidade = document.getElementById('legal-btn-privacidade');
    const backBtn = document.getElementById('legal-back-btn');

    if (btnTermos) {
      btnTermos.addEventListener('click', () => switchLegalDoc('termos'));
    }

    if (btnPrivacidade) {
      btnPrivacidade.addEventListener('click', () => switchLegalDoc('privacidade'));
    }

    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showLandingView();
      });
    }

    // Links de navegação e rodapé com data-view="legal"
    document.querySelectorAll('[data-legal]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = link.getAttribute('data-legal');
        showLegalView(target);
      });
    });

    document.querySelectorAll('[data-nav="landing"]').forEach(link => {
      link.addEventListener('click', () => {
        showLandingView();
      });
    });
  }

  // ── 5. Roteamento por Hash / URL ao Iniciar ──
  function checkInitialRoute() {
    const hash = window.location.hash.toLowerCase();
    const path = window.location.pathname.toLowerCase();

    if (hash === '#termos' || path.includes('termos') || path.includes('terms')) {
      showLegalView('termos');
    } else if (hash === '#privacidade' || path.includes('privacidade') || path.includes('privacy')) {
      showLegalView('privacidade');
    }
  }


  // ── 6. Menu Hamburger Mobile ──
  function setupHamburgerMenu() {
    const btn = document.getElementById('hamburger-btn');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.getElementById('nav-overlay');
    if (!btn || !navLinks) return;

    function closeMenu() {
      btn.classList.remove('active');
      btn.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
      document.body.style.overflow = '';
    }

    function openMenu() {
      btn.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('open');
      if (overlay) overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }

    btn.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > 600) closeMenu();
    });
  }

  // ── 8. Animações de scroll (IntersectionObserver) ──
  function setupScrollReveal() {
    const selectors = [
      '.feature-card',
      '.step-card',
      '.hero-trust-badges',
      '.legal-card'
    ];
    const elements = document.querySelectorAll(selectors.join(', '));
    if (!elements.length || !('IntersectionObserver' in window)) return;

    elements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => observer.observe(el));
  }


  // ── Rastreamento de Conversões (Google Analytics 4) ──
  function setupAnalyticsTracking() {
    // Nenhum download no site: o app será distribuído exclusivamente pela
    // Google Play Store após aprovação. Eventos de conversão de APK foram
    // aposentados junto com o download direto.
    // Pendência: reintroduzir evento 'download_play_store' quando o app
    // for publicado e o link da loja for adicionado nesta página.
  }

  // ── 8. Aviso Institucional de Privacidade & LGPD (Padrão da Indústria) ──
  function setupCookieConsent() {
    const STORAGE_KEY = 'braga_lgpd_consent';
    const box = document.getElementById('braga-lgpd-box');
    const btnAll = document.getElementById('braga-lgpd-btn-all');
    const btnEssential = document.getElementById('braga-lgpd-btn-essential');

    if (!box) return;

    let consent = null;
    try {
      consent = localStorage.getItem(STORAGE_KEY);
    } catch (_) {
      consent = null;
    }

    if (consent === 'all' || consent === 'essential') {
      box.style.setProperty('display', 'none', 'important');
      if (box.parentNode) box.parentNode.removeChild(box);
      return;
    } else {
      box.style.display = 'block';
    }

    function fecharComEscolha(tipo) {
      if (typeof window.responderConsentimentoLGPD === 'function') {
        window.responderConsentimentoLGPD(tipo);
      } else {
        try {
          localStorage.setItem(STORAGE_KEY, tipo);
        } catch (_) {}
        box.classList.add('oculto');
        setTimeout(() => {
          box.style.setProperty('display', 'none', 'important');
          if (box.parentNode) box.parentNode.removeChild(box);
        }, 300);

        if (typeof gtag === 'function') {
          try {
            gtag('consent', 'update', {
              'analytics_storage': tipo === 'all' ? 'granted' : 'denied'
            });
          } catch (_) {}
        }
      }
    }

    if (btnAll) {
      btnAll.addEventListener('click', () => fecharComEscolha('all'));
    }
    if (btnEssential) {
      btnEssential.addEventListener('click', () => fecharComEscolha('essential'));
    }
  }

  // ── Identidade fictícia da demonstração: Maria / José ──
  // 1. Preferência explícita em `braga_demo_genero` ('f'/'m' — pode ser gravada
  //    pelo app/perfil); 2. perfil Firebase persistido na mesma origem → infere gênero do primeiro nome;
  // 3. sem identificação → o nome gira ao longo do dia (a cada 4h, alternando
  //    também entre dias) para a demo nunca parecer estática.
  const NOMES_DEMO = { f: 'Maria', m: 'José' };
  const INICIAIS_DEMO = { f: 'M', m: 'J' };

  function inferirGeneroPorNome(bruto) {
    const nome = String(bruto || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim().split(/[\s._-]+/)[0].replace(/[^a-z]/g, '');
    if (!nome) return null;
    // Exceções: femininos que não terminam em 'a' e masculinos terminados em 'a'.
    if (['alice', 'beatriz', 'luz', 'rose', 'solange', 'marie', 'anne', 'simone',
         'cristiane', 'christiane', 'nicole', 'danielle', 'michele', 'jacqueline',
         'grace', 'julie'].includes(nome)) return 'f';
    if (/(a|as)$/.test(nome)) return 'f';        // Maria, Ana, Fernanda, Gabriela…
    if (/(o|os|es|e|l|r|z|s|u)$/.test(nome)) return 'm'; // João, José, André, Lucas, Miguel…
    return null;
  }

  function lerNomeDePerfilPersistido() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave && chave.indexOf('firebase:authUser:') === 0) {
          const usuario = JSON.parse(localStorage.getItem(chave));
          const nome = usuario && (usuario.displayName || (usuario.email || '').split('@')[0]);
          if (nome) return nome;
        }
      }
    } catch (e) { /* storage/JSON indisponível (modo privado): ignora */ }
    return null;
  }

  function resolverGeneroDemo() {
    try {
      const explicito = (localStorage.getItem('braga_demo_genero') || '').toLowerCase();
      if (['f', 'fem', 'feminino', 'mulher'].includes(explicito)) return 'f';
      if (['m', 'masc', 'masculino', 'homem'].includes(explicito)) return 'm';
    } catch (e) { /* sem storage */ }
    const genero = inferirGeneroPorNome(lerNomeDePerfilPersistido());
    if (genero) return genero;
    // Fallback rotativo: 6 blocos de 4h por dia + paridade do dia.
    const agora = new Date();
    const inicio = new Date(agora.getFullYear(), 0, 0);
    const diaDoAno = Math.floor((agora - inicio) / 86400000);
    return (Math.floor(agora.getHours() / 4) + diaDoAno) % 2 === 0 ? 'f' : 'm';
  }

  function aplicarIdentidadeDemo() {
    const genero = resolverGeneroDemo();
    const elNome = document.getElementById('sim-user-name');
    const elAvatar = document.getElementById('sim-avatar');
    const elSaudacao = document.getElementById('sim-greeting');
    const elRelogio = document.getElementById('sim-status-time');
    if (elNome) elNome.textContent = NOMES_DEMO[genero] + '!';
    if (elAvatar) elAvatar.textContent = INICIAIS_DEMO[genero] || 'M';
    const agora = new Date();
    const hora = agora.getHours();
    if (elSaudacao) elSaudacao.textContent = hora < 12 ? 'Bom dia,' : hora < 18 ? 'Boa tarde,' : 'Boa noite,';
    if (elRelogio) {
      elRelogio.textContent = String(hora).padStart(2, '0') + ':' + String(agora.getMinutes()).padStart(2, '0');
    }
  }

  function setupDemoIdentity() {
    aplicarIdentidadeDemo();
    // Relógio/saudação vivos e rotação de nome (quando não há gênero definido).
    setInterval(aplicarIdentidadeDemo, 30000);
  }

  // ── Cofre de exames: nuvem opcional vs. somente no aparelho ──
  function setupVaultToggle() {
    const botoes = document.querySelectorAll('[data-vault]');
    if (!botoes.length) return;
    const status = document.querySelector('[data-vault-status]');
    const badge = document.querySelector('[data-vault-badge]');
    const ICONEM_NUVEM = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>';
    const ICONEM_APARELHO = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="20" x="5" y="2" rx="2"/><path d="M12 18h.01"/></svg>';
    const TEXTOS = {
      cloud: { status: 'Sincronizado com a nuvem criptografada', badge: 'Na nuvem' },
      local: { status: 'Guardado apenas neste aparelho — sem nuvem', badge: 'No aparelho' }
    };
    botoes.forEach(btn => {
      btn.addEventListener('click', () => {
        const modo = btn.getAttribute('data-vault');
        botoes.forEach(outro => {
          const ativo = outro === btn;
          outro.classList.toggle('active', ativo);
          outro.setAttribute('aria-pressed', String(ativo));
        });
        if (status) status.textContent = TEXTOS[modo].status;
        if (badge) badge.innerHTML = (modo === 'cloud' ? ICONEM_NUVEM : ICONEM_APARELHO) + ' ' + TEXTOS[modo].badge;
      });
    });
  }

  // ── Inicialização Geral ──
  window.addEventListener('DOMContentLoaded', () => {
    setupSimulator();
    setupDemoIdentity();
    setupVaultToggle();
    setupOrb();
    setupLegalNavigation();
    setupHamburgerMenu();
    setupScrollReveal();
    setupAnalyticsTracking();
    setupCookieConsent();
    checkInitialRoute();

    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#termos') {
        showLegalView('termos');
      } else if (hash === '#privacidade') {
        showLegalView('privacidade');
      } else if (hash === '#inicio' || hash === '' || hash === '#demonstracao' || hash === '#recursos' || hash === '#como-instalar') {
        showLandingView();
      }
    });
  });

})();
