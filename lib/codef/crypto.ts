import { constants, publicEncrypt } from "node:crypto";

/** CODEF publicKey로 인터넷등기소 비회원 비밀번호를 RSA PKCS1 암호화 */
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
