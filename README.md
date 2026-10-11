# Site Braga Saúde

Site oficial e página de download do aplicativo Android.

## Estrutura

- `onboarding_site/public`: páginas e arquivos estáticos.
- `onboarding_site/firebase.json`: configuração do Firebase Hosting.

## Publicação

Na pasta `onboarding_site`, execute `firebase deploy --only hosting`.

O site oficial está em https://bragasaude.online. O domínio https://braga-saude.web.app e os acessos a `/app/` encaminham à página de download do aplicativo Android.
