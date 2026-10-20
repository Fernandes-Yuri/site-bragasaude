'use strict';
const {onRequest}=require('firebase-functions/v2/https');
const render=require('./render.cjs');
const API='https://api.bragasaude.online/api/editorial/articles';
async function read(path='') {
 const res=await fetch(API+path,{signal:AbortSignal.timeout(8000),headers:{Accept:'application/json'}});
 if(!res.ok){const err=new Error('Editorial upstream unavailable');err.status=res.status;throw err;}
 return res.json();
}
exports.clinicasEditorial=onRequest({region:'us-central1',maxInstances:3,memory:'256MiB',timeoutSeconds:30,invoker:'public'},async(req,res)=>{
 res.set('X-Content-Type-Options','nosniff');
 const path=req.path.replace(/\/$/,'')||'/';
 if(req.method!=='GET'&&req.method!=='HEAD')return res.status(405).set('Allow','GET, HEAD').send('Método não permitido.');
 try {
  if(path==='/sitemap.xml'){
   const items=[];let page=1,total=0;
   do {const data=await read(`?limit=100&page=${page++}`);items.push(...data.items);total=data.total;if(page>501)throw new Error('Sitemap limit');}while(items.length<total);
   return res.type('application/xml').set('Cache-Control','public,max-age=0,s-maxage=60').send(render.sitemap(items));
  }
  let result;
  if(path==='/noticias'){
   const page=Number(req.query.page||1);
   if(!Number.isInteger(page)||page<1||page>10000)result=render.errorPage(404);
   else {const data=await read(`?page=${page}`);result=page>1&&!data.items.length?render.errorPage(404):render.listing(data,page);}
  } else if(path==='/noticias/politica-editorial')result=render.policy();
  else if(/^\/noticias\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path))result=render.article(await read('/'+path.split('/')[2]));
  else result=render.errorPage(404);
  if(result.status!==200)res.set('X-Robots-Tag','noindex');
  res.status(result.status).type('html').set('Cache-Control',result.status===200?'public,max-age=0,s-maxage=60':'no-store').send(result.html);
 }catch(error){
  const status=error.status===404?404:503;
  res.status(status).set('X-Robots-Tag','noindex').set('Cache-Control','no-store').type('html').send(render.errorPage(status).html);
 }
});
