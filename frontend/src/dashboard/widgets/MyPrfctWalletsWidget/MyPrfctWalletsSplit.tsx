import React, { FC, useCallback, useRef } from "react";
import { sendAction } from "prfct-network-engine/network";

interface MyPrfctWalletsSplitProps {
  walletHexId: string;
}

export const MyPrfctWalletsSplit: FC<MyPrfctWalletsSplitProps> = ({ walletHexId }) => {
  const receiverInputEl = useRef<HTMLInputElement>(null);
  const amountInputEl = useRef<HTMLInputElement>(null);
  const dataInputEl = useRef<HTMLInputElement>(null);

  const split = useCallback(() => {
    const receiver = receiverInputEl.current?.value;
    const amount = amountInputEl.current?.value;
    const data = dataInputEl.current?.value;

    if (!walletHexId || !receiver || !amount) {
      return;
    }

    sendAction("split", { wallet: walletHexId, receiver, amount, data, nonce: Date.now() });
  }, []);

  return (
    <div className="pt-2 w-full">
      <div className="flex pt-2 text-xs">
        <span className="w-[75px]">Receiver</span>
        <input ref={receiverInputEl} className="border border-black w-full"></input>
      </div>
      <div className="flex pt-2 text-xs">
        <span className="w-[75px]">Amount</span>
        <input ref={amountInputEl} type="number" className="border border-black w-full"></input>
      </div>
      <div className="flex pt-2 text-xs">
        <span className="w-[75px]">Data</span>
        <input ref={dataInputEl} type="text" className="border border-black w-full"></input>
      </div>
      <div className="flex justify-end pt-2 text-xs">
        <button className="font-bold" type="button" onClick={split}>
          Split
        </button>
      </div>
    </div>
  );
};
