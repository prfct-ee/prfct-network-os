import React, { FC, useCallback, useRef } from "react";
import { sendAction } from "prfct-network-engine/network";
import { MyPrfctWallet } from "./MyPrfctWalletsWidget";

interface MyPrfctWalletsMergeProps {
  walletHexId: string;
  myWallets: MyPrfctWallet[];
}

export const MyPrfctWalletsMerge: FC<MyPrfctWalletsMergeProps> = ({ walletHexId, myWallets }) => {
  const mergeWalletSelectEl = useRef<HTMLSelectElement>(null);

  const merge = useCallback(() => {
    const wallet2 = mergeWalletSelectEl.current?.value;

    if (!walletHexId || !wallet2) {
      return;
    }

    sendAction("merge", { main: walletHexId, source: wallet2 });
  }, []);

  return (
    <div className="pt-2 w-full">
      <div className="flex pt-2 text-xs">
        <span className="w-[75px]">Wallet 2</span>
        {myWallets.length > 1 ? (
          <select ref={mergeWalletSelectEl} className="border border-black w-full">
            {myWallets.map((wallet) =>
              wallet.hexId !== walletHexId ? (
                <option key={wallet.hexId} value={wallet.hexId}>
                  {wallet.hexId} ({wallet.ttd})
                </option>
              ) : null
            )}
          </select>
        ) : (
          <span>- no wallets</span>
        )}
      </div>
      <div className="flex justify-end pt-2 text-xs">
        <button className="font-bold" type="button" onClick={merge}>
          Merge
        </button>
      </div>
    </div>
  );
};
