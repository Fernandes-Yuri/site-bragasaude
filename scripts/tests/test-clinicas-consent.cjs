'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { KEY, VERSION, RETENTION, createChoice, parseChoice } = require('../../clinicas_site/public/assets/consent.js');
const now = Date.parse('2026-10-20T12:00:00Z');

test('aceite e recusa não se confundem e nunca ativam rastreadores', () => {
  for (const status of ['accepted', 'rejected']) {
    const choice = createChoice(status, now);
    assert.equal(choice.termsAccepted, status === 'accepted');
    assert.equal(choice.privacyAcknowledged, status === 'accepted');
    assert.equal(choice.cookies, 'necessary-only');
    assert.equal(choice.version, VERSION);
    assert.equal(parseChoice(JSON.stringify(choice), now).status, status);
  }
  assert.throws(() => createChoice('all', now));
  assert.equal(KEY, 'braga_clinicas_privacy_choice');
});

test('preferência vencida ou de outra versão exige nova escolha', () => {
  const choice = createChoice('accepted', now);
  const raw = JSON.stringify(choice);
  assert.ok(parseChoice(raw, now + RETENTION - 1));
  assert.equal(parseChoice(raw, now + RETENTION), null);
  assert.equal(parseChoice(JSON.stringify({ ...choice, version: 'antiga' }), now), null);
});

test('dados corrompidos não são tratados como aceite', () => {
  const choice = createChoice('accepted', now);
  for (const raw of [null, '', '{', 'null', '{}', JSON.stringify({ ...choice, termsAccepted: false }), JSON.stringify({ ...choice, cookies: 'all' }), JSON.stringify({ ...choice, expiresAt: 'invalida' }), JSON.stringify({ ...choice, decidedAt: 0 })]) {
    assert.equal(parseChoice(raw, now), null);
  }
  assert.equal(parseChoice(JSON.stringify(createChoice('accepted', now + 3600000)), now), null);
});

test('registro mínimo não contém dados do visitante nem conversa', () => {
  assert.deepEqual(Object.keys(createChoice('accepted', now)).sort(), ['version', 'status', 'termsAccepted', 'privacyAcknowledged', 'cookies', 'decidedAt', 'expiresAt'].sort());
});
