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

## Logotipos e links dos convênios

Os cards de Unimed, SulAmérica e Bradesco Saúde usam arquivos das páginas oficiais, sem redesenho, recorte ou alteração de cor, com links para os próprios sites em nova aba. Cópias locais evitam dependência de imagens externas durante a visita. A aceitação permanece sujeita ao hospital, ao plano e à rede credenciada.

Fontes consultadas em 20/10/2026:

- Unimed: https://www.unimed.coop.br/site/ — imagem oficial https://www.unimed.coop.br/site/image/layout_set_logo?img_id=70667720
- SulAmérica: https://portal.sulamericaseguros.com.br/home.htm — imagem oficial https://portal.sulamericaseguros.com.br/assets/logo-sula130.png
- Bradesco Saúde: https://www3.bradescoseguros.com.br/clientes/produtos/plano-saude — marca do portal oficial do beneficiário https://wwws.bradescosaude.com.br/wps/wcm/connect/beneficiariosaude/9f119208-9763-479f-b472-066beaa450ec/assets%252Fimages%252Flogo.svg?MOD=AJPERES

Os arquivos em `public/assets/convenios/` são marcas dos respectivos titulares e aparecem apenas para identificar as operadoras citadas.

## Documentos e preferência local

As cinco páginas públicas carregam `assets/consent.js` e `assets/consent.css`. O aviso exige marcação expressa dos Termos de Uso e ciência das Políticas de Privacidade e de Cookies antes de registrar `accepted`. A escolha `rejected` mantém essas confirmações falsas. A navegação informativa continua disponível sem aceite. Não existem categorias opcionais nem rastreadores ativados pelo aviso.

A chave `braga_clinicas_privacy_choice` usa localStorage, com validade de 180 dias, data da escolha, versão dos documentos e estado de aceite. O registro não contém identificação, não é enviado ao servidor e não é comprovante de consentimento auditado no backend. Em armazenamento bloqueado, a escolha funciona somente na página atual e o visitante recebe essa informação. Reabrir preferências, retirar o aceite e sincronizar alterações entre abas usam somente essa chave.

Ao alterar o conteúdo dos documentos, atualize `VERSION` em `consent.js`, a versão/data nas três políticas e o parâmetro de versão dos assets em todas as páginas. Uma escolha com versão antiga ou vencida não suprime o aviso. Os documentos e os contatos de urgência permanecem acessíveis.

Validação: `node --test scripts/tests/test-clinicas-consent.cjs`. Referência de implementação consultada: [Guia de Cookies da ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais), com escolha expressa, transparência sobre o armazenamento e revisão facilitada.
