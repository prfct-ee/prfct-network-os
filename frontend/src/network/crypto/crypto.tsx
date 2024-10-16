import { md, pki, util } from "node-forge";
import libsodium from "libsodium-wrappers";
import { Key, Message, SignedMessage } from "../interfaces";

export const signMessage = (message: Message): SignedMessage => {
  const messageHash = md.md5.create().update(JSON.stringify(message)).digest().toHex();
  const signature = pki.ed25519.sign({
    message: messageHash,
    encoding: "utf8",
    privateKey: util.hexToBytes(key.privateKey),
  });

  return {
    stage: "",
    raw: message,
    signature: util.createBuffer(signature).toHex(),
  };
};

// Duplicate from server/index.ts
export const verifyMessage = (message: SignedMessage) => {
  const messageHash = md.md5.create().update(JSON.stringify(message.raw)).digest().toHex();
  return pki.ed25519.verify({
    message: messageHash,
    encoding: "utf8",
    signature: util.hexToBytes(message.signature),
    publicKey: util.hexToBytes(message.raw.from),
  });
};

export const getHashFromData = (data: any) =>
  md.md5
    .create()
    .update(JSON.stringify(data || {}))
    .digest()
    .toHex();

export const generateKey = (): Key => {
  const _key = pki.ed25519.generateKeyPair();
  return {
    publicKey: util.createBuffer(_key.publicKey).toHex(),
    privateKey: util.createBuffer(_key.privateKey).toHex(),
  };
};

let key: Key = { privateKey: "", publicKey: "" };

export const getKeys = () => key;

export const changeKeys = (_key: Key) => {
  key = _key;
  return key;
};

export const myHexid = () => key.publicKey;

export const maxPositionLength = 6;
export const maxPositionValue = parseInt("f".repeat(maxPositionLength), 16);

export const getHexPosition = (hexid: string = "") =>
  parseInt(hexid.slice(0, maxPositionLength), 16);

export const getHexDistance = (hexid1: string, hexid2: string) => {
  const position1 = getHexPosition(hexid1);
  const position2 = getHexPosition(hexid2);
  const distance1 = Math.abs(position1 - position2);
  const distance2 = Math.abs(position1 - maxPositionValue - position2);
  const distance3 = Math.abs(position1 + maxPositionValue - position2);
  return Math.min(distance1, distance2, distance3);
};

//
// Encription
//

const fill = Uint8Array.from(
  Array(24)
    .fill("64")
    .map((v, i) => i)
);

// async Approved
const startLibsodium = async () => {
  await libsodium.ready;
};
startLibsodium();

export const encryptFor = (recipient: string, message: string) => {
  const recipientCurvePublic = libsodium.crypto_sign_ed25519_pk_to_curve25519(
    libsodium.from_hex(recipient)
  );
  const myCurvePrivate = libsodium.crypto_sign_ed25519_sk_to_curve25519(
    libsodium.from_hex(key.privateKey)
  );

  return libsodium.to_base64(
    libsodium.crypto_box_easy(message, fill, recipientCurvePublic, myCurvePrivate, "uint8array")
  );
};

export const decryptFrom = (from: string, message: string) => {
  const fromCurvePublic = libsodium.crypto_sign_ed25519_pk_to_curve25519(libsodium.from_hex(from));

  const myCurvePrivate = libsodium.crypto_sign_ed25519_sk_to_curve25519(
    libsodium.from_hex(key.privateKey)
  );

  return libsodium.crypto_box_open_easy(
    libsodium.from_base64(message),
    fill,
    fromCurvePublic,
    myCurvePrivate,
    "text"
  );
};

export const isValidHexId = (hexId: string) => {
  try {
    return !!libsodium.crypto_sign_ed25519_pk_to_curve25519(libsodium.from_hex(hexId));
  } catch (e) {
    return false;
  }
};
