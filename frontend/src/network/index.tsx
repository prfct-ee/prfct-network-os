import { changeKeys, generateKey } from "./crypto/crypto";
import { Key } from "./interfaces";
import { eventEmitter } from "./state";
import { initLoop } from "./consensus/consensus";

export { myHexid } from "./crypto/crypto";
export { EventEmitter } from "./EventEmitter/EventEmitter";
export { sendSMS, onSMSforAccount } from "./network";
export { eventEmitter, subscribe, getState } from "./state";

export type { SMS, Key } from "./interfaces";
export type { NetworkState } from "./state";

export { stepDuration } from "./consensus/constants";

export const saveAccountToLocalStorage = ({ privateKey, publicKey }: Key) =>
  window.localStorage.setItem(
    "prfct-key",
    JSON.stringify({
      privateKey,
      publicKey,
    })
  );

export const resetAccount = () => {
  window.localStorage.removeItem("prfct-key");
  window.location.reload();
};

(window as any).reset = resetAccount;

//_ init prfct node
export const initPrfctNode = () => {
  const url = new URL(window.location.href);
  const canUseLocal = !url.searchParams.get("fresh");
  const localValue = window.localStorage.getItem("prfct-key");

  let key: Key = { privateKey: "", publicKey: "" };

  //_ if url has param "fresh"
  if (canUseLocal) {
    //_ if local account exist
    if (localValue) {
      key = JSON.parse(localValue);
    } else {
      key = generateKey();
      saveAccountToLocalStorage(key);
    }
  } else {
    key = generateKey();
  }
  initPrfctNodeWithKey(key);

  return key;
};

const setHexidReducer = eventEmitter<string>((state, hexid) => {
  return { ...state, myhexid: hexid };
});

export const initPrfctNodeWithKey = (key: Key) => {
  changeKeys(key);
  setHexidReducer(key.publicKey);
  initLoop();
};
