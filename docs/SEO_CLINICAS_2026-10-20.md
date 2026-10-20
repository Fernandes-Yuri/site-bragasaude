# SEO do ecossistema editorial Braga Saúde

Escopo: site das clínicas, entrega editorial da gateway e portal de publicação. O aplicativo/site institucional principal continua com suas rotas e hospedagem existentes.

## Base encontrada

Home das clínicas já tinha HTML estático, `lang=pt-BR`, título, descrição, canonical, favicon, metadados Open Graph/Twitter com imagem de 1200×630, headings e links reais. Não havia `robots.txt`, sitemap ou páginas de artigos. O portal administrativo tinha descrição pública sem diretiva de não indexação.

## Mudanças preparadas

- Home: entrada rastreável para `/noticias`, identificação Organization/WebSite coerente com a marca (sem afirmar ser hospital), `taxID` e links internos.
- Artigos: URL estável por slug; título/descrição, canonical, capa com alt/crédito, autoria/bio, fontes, revisão técnica quando real, datas e JSON-LD Article/NewsArticle preenchidos no navegador a partir da API pública. O texto não vem no HTML inicial do template estático.
- Lista paginada: links HTML próprios inseridos após leitura da API, canonical da página corrente e vazio sem conteúdo fictício. Página fora do intervalo redireciona para o 404 real do Hosting.
- Rastreamento: robots e sitemap automático somente de publicações no ar; documentos institucionais com canonical/descrição; política editorial pública.
- Erros: API retorna 404 para conteúdo ausente/retirado e 503 para falha do banco. Frontend redireciona conteúdo ausente ao 404 do Hosting; erro temporário mostra nova tentativa. O documento inicial do frontend tem status 200, limite reconhecido da entrega estática.
- Portal: `noindex,nofollow` e robots com bloqueio, pois login e editor não são páginas de conteúdo para busca. Isso não substitui autenticação/autorização.
- Redes: ícones anunciados como em breve; sem links inventados ou `sameAs` sem perfil confirmado.

## Pendências operacionais

A entrega foi ajustada para Firebase exclusivamente estático, consumindo a gateway. O sitemap é gerado no backend e referenciado pelo robots.txt das clínicas, seguindo a submissão entre sites. Não requer Blaze ou processamento no Firebase.

A indexação dos artigos depende da renderização JavaScript pelo buscador. Robôs que não executam JavaScript recebem os metadados genéricos do template, inclusive para compartilhamento. Não se deve prometer SSR, miniaturas individuais para todos os bots, resultados enriquecidos ou ranking.

Após o primeiro conteúdo real revisado: cadastrar/verificar a propriedade `https://clinicas.bragasaude.online/` no Search Console pelo responsável; enviar `/sitemap.xml`; testar uma URL no Rich Results Test e na inspeção de URL; acompanhar indexação, desempenho e Core Web Vitals com dados reais. Este trabalho não inclui acesso à conta Search Console nem promete posição nos resultados.

Ao crescer: acompanhar os sitemaps paginados do backend e planejar retenção de capas não usadas; autores com página biográfica própria; links temáticos entre artigos; relatórios de desempenho com decisão explícita de privacidade caso se adotem métricas opcionais.

## Referências oficiais consultadas

- [Fundamentos de SEO em JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Dados estruturados Article](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Construção e envio de sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Configuração de rewrites para arquivos estáticos no Hosting](https://firebase.google.com/docs/hosting/full-config)

Dados estruturados ajudam os buscadores a compreender a página; sua presença não garante resultados enriquecidos nem ranking. As decisões deste documento são a implementação escolhida para o ecossistema atual, a partir das referências acima.
