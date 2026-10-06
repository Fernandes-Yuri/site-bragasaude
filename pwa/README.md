# Braga Saúde — PWA Cuidador

Aplicativo web para familiares e cuidadores, desenvolvido com React, TypeScript e Vite. A documentação geral está no [README do repositório](../README.md).

Execute os comandos nesta pasta:

```bash
npm ci
npm run dev
npm run lint
npm test
npm run build
```

O build gera ../onboarding_site/public/app, servido sob /app/ pelo Firebase Hosting. Essa saída é ignorada pelo Git e deve ser regenerada antes da publicação. npm run preview permite conferir o build localmente.

APKs Android são distribuídos pelo gateway e pelo GitHub Actions/Releases do repositório Android; não devem ser adicionados a este repositório.