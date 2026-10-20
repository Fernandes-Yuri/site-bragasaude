# SEO do ecossistema editorial Braga Saúde

Escopo: site das clínicas, entrega editorial da gateway e portal de publicação. O aplicativo/site institucional principal continua com suas rotas e hospedagem existentes.

## Base encontrada

Home das clínicas já tinha HTML estático, `lang=pt-BR`, título, descrição, canonical, favicon, metadados Open Graph/Twitter com imagem de 1200×630, headings e links reais. Não havia `robots.txt`, sitemap ou páginas de artigos. O portal administrativo tinha descrição pública sem diretiva de não indexação.

## Mudanças preparadas

- Home: entrada rastreável para `/noticias`, identificação Organization/WebSite coerente com a marca (sem afirmar ser hospital), `taxID` e links internos.
- Artigos: URL estável por slug, título/descrição exclusivos, texto inteiro no HTML, canonical, capa com alt/crédito, autoria/bio, fontes, revisão técnica quando real, datas e JSON-LD Article/NewsArticle coerente com o conteúdo visível.
- Lista paginada: links HTML próprios para artigos e páginas; canonical da página corrente. Vazio sem conteúdo fictício; página fora do intervalo retorna 404.
- Rastreamento: robots e sitemap automático somente de publicações no ar; documentos institucionais com canonical/descrição; política editorial pública.
- Erros reais: 404 para conteúdo ausente/retirado, 503 para falha da API, `noindex` nos erros e sem transformar indisponibilidade em falso 200.
- Portal: `noindex,nofollow` e robots com bloqueio, pois login e editor não são páginas de conteúdo para busca. Isso não substitui autenticação/autorização.
- Redes: ícones anunciados como em breve; sem links inventados ou `sameAs` sem perfil confirmado.

## Pendências operacionais

A implantação do renderer exige ativar Blaze no Firebase. Até isso ocorrer, não publicar links/rewrite para páginas ainda indisponíveis. A gateway/API e sua migration já podem ser instaladas sem tornar artigos públicos.

Após o primeiro conteúdo real revisado: cadastrar/verificar a propriedade `https://clinicas.bragasaude.online/` no Search Console pelo responsável; enviar `/sitemap.xml`; testar uma URL no Rich Results Test e na inspeção de URL; acompanhar indexação, desempenho e Core Web Vitals com dados reais. Este trabalho não inclui acesso à conta Search Console nem promete posição nos resultados.

Ao crescer: índice de sitemaps antes de 50 mil URLs; política de retenção de capas não usadas; autores com página biográfica própria; links temáticos entre artigos; relatórios de desempenho com decisão explícita de privacidade caso se adotem métricas opcionais.

## Referências oficiais consultadas

- [Fundamentos de SEO em JavaScript](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Dados estruturados Article](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Construção e envio de sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Hosting com Cloud Functions](https://firebase.google.com/docs/hosting/functions)

Dados estruturados ajudam os buscadores a compreender a página; sua presença não garante resultados enriquecidos nem ranking. As decisões deste documento são a implementação escolhida para o ecossistema atual, a partir das referências acima.
