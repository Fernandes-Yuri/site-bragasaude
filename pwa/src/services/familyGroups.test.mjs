import { test } from 'node:test';
import assert from 'node:assert/strict';
import { familyGroups, resolveFamilyGroup } from './familyGroups.ts';

const binding = (patientUserId, caregiverUserId, status = 'ACTIVE') =>
  ({ id: `${patientUserId}-${caregiverUserId}`, patientUserId, caregiverUserId, status });

test('titular e dois cuidadores compartilham o mesmo grupo', () => {
  const bindings = [binding('p', 'a'), binding('p', 'b')];
  for (const uid of ['p', 'a', 'b']) assert.equal(resolveFamilyGroup(bindings, uid, null), 'p');
});
test('vários titulares exigem escolha explícita e preservam escolha após reordenação', () => {
  const bindings = [binding('p', 'a'), binding('q', 'a')];
  assert.equal(resolveFamilyGroup(bindings, 'a', null), '');
  assert.equal(resolveFamilyGroup(bindings.reverse(), 'a', 'q'), 'q');
});
test('revogação não troca silenciosamente o destinatário', () => {
  const bindings = [binding('p', 'a', 'REVOKED'), binding('q', 'a')];
  assert.equal(resolveFamilyGroup(bindings, 'a', 'p'), '');
});
test('convites e famílias alheias não entram na seleção', () => {
  const bindings = [binding('p', 'a', 'PENDING'), binding('q', 'b'), binding('r', 'a')];
  assert.deepEqual(familyGroups(bindings, 'a').map(b => b.patientUserId), ['r']);
});
test('perfil híbrido não confunde família própria com família acompanhada', () => {
  assert.equal(resolveFamilyGroup([binding('a', 'b'), binding('p', 'a')], 'a', null), '');
});
