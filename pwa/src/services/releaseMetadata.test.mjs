import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../../../onboarding_site/public/js/release-metadata.js', import.meta.url), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

async function render(fetch) {
  const nodes = Object.fromEntries(['apk-sha256-hash', 'modal-apk-sha256', 'btn-copy-hash', 'modal-btn-copy-hash'].map(id => [id, {textContent: '', disabled: false}]));
  const versions = Array.from({length: 3}, () => ({textContent: 'versão atual'}));
  const listeners = {};
  const document = {
    readyState: 'complete', visibilityState: 'visible',
    getElementById: id => nodes[id], querySelectorAll: () => versions,
    addEventListener: (event, callback) => { listeners[event] = callback; }
  };
  vm.runInNewContext(source, {document, fetch});
  await flush();
  return {nodes, versions, refresh: () => listeners['braga:refresh-release']()};
}

test('indisponibilidade dos metadados limpa versão e hash em todos os locais', async () => {
  const {nodes, versions} = await render(async () => { throw new Error('offline'); });
  assert.match(nodes['apk-sha256-hash'].textContent, /indisponível/);
  assert.match(nodes['modal-apk-sha256'].textContent, /indisponível/);
  assert.equal(nodes['btn-copy-hash'].disabled, true);
  versions.forEach(version => assert.equal(version.textContent, 'Versão indisponível'));
});

test('versão e hash válidos atualizam topo, FAQ e modal', async () => {
  const hash = 'a'.repeat(64);
  const {nodes, versions} = await render(async () => ({ok: true, json: async () => ({version_name: '1.3.5', sha256_hash: hash})}));
  assert.equal(nodes['apk-sha256-hash'].textContent, hash);
  assert.equal(nodes['modal-apk-sha256'].textContent, hash);
  assert.equal(nodes['btn-copy-hash'].disabled, false);
  versions.forEach(version => assert.equal(version.textContent, '1.3.5'));
});

test('hash malformado não valida uma versão parcial', async () => {
  const {nodes, versions} = await render(async () => ({ok: true, json: async () => ({version_name: '1.3.5', sha256_hash: 'antigo'})}));
  assert.equal(nodes['modal-btn-copy-hash'].disabled, true);
  versions.forEach(version => assert.equal(version.textContent, 'Versão indisponível'));
});

test('abrir modal após nova release atualiza todos os locais sem recarregar a página', async () => {
  let version = 'v1.3.6';
  const view = await render(async () => ({ok: true, json: async () => ({version_name: version, sha256_hash: 'a'.repeat(64)})}));
  version = 'v1.3.10';
  view.refresh();
  await flush();
  view.versions.forEach(node => assert.equal(node.textContent, 'v1.3.10'));
});

test('falha ao atualizar modal remove metadados antigos e bloqueia cópia', async () => {
  let online = true;
  const view = await render(async () => {
    if (!online) throw new Error('offline');
    return {ok: true, json: async () => ({version_name: 'v1.3.6', sha256_hash: 'a'.repeat(64)})};
  });
  online = false;
  view.refresh();
  await flush();
  view.versions.forEach(node => assert.equal(node.textContent, 'Versão indisponível'));
  assert.match(view.nodes['modal-apk-sha256'].textContent, /indisponível/);
  assert.equal(view.nodes['modal-btn-copy-hash'].disabled, true);
});

test('resposta antiga não sobrescreve a consulta mais recente do modal', async () => {
  let resolveFirst;
  let calls = 0;
  const first = new Promise(resolve => { resolveFirst = resolve; });
  const view = await render(() => {
    calls++;
    return calls === 1 ? first : Promise.resolve({ok: true, json: async () => ({version_name: 'v1.3.10', sha256_hash: 'b'.repeat(64)})});
  });
  view.refresh();
  await flush();
  resolveFirst({ok: true, json: async () => ({version_name: 'v1.3.6', sha256_hash: 'a'.repeat(64)})});
  await flush();
  view.versions.forEach(node => assert.equal(node.textContent, 'v1.3.10'));
  assert.equal(view.nodes['modal-apk-sha256'].textContent, 'b'.repeat(64));
});
