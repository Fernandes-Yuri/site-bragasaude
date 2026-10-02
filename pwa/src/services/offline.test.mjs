import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getDatabase, clearAccountData } from './db.ts';
import { persistGroceryItem, loadGroceryItems } from './grocery.ts';
import { queueMessage, flushMessageQueue } from './messageQueue.ts';

const a = { ownerId: 'conta-a', patientId: 'paciente-a' };
const b = { ownerId: 'conta-b', patientId: 'paciente-a' };
const otherPatient = { ownerId: 'conta-a', patientId: 'paciente-b' };
const originalFetch = globalThis.fetch;
const originalNow = Date.now;
const message = () => ({ id: crypto.randomUUID(), senderId:a.ownerId, patientId:a.patientId,
  senderName:'Cuidador',messageText:'Lembrete',iconType:'LOVE',sentAt:new Date().toISOString(),
  expiresAt:new Date(Date.now()+86400000).toISOString() });
afterEach(async () => {
  globalThis.fetch = originalFetch;
  Date.now = originalNow;
  await clearAccountData(a.ownerId);
  await clearAccountData(b.ownerId);
});

test('dados legados sem dono são expurgados sem atribuição à conta atual', async () => {
  const legacy = new Dexie('braga-saude-cuidador');
  legacy.version(1).stores({ groceryItems:'id',messageQueue:'id' });
  await legacy.table('groceryItems').put({id:'med-legado',foodName:'Medicamento privado'});
  const payload = message();
  await legacy.table('messageQueue').put({id:payload.id,message:payload,status:'pending',queuedAt:Date.now(),attempts:2});
  legacy.close();
  assert.deepEqual(await loadGroceryItems(a),[]);
  assert.deepEqual((await (await getDatabase(a)).messageQueue.get(payload.id)).message,payload);
  assert.equal((await (await getDatabase(a)).messageQueue.get(payload.id)).attempts,2);
  assert.equal(await (await getDatabase(b)).messageQueue.count(),0);
  assert.equal(await Dexie.exists('braga-saude-cuidador'),false);
});
test('recarga, troca de conta e de paciente preservam isolamento das compras', async () => {
  await persistGroceryItem(a,{id:'med-1',foodName:'Losartana',category:'Farmácia',purchaseUnitText:'1 embalagem',isCheckedInPantry:false});
  (await getDatabase(a)).close();
  assert.equal((await loadGroceryItems(a))[0].foodName,'Losartana');
  assert.deepEqual(await loadGroceryItems(b),[]);
  assert.deepEqual(await loadGroceryItems(otherPatient),[]);
  await clearAccountData(a.ownerId);
  assert.deepEqual(await loadGroceryItems(a),[]);
});
test('retentativa conserva id, envio e vencimento originais e não entrega a fila de outra conta', async () => {
  const sent = [];
  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body); sent.push(body);
    return sent.length === 1 ? Response.json({detail:'offline'},{status:503}) : Response.json({status:'success',id:body.id});
  };
  const payload = message();
  assert.deepEqual(await queueMessage(payload,'token-a'),{delivered:false,queued:true});
  await flushMessageQueue(b,async () => 'token-b');
  assert.equal(sent.length,1);
  assert.equal((await flushMessageQueue(a,async () => 'token-a')).delivered,1);
  assert.deepEqual(sent,[payload,payload]);
  assert.equal(await (await getDatabase(a)).messageQueue.count(),0);
});
test('mensagem vencida é expurgada sem renovar prazo ou chamar a rede', async () => {
  globalThis.fetch = async () => Response.json({detail:'offline'},{status:503});
  const payload = message();
  await queueMessage(payload,'token-a');
  Date.now = () => Date.parse(payload.expiresAt)+1;
  globalThis.fetch = async () => { throw new Error('mensagem vencida não deve sair'); };
  assert.equal((await flushMessageQueue(a,async () => 'token-a')).expired,1);
  assert.equal(await (await getDatabase(a)).messageQueue.count(),0);
});
test('falha no IndexedDB não afirma que a mensagem foi salva', async () => {
  const database = await getDatabase(a);
  const put = database.messageQueue.put;
  database.messageQueue.put = async () => { throw new Error('cota excedida'); };
  globalThis.fetch = async () => Response.json({detail:'offline'},{status:503});
  try { assert.deepEqual(await queueMessage(message(),'token-a'),{delivered:false,queued:false}); }
  finally { database.messageQueue.put = put; }
});
test('resposta 200 sem confirmação não marca entregue; limite fica visível e admite nova tentativa', async () => {
  globalThis.fetch = async () => Response.json({status:'offline_mode'});
  const payload = message();
  await queueMessage(payload,'token-a');
  for (let attempt=0; attempt<4; attempt++) await flushMessageQueue(a,async () => 'token-a');
  assert.equal((await flushMessageQueue(a,async () => 'token-a')).failed,1);
  globalThis.fetch = async (_url,options) => Response.json({status:'success',id:JSON.parse(options.body).id});
  assert.equal((await flushMessageQueue(a,async () => 'token-a',true)).delivered,1);
});
