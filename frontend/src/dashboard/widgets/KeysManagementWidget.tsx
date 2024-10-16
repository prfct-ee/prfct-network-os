import { Widget } from "../../components/Widget/Widget";
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { getKeys } from "prfct-network-engine/crypto/crypto";
import { saveAccountToLocalStorage } from "prfct-network-engine";

export const KeysManagementWidget = () => {
  const [publicKey, setPublicKey] = useState<string>("");
  const [privateKey, setPrivateKey] = useState<string>("");
  const publicKeyInputEl = useRef<HTMLTextAreaElement>(null);
  const privateKeyTextareaEl = useRef<HTMLTextAreaElement>(null);

  const changePublicKey = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setPublicKey(event.target.value);
  }, []);

  const changePrivateKey = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setPrivateKey(event.target.value);
  }, []);

  const updateKeys = useCallback(() => {
    const publicKey = publicKeyInputEl.current?.value;
    const privateKey = privateKeyTextareaEl.current?.value;
    if (!publicKey || !privateKey) {
      return;
    }
    saveAccountToLocalStorage({ publicKey, privateKey });
    window.location.reload();
  }, []);

  useEffect(() => {
    const { privateKey, publicKey } = getKeys();
    setPublicKey(publicKey);
    setPrivateKey(privateKey);
  }, []);

  return (
    <Widget widgetName="Keys Management">
      <div className="flex flex-col py-3 w-full text-sm">
        <div className="pt-2">Public key</div>
        <textarea
          ref={publicKeyInputEl}
          value={publicKey}
          className="border border-slate-200 w-full p-2 h-[65px] resize-none"
          onChange={changePublicKey}
        ></textarea>
        <div className="pt-2">Private key</div>
        <textarea
          ref={privateKeyTextareaEl}
          value={privateKey}
          className="border border-slate-200 w-full p-2 h-[95px] resize-none"
          onChange={changePrivateKey}
        ></textarea>
        <div className="pt-2">
          <button className="font-bold" type="button" onClick={updateKeys}>
            Update
          </button>
        </div>
      </div>
    </Widget>
  );
};
