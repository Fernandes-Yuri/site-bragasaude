# Braga Saúde — Site & PWA Cuidador (`bragasaude-site-pwa`)

Repositório unificado contendo o site institucional/landing page e o aplicativo web progressivo (**PWA Modo Cuidador**) do ecossistema Braga Saúde, otimizado para iOS (Safari) e navegadores modernos.

---

## 📱 Visão Geral do PWA Cuidador

O **PWA Modo Cuidador** foi projetado especificamente para familiares e cuidadores acompanharem em tempo real a saúde do paciente:
- **Zero fricção de instalação:** Roda diretamente via Safari no iOS ("Adicionar à Tela de Início") com experiência nativa (Safe Area, status bar translúcida, ícones de alta resolução e funcionamento offline via Service Worker).
- **Modo Cuidador (`VIEWER_ONLY` / `HYBRID`):** Foco em monitoramento de sinais vitais (pressão arterial, frequência cardíaca, glicemia, saturação), checagem de medicamentos administrados no dia, progresso de hidratação e envio de mensagens de carinho.
- **Gráficos e Histórico:** Visualização de tendências semanais com Recharts.
- **Pareamento Ágil:** Scanner de QR Code integrado via câmera e inserção manual de código de 6 dígitos.
- **Botão de Emergência Rápido:** Acesso direto de discagem ao SAMU 192 ou contato de emergência.

---

## 🏗️ Estrutura do Projeto

```
bragasaude-site-pwa/
├── onboarding_site/          # Landing page institucional & configuração Firebase
│   ├── firebase.json         # Regras de Hosting, rewrites para /app/** e headers de cache
│   ├── .firebaserc           # Projeto Firebase (braga-saude)
│   └── public/
│       ├── index.html        # Landing page (bragasaude.online)
│       ├── downloads/        # APKs Android oficiais
│       └── app/              # Build estático gerado do PWA Modo Cuidador
│
└── pwa/                      # Código-fonte do PWA React 19 + TypeScript
    ├── src/
    │   ├── components/       # TodayVitalsCard, PatientHeaderCard, FamilyChatScreen,
    │   │                    #   VoiceAssistant, SharedGroceryListCard, ... (19 componentes)
    │   ├── services/         # api.ts, db.ts (Dexie), firebase.ts, grocery.ts,
    │   │                    #   messageQueue.ts (fila offline), waLinkTotp.ts
    │   ├── types.ts          # Definições tipadas do cuidador e métricas
    │   ├── App.tsx           # Dashboard mobile do cuidador
    │   └── main.tsx          # Entrypoint React
    ├── public/               # Ícones PWA (192px, 512px, apple-touch-icon)
    ├── vite.config.ts        # Vite + VitePWA (manifest, service worker)
    └── package.json
```

---

## 🚀 Desenvolvimento Local

### 1. PWA (Modo Cuidador)
```bash
cd pwa
npm install
npm run dev      # Executa o servidor de desenvolvimento Vite
```

### 2. Build do PWA para Produção
O comando compila e exporta os arquivos otimizados diretamente para `../onboarding_site/public/app`:
```bash
cd pwa
npm run build
```

---

## 🌍 Deploy para o Firebase Hosting

O deploy é unificado e atende aos dois domínios configurados:
- **Landing Page & APKs:** `https://bragasaude.online`
- **PWA Modo Cuidador:** `https://braga-saude.web.app` (e `https://bragasaude.online/app/`)

Para realizar o deploy do hosting:
```bash
cd onboarding_site
firebase deploy --only hosting
```