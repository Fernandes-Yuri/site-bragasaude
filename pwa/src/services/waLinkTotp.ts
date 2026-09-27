/**
 * Vinculo de WhatsApp por TOTP - espelho do gateway (wa_link_totp.py) e do
 * Android (WhatsAppLinkTotp.kt).
 *
 * Arquitetura temporaria, ate a Meta liberar o template de autenticacao.
 * A conta nasce com um segredo TOTP "sob o capo". No ato do clique no botao de
 * vincular, o cliente calcula o codigo ATUAL localmente (sem chamar o servidor)
 * e abre o WhatsApp com a mensagem pronta. O gateway recomputa o mesmo codigo a
 * partir do segredo que guardou e vincula o numero (verificado pela Meta).
 *
 * Janela de 300s (5 minutos), sem tolerancia: ou esta dentro, ou o usuario volta e pega um
 * codigo novo.
 */

const SECRET_BYTES = 20;
export const TOTP_STEP_SECONDS = 300;

/** Gera um segredo TOTP aleatorio em base32 (o cliente manda na sincronizacao). */
export function generateTotpSecret(): string {
  const bytes = new Uint8Array(SECRET_BYTES);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

/** Codigo TOTP atual para o segredo (deve concordar com o gateway). */
export async function currentTotpCode(
  secretBase32: string,
  atMs: number = Date.now()
): Promise<string> {
  const counter = Math.floor(Math.floor(atMs / 1000) / TOTP_STEP_SECONDS);
  return hotp(secretBase32, counter);
}

/** Segundos restantes da janela atual (para a UI mostrar urgencia). */
export function secondsUntilRotation(atMs: number = Date.now()): number {
  const nowSec = Math.floor(atMs / 1000);
  return TOTP_STEP_SECONDS - (nowSec % TOTP_STEP_SECONDS);
}

async function hotp(secretBase32: string, counter: number): Promise<string> {
  const key = base32Decode(secretBase32);
  // SubtleCrypto exige ArrayBuffer estrito (nao Uint8Array<ArrayBufferLike>).
  const keyBuffer = new ArrayBuffer(key.byteLength);
  new Uint8Array(keyBuffer).set(key);

  const counterBytes = new ArrayBuffer(8);
  const view = new DataView(counterBytes);
  view.setUint32(0, Math.floor(counter / 2 ** 32));
  view.setUint32(4, counter % 2 ** 32);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"]
  );
  const digest = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, counterBytes)
  );

  const offset = digest[digest.length - 1] & 0x0f;
  let codeInt =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  codeInt = codeInt % 1_000_000;
  return codeInt.toString().padStart(6, "0");
}

const B32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += B32_ALPHABET[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    output += B32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(input: string): Uint8Array {
  const cleaned = input.trim().toUpperCase().replace(/=/g, "");
  const out: number[] = [];
  let bits = 0;
  let value = 0;
  for (const ch of cleaned) {
    const v = B32_ALPHABET.indexOf(ch);
    if (v < 0) continue;
    value = (value << 5) | v;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}
