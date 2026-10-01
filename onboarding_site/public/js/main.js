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

  // ── 7. Detecção de Dispositivo e Download ──
  function setupDeviceDetection() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
    
    const btnDownloadAPK = document.getElementById('btn-download-apk');
    const btnInstallPWA = document.getElementById('btn-install-pwa');
    
    if (!btnDownloadAPK && !btnInstallPWA) return;
    
    // Detecta se é PWA (instalado) — esconde os botões de download
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    
    if (isPWA) {
      const downloadGroup = document.querySelector('.hero-download-group');
      if (downloadGroup) downloadGroup.style.display = 'none';
      return;
    }
    
    // Esconde o botão Android se estiver no iOS
    if (isIOS && btnDownloadAPK) {
      btnDownloadAPK.style.display = 'none';
    }
    
    // Modal de confirmação e integridade SHA-256 no ato do download
    const securityModal = document.getElementById('download-security-modal');
    const btnCloseModal = document.getElementById('btn-close-download-modal');
    const btnConfirmModal = document.getElementById('btn-confirm-download-modal');

    function openSecurityModal() {
      if (securityModal) {
        securityModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    }

    function closeSecurityModal() {
      if (securityModal) {
        securityModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }

    if (btnCloseModal) btnCloseModal.addEventListener('click', closeSecurityModal);
    if (btnConfirmModal) btnConfirmModal.addEventListener('click', closeSecurityModal);
    if (securityModal) {
      securityModal.addEventListener('click', (e) => {
        if (e.target === securityModal) closeSecurityModal();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && securityModal.classList.contains('active')) {
          closeSecurityModal();
        }
      });
    }

    // Função de cópia do Hash SHA-256 com feedback
    function setupCopyButton(btnId, codeId, labelId) {
      const btn = document.getElementById(btnId);
      const code = document.getElementById(codeId);
      const label = document.getElementById(labelId);
      if (!btn || !code) return;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const hashText = code.textContent.trim();
        if (!hashText || hashText.includes('...')) return;
        navigator.clipboard.writeText(hashText).then(() => {
          const original = label ? label.textContent : '';
          if (label) label.textContent = 'Copiado!';
          btn.style.background = '#00695C';
          setTimeout(() => {
            if (label) label.textContent = original;
            btn.style.background = '';
          }, 2000);
        }).catch(() => {
          const range = document.createRange();
          range.selectNodeContents(code);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
      });
    }

    setupCopyButton('btn-copy-hash', 'apk-sha256-hash', 'copy-hash-label');
    setupCopyButton('modal-btn-copy-hash', 'modal-apk-sha256', 'modal-copy-hash-label');

    // Botão de download APK — dispara download e exibe o modal com a hash oficial
    if (btnDownloadAPK) {
      btnDownloadAPK.addEventListener('click', () => {
        console.log('[Braga Saúde] Download do APK iniciado via /api/app/download');
        openSecurityModal();
      });
    }
    
    // Botão de instalação PWA — leva ao PWA, que oferece o atalho na tela inicial
    // (beforeinstallprompt no Android/Chrome; guia "Adicionar à Tela de Início" no iOS).
    if (btnInstallPWA) {
      btnInstallPWA.addEventListener('click', () => {
        console.log('[Braga Saúde] Abrindo PWA Modo Cuidador para instalação');
      });
    }
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


  // ── Guia Interativo de Instalação do APK ──
  function selectInstallStep(stepNumber) {
    const stepItems = document.querySelectorAll('.install-step-item');
    const screenViews = document.querySelectorAll('.install-screen-view');

    stepItems.forEach(item => {
      const step = item.getAttribute('data-step');
      item.classList.toggle('active', step === String(stepNumber));
    });

    screenViews.forEach(view => {
      view.classList.toggle('active', view.id === 'install-screen-' + stepNumber);
    });
  }
  window.selectInstallStep = selectInstallStep;

  function setupInstallGuide() {
    const stepItems = document.querySelectorAll('.install-step-item');
    stepItems.forEach(item => {
      item.addEventListener('click', () => {
        const step = item.getAttribute('data-step');
        if (step) selectInstallStep(parseInt(step, 10));
      });
    });
  }

  // ── Rastreamento de Conversões (Google Analytics 4) ──
  function setupAnalyticsTracking() {
    const downloadBtns = document.querySelectorAll('a[href*="/api/app/download"]');
    downloadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'download_apk', {
            event_category: 'conversion',
            // AUD-PW(B): versao hardcoded — manter em sincronia com o
            // versionName em app/build.gradle.kts a cada release.
            event_label: 'BragaSaude.apk (v1.2.9)',
            value: 1
          });
        }
      });
    });

    const pwaBtns = document.querySelectorAll('#btn-install-pwa');
    pwaBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'open_pwa_cuidador', {
            event_category: 'engagement',
            event_label: 'PWA Modo Cuidador (iPhone/Web)',
            value: 1
          });
        }
      });
    });

    const waBtns = document.querySelectorAll('a[href*="wa.me"], .btn-whatsapp');
    waBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'whatsapp_lead', {
            event_category: 'engagement',
            event_label: 'Conversa WhatsApp'
          });
        }
      });
    });
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

  // ── Inicialização Geral ──
  window.addEventListener('DOMContentLoaded', () => {
    setupSimulator();
    setupOrb();
    setupLegalNavigation();
    setupDeviceDetection();
    setupHamburgerMenu();
    setupScrollReveal();
    setupInstallGuide();
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
