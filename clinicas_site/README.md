# Braga Saúde — saúde mental e clínicas

Destino: **https://clinicas.bragasaude.online**. O site oficial do aplicativo permanece em **https://bragasaude.online**, com configuração independente em `onboarding_site/`.

Este diretório publica exclusivamente no Hosting site `braga-saude-clinicas`, projeto Firebase `braga-saude`. Não alterar o destino para `braga-saude`: ele atende o site oficial.

## Catálogo inicial

`content/hospitais.json` contém dez espaços em rascunho. Nenhuma instituição fictícia é exibida. Preencha nome, cidade/UF, descrição, especialidades, tipos de atendimento, convênios, contato, foto autorizada e texto alternativo. O telefone deve incluir país e DDD, somente dígitos. Registre fonte HTTPS e data real de revisão em `verification_url` e `reviewed_at`. CNES, quando informado, deve ter sete dígitos; o preenchimento não representa certificação automática.

Somente mudar `status` para `published` após revisar informações e autorização de uso das imagens. Não cadastrar dados de pacientes. O catálogo público exclui todos os rascunhos e campos internos.

```sh
python3 scripts/build-clinicas.py
python3 -m unittest discover -s scripts/tests -p 'test_clinicas.py'
node --check clinicas_site/public/assets/site.js
```

Execute os comandos acima na raiz do repositório. Versione também `public/data/hospitais.json` após editar o catálogo.

## Publicação isolada

```sh
cd clinicas_site
firebase deploy --only hosting --project braga-saude
```

O domínio personalizado deve ser associado ao site **braga-saude-clinicas** no Firebase Hosting e ter os registros DNS indicados pelo próprio Firebase. Não alterar os registros do domínio raiz nem migrar o aplicativo para outro subdomínio.

O WhatsApp abre uma solicitação genérica de informações no número já utilizado pela marca. Não há formulário clínico, automação de mensagens, analytics ou integração com o antigo assistente de saúde. A disponibilidade de instituições e vagas precisa ser confirmada diretamente.
