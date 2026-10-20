import { constants, publicEncrypt } from "node:crypto";

/** CODEF publicKey로 RSA PKCS1 암호화 (비밀번호·전자민원캐시 비번) */
export function codefEncrypt(publicKeyPemOrBody: string, plain: string): string {
  const body = publicKeyPemOrBody
    .replace(/-----BEGIN PUBLIC KEY-----/g, "")
    .replace(/-----END PUBLIC KEY-----/g, "")
    .replace(/\s+/g, "");
  const pem = `-----BEGIN PUBLIC KEY-----\n${body.match(/.{1,64}/g)?.join("\n") ?? body}\n-----END PUBLIC KEY-----`;
  return publicEncrypt(
    { key: pem, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(plain, "utf8")
  ).toString("base64");
}
