import { Widget } from "../../components/Widget/Widget";
import React, { useCallback, useEffect, useState } from "react";
import { sendAction } from "prfct-network-engine/network";
import { myHexid } from "prfct-network-engine";
import { currentBlockStream, state } from "../../network/consensus/consensus";
import { getMyWallets, myWalletsStream } from "../../network/idfs/myWallets";
import { StateElement } from "../../network/idfs/IDFS";
import { getHashFromData } from "../../network/crypto/crypto";
import { supportNodes } from "prfct-network-engine/consensus/constants";

const getRandomPositionByLength = (length: number) =>
  length ? Math.ceil(length * Math.random()) - 1 : 0;

export const RandomActionGeneratorWidget = () => {
  const [isActive, setIsActive] = useState(false);
  const [_, setMyWallets] = useState<StateElement[]>([]);
  const [blockNumber, setBlockNumber] = useState(0);
  const toggleActiveState = useCallback(() => setIsActive(!isActive), [isActive]);

  const createRandomMint = () => {
    const value = Math.ceil(Math.random() * 1000);
    sendAction("mint", {
      value,
      data: "random-mint",
      hexid: myHexid(),
      nonce: Date.now(),
    });
  };

  const createRandomSplit = () => {
    const wallet = getMyWallets()[getRandomPositionByLength(getMyWallets().length)];
    const walletHexId = getHashFromData(wallet);
    const amount = Math.ceil(Math.random() * (wallet.ttd - state.blockNumber));
    sendAction("split", {
      wallet: walletHexId,
      amount,
      data: "random-split",
      receiver: myHexid(),
      nonce: Date.now(),
    });
  };

  const createRandomMerge = () => {
    const mainWalletIndex = getRandomPositionByLength(getMyWallets().length);
    const otherWallets = getMyWallets().filter((_, i) => i !== mainWalletIndex);
    const sourceWalletIndex = getRandomPositionByLength(otherWallets.length);
    const main = getHashFromData(getMyWallets()[mainWalletIndex]);
    const source = getHashFromData(otherWallets[sourceWalletIndex]);
    sendAction("merge", { main, source });
  };

  const createRandomAction = () => {
    if (!supportNodes.includes(myHexid())) return;
    const myWalletsLength = getMyWallets().length;
    // createRandomMint();
    if (myWalletsLength >= 1) {
      if (Math.random() < 0.1 && myWalletsLength < 12) {
        createRandomSplit();
      } else if (Math.random() < 0.1) {
        createRandomMerge();
      }
    }
  };

  useEffect(() => {
    isActive && blockNumber % 2 === 0 && createRandomAction();
  }, [blockNumber]);

  useEffect(() => {
    currentBlockStream.on((block) => setBlockNumber(block.data.block));
    myWalletsStream.on((myWallets) => setMyWallets(Array.from(myWallets.values())));
    setTimeout(() => setIsActive(true), 4000);
  }, []);

  return (
    <Widget widgetName="Random Action Generator">
      {/* <div className="pt-3 w-full">
        <button className="font-bold" type="button" onClick={toggleActiveState}>
          {isActive ? "STOP" : "START"}
        </button>
      </div> */}
    </Widget>
  );
};
