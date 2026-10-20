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

## Miniatura de compartilhamento

A capa Open Graph/Twitter usa `public/assets/compartilhar-cuidado-v1.jpg` (1200 × 630), com mensagem de acolhimento e a ilustração botânica do site. O domínio personalizado já está associado e a imagem está publicada.

Para recriar a imagem, instale Pillow no seu ambiente Python e as fontes DejaVu do sistema e execute `python3 scripts/build-clinicas-share.py` na raiz do repositório. A geração é manual; o deploy publica o JPEG versionado sem exigir Pillow no CI. Ao substituir a arte, use um novo nome de arquivo e atualize os metadados para evitar reutilização da imagem anterior em cache.

## Chat de dúvidas frequentes

A página inicial inclui um chat acessível pelo botão “Tire suas dúvidas” ou pela seção de perguntas frequentes. Sugestões e perguntas digitadas usam respostas prontas em `public/assets/faq.js`, sem provedor de IA, backend, armazenamento ou envio das mensagens. A conversa fica apenas na memória da página e pode ser reiniciada pelo visitante.

As respostas reutilizam as informações do site, deixam valores e vagas sujeitos à confirmação com a instituição e mantêm o contato externo pelo WhatsApp. O FAQ estático continua disponível sem JavaScript. Para editar assuntos, altere `topics` e valide com `node --test scripts/tests/test-clinicas-faq.cjs`; a folha de estilo do widget fica em `public/assets/faq.css`. Ao alterar arquivos do widget, atualize o parâmetro de versão de suas referências no HTML.
