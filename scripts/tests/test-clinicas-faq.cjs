'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { findTopic } = require('../../clinicas_site/public/assets/faq.js');

test('responde às dúvidas de cuidado sem prometer internação ou diagnóstico', () => {
  const admission = findTopic('Meu filho precisa de internação?');
  assert.equal(admission.id, 'admission');
  assert.match(admission.answer, /avaliação individual/);
  assert.equal(findTopic('Preciso saber meu diagnóstico?').id, 'diagnosis');
  assert.equal(findTopic('Quero ajudar minha mãe').id, 'family');
});

test('valores e vagas dependem de confirmação com cada instituição', () => {
  const cost = findTopic('QUANTO CUSTA? ACEITA CONVÊNIO?');
  assert.equal(cost.id, 'cost');
  assert.match(cost.answer, /confirmados diretamente/);
  const hospitals = findTopic('Tem vagas no hospital?');
  assert.equal(hospitals.id, 'hospitals');
  assert.match(hospitals.answer, /confirmadas diretamente/);
});

test('prioriza ajuda imediata sobre contato e outros assuntos', () => {
  const urgent = findTopic('Preciso de ajuda agora, posso falar no WhatsApp?');
  assert.equal(urgent.id, 'urgent');
  assert.deepEqual(urgent.links.map(link => link[1]), ['tel:192', 'tel:188']);
});

test('reconhece perguntas com acentos, SUS e aplicativo sem confundir palavras', () => {
  assert.equal(findTopic('Onde encontro atendimento público pelo SUS?').id, 'sus');
  assert.equal(findTopic('Como faço o download do aplicativo?').id, 'app');
  assert.equal(findTopic('Preciso falar com um atendente').id, 'contact');
  assert.equal(findTopic('tenho ansiedade').id, 'care');
  assert.equal(findTopic('Olá!').id, 'start');
  assert.equal(findTopic('rappeando sobre uma fantasia'), null);
});

test('dúvidas fora do FAQ ficam sem resposta inventada', () => {
  assert.equal(findTopic('Qual é o nome do médico de plantão?'), null);
  assert.equal(findTopic(''), null);
});
