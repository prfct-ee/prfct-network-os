import React, { FC, useCallback, useState } from "react";
import { MyPrfctWalletsSplit } from "./MyPrfctWalletsSplit";
import { MyPrfctWalletsMerge } from "./MyPrfctWalletsMerge";
import { MyPrfctWallet } from "./MyPrfctWalletsWidget";
import { state } from "prfct-network-engine/consensus/consensus";

interface MyPrfctWalletsItemProps {
  wallet: MyPrfctWallet;
  myWallets: MyPrfctWallet[];
}

enum ActionState {
  SPLIT,
  MERGE,
  NONE,
}

export const MyPrfctWalletsItem: FC<MyPrfctWalletsItemProps> = ({ wallet, myWallets }) => {
  const [actionState, setActionState] = useState<ActionState>(ActionState.NONE);
  const balance = wallet.ttd - state.blockNumber;

  const openAction = useCallback(
    (action: ActionState) => () => {
      setActionState(action === actionState ? ActionState.NONE : action);
    },
    [actionState]
  );

  return (
    <div className="pt-3 w-full">
      <div className="flex pt-1 text-xs">
        <span className="w-[75px] font-bold">Wallet ID:</span>
        <span>{wallet.hexId}</span>
      </div>
      <div className={`flex pt-1 text-xs ${balance < 0 ? "text-red-600" : ""}`}>
        <span className="w-[75px] font-bold">Balance:</span>
        <span>{balance}_ꙮ</span>
      </div>
      {balance < 0 ? null : (
        <div className="flex pt-2 text-xs">
          <button
            className={`underline mr-3 ${actionState === ActionState.SPLIT ? "font-bold" : ""}`}
            type="button"
            onClick={openAction(ActionState.SPLIT)}
          >
            Split
          </button>
          {myWallets.length > 1 ? (
            <button
              className={`underline ${actionState === ActionState.MERGE ? "font-bold" : ""}`}
              type="button"
              onClick={openAction(ActionState.MERGE)}
            >
              Merge
            </button>
          ) : null}
        </div>
      )}
      {actionState === ActionState.SPLIT ? (
        <MyPrfctWalletsSplit walletHexId={wallet.hexId} />
      ) : actionState === ActionState.MERGE ? (
        <MyPrfctWalletsMerge myWallets={myWallets} walletHexId={wallet.hexId} />
      ) : null}
    </div>
  );
};
