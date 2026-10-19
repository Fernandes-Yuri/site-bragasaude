# Site Braga Saúde

Site oficial e página de download do aplicativo Android.

## Estrutura

- `onboarding_site/public`: páginas e arquivos estáticos.
- `onboarding_site/firebase.json`: configuração do Firebase Hosting.

## Publicação

Na pasta `onboarding_site`, execute `firebase deploy --only hosting`.

O site oficial está em https://bragasaude.online. O domínio https://braga-saude.web.app e os acessos a `/app/` encaminham à página de download do aplicativo Android.

## Exclusão de conta e dados

Página pública: https://bragasaude.online/exclusao-de-dados (URL de instruções de exclusão para Meta for Developers). O formulário prepara uma mensagem localmente para o canal de privacidade já divulgado, `contatobragasaude@gmail.com`. O usuário precisa enviar o e-mail; o site não registra protocolo nem executa exclusão. A equipe confirma a titularidade e responde pelo canal indicado. Nenhum dado do formulário é salvo em cookies, URL, analytics ou armazenamento local.

## Site de saúde mental e clínicas

A nova publicação está em [`clinicas_site/`](clinicas_site/README.md), destinada a **clinicas.bragasaude.online**. O site oficial do aplicativo continua em **bragasaude.online**, sem migração para `app.`. As configurações e os destinos Firebase Hosting são separados.
