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

  function switchSimScreen(screenName) {
    const screens = document.querySelectorAll('.sim-screen');
    const buttons = document.querySelectorAll('.phone-tab-btn');

    screens.forEach(screen => {
      screen.classList.toggle('active', screen.id === 'sim-' + screenName);
    });

    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-sim') === screenName);
    });

    currentSimIndex = simScreens.indexOf(screenName);
  }

  function startSimAutoplay() {
    if (simAutoplayTimer) clearInterval(simAutoplayTimer);
    simAutoplayTimer = setInterval(() => {
      if (isAutoplayPaused) return;
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
          switchSimScreen(screenName);
          // Pausa temporária quando o usuário interage voluntariamente
          isAutoplayPaused = true;
          setTimeout(() => { isAutoplayPaused = false; }, 12000);
        }
      });
    });

    const phoneFrame = document.querySelector('.phone-frame');
    if (phoneFrame) {
      phoneFrame.addEventListener('mouseenter', () => { isAutoplayPaused = true; });
      phoneFrame.addEventListener('mouseleave', () => { isAutoplayPaused = false; });
    }

    startSimAutoplay();
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
    
    // Botão de download APK — Direto via GitHub Releases (Sem telas de aviso, CDN global ultra-rápida)
    if (btnDownloadAPK) {
      btnDownloadAPK.addEventListener('click', () => {
        console.log('[Braga Saúde] Download do APK iniciado via GitHub Releases CDN');
        setTimeout(() => {
          const guide = document.getElementById('como-instalar');
          if (guide) {
            guide.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      });
    }
    
    // Botão de instalação PWA (Em breve)
    if (btnInstallPWA) {
      btnInstallPWA.addEventListener('click', () => {
        alert('O Modo Cuidador (PWA / iOS) estará disponível em breve! Estamos realizando os últimos testes de segurança e homologação.');
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
    const downloadBtns = document.querySelectorAll('a[href*="/api/app/download"], #btn-download-apk');
    downloadBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (typeof gtag === 'function') {
          gtag('event', 'download_apk', {
            event_category: 'conversion',
            event_label: 'BragaSaude.apk (v1.2.0)',
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
