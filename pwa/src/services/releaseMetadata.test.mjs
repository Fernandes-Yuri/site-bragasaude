import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../../../onboarding_site/public/js/release-metadata.js',import.meta.url),'utf8');

async function render(fetch) {
  const nodes = Object.fromEntries(['apk-sha256-hash','modal-apk-sha256','btn-copy-hash','modal-btn-copy-hash'].map(id => [id,{textContent:'',disabled:false}]));
  const version = {textContent:'versão atual'};
  const document = {readyState:'complete',getElementById:id => nodes[id],querySelectorAll:() => [version]};
  vm.runInNewContext(source,{document,fetch});
  await new Promise(resolve => setImmediate(resolve));
  return {nodes,version};
}
test('indisponibilidade dos metadados não conserva hash nem permite copiá-lo',async () => {
  const {nodes,version} = await render(async () => {throw new Error('offline');});
  assert.match(nodes['apk-sha256-hash'].textContent,/indisponível/);
  assert.match(nodes['modal-apk-sha256'].textContent,/indisponível/);
  assert.equal(nodes['btn-copy-hash'].disabled,true);
  assert.equal(version.textContent,'versão atual');
});
test('versão e hash válidos atualizam os dois locais após leitura do DOM',async () => {
  const hash = 'a'.repeat(64);
  const {nodes,version} = await render(async () => ({ok:true,json:async () => ({version_name:'1.3.5',sha256_hash:hash})}));
  assert.equal(nodes['apk-sha256-hash'].textContent,hash);
  assert.equal(nodes['modal-apk-sha256'].textContent,hash);
  assert.equal(nodes['btn-copy-hash'].disabled,false);
  assert.equal(version.textContent,'1.3.5');
});
test('hash malformado não valida uma versão parcial',async () => {
  const {nodes,version} = await render(async () => ({ok:true,json:async () => ({version_name:'1.3.5',sha256_hash:'antigo'})}));
  assert.equal(nodes['modal-btn-copy-hash'].disabled,true);
  assert.equal(version.textContent,'versão atual');
});
