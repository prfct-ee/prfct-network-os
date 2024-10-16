import { Widget } from "../../components/Widget/Widget";
import React, { useCallback, useRef } from "react";
import { sendAction } from "prfct-network-engine/network";
import { myHexid } from "prfct-network-engine";

export const WalletManagementWidget = () => {
  const mintHexIdInputEl = useRef<HTMLInputElement>(null);
  const mintAmountInputEl = useRef<HTMLInputElement>(null);
  const mintDataInputEl = useRef<HTMLInputElement>(null);

  const splitWalletInputEl = useRef<HTMLInputElement>(null);
  const splitReceiverInputEl = useRef<HTMLInputElement>(null);
  const splitAmountInputEl = useRef<HTMLInputElement>(null);
  const splitDataInputEl = useRef<HTMLInputElement>(null);

  const mergeWallet1InputEl = useRef<HTMLInputElement>(null);
  const mergeWallet2InputEl = useRef<HTMLInputElement>(null);

  const mint = useCallback(() => {
    const hexid = mintHexIdInputEl.current?.value;
    const value = mintAmountInputEl.current?.value;
    const data = mintDataInputEl.current?.value;

    if (!hexid || !value) {
      return;
    }

    sendAction("mint", { hexid, value, nonce: Date.now(), data });
  }, []);

  const split = useCallback(() => {
    const wallet = splitWalletInputEl.current?.value;
    const receiver = splitReceiverInputEl.current?.value;
    const amount = splitAmountInputEl.current?.value;
    const data = splitDataInputEl.current?.value;

    if (!wallet || !receiver || !amount) {
      return;
    }

    sendAction("split", { wallet, receiver, amount, data, nonce: Date.now() });
  }, []);

  const merge = useCallback(() => {
    const main = mergeWallet1InputEl.current?.value;
    const source = mergeWallet2InputEl.current?.value;

    if (!main || !source) {
      return;
    }

    sendAction("merge", { main, source });
  }, []);

  return (
    <Widget widgetName="Wallet Management">
      <div className="pt-3 w-full">
        <div className="font-bold pt-2">MINT</div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">HexId</span>
          <input
            ref={mintHexIdInputEl}
            className="border border-black w-full"
            defaultValue={myHexid()}
          ></input>
        </div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">Value</span>
          <input
            ref={mintAmountInputEl}
            type="number"
            className="border border-black w-full"
          ></input>
        </div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">Data</span>
          <input ref={mintDataInputEl} type="text" className="border border-black w-full"></input>
        </div>
        <div className="flex justify-end pt-2 text-xs">
          <button className="font-bold" type="button" onClick={mint}>
            Mint
          </button>
        </div>
      </div>
      <div className="pt-2 w-full">
        <div className="font-bold">SPLIT</div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">Wallet</span>
          <input ref={splitWalletInputEl} className="border border-black w-full"></input>
        </div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">Receiver</span>
          <input ref={splitReceiverInputEl} className="border border-black w-full"></input>
        </div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">Amount</span>
          <input
            ref={splitAmountInputEl}
            type="number"
            className="border border-black w-full"
          ></input>
        </div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">Data</span>
          <input ref={splitDataInputEl} type="text" className="border border-black w-full"></input>
        </div>
        <div className="flex justify-end pt-2 text-xs">
          <button className="font-bold" type="button" onClick={split}>
            Split
          </button>
        </div>
      </div>
      <div className="pt-2 w-full">
        <div className="font-bold">MERGE</div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[120px]">Main Wallet</span>
          <input ref={mergeWallet1InputEl} className="border border-black w-full"></input>
        </div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[120px]">Source Wallet</span>
          <input ref={mergeWallet2InputEl} className="border border-black w-full"></input>
        </div>
        <div className="flex justify-end pt-2 text-xs">
          <button className="font-bold" type="button" onClick={merge}>
            Merge
          </button>
        </div>
      </div>
    </Widget>
  );
};
