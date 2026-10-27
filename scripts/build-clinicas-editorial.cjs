// Gera somente as telas estáticas; artigos vêm da API, sem deploy por conteúdo.
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'../clinicas_site/public');
const r=require(path.join(root,'assets/editorial-render.js'));
function shell(title,description,mode){
 const content='<div data-editorial-content aria-busy="true"><h1>'+r.esc(title)+'</h1><p role="status">Carregando conteúdo publicado…</p><noscript><p>Ative o JavaScript para consultar os artigos publicados. Você também pode <a href="/#contato">conversar com a equipe</a>.</p></noscript></div>';
 return r.page({title,description,path:'/noticias',content}).html
  .replace(/<link rel="canonical"[^>]*>/,'')
  .replace('</head>','<script src="/assets/editorial-render.js?v=3" defer></script><script src="/assets/editorial.js?v=2" defer></script></head>')
  .replace('<main id="conteudo"','<main data-editorial-mode="'+mode+'" id="conteudo"');
}
const listing=shell('Notícias e artigos','Informação sobre saúde mental, cuidado e apoio à família, com autoria e fontes.','list');
const article=shell('Informação e cuidado em saúde mental','Notícias e artigos da Braga Saúde, com autoria, fontes e datas de publicação.','article');
fs.mkdirSync(path.join(root,'noticias'),{recursive:true});
fs.writeFileSync(path.join(root,'noticias.html'),listing+'\n');
fs.writeFileSync(path.join(root,'editorial-artigo.html'),article+'\n');
fs.writeFileSync(path.join(root,'noticias/politica-editorial.html'),r.policy().html+'\n');
fs.writeFileSync(path.join(root,'404.html'),r.errorPage(404).html.replace('</head>','<meta name="robots" content="noindex"></head>')+'\n');
