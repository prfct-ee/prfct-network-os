import { state } from "../consensus/consensus";
import { StateElementWithPath } from "../interfaces";
import { Stream } from "../logger/logger";
import {
  findPathToElementInIDFS,
  StateElement,
  VerificationStatus,
  verifyElementInIDFS,
} from "./IDFS";

export type MyWallets = Map<string, StateElement>;
let myWallets: MyWallets = new Map();

export const updateMyWallets = (newWalletsList: MyWallets) => {
  myWallets = newWalletsList;
  myWalletsStream.emit(myWallets);
};

export const getMyWallets = () =>
  [...myWallets]
    .filter((kVal) => verifyElementInIDFS(kVal[0]) === VerificationStatus.FOUND)
    .map((kVal) => kVal[1]);

export const getMyBestWallet = (): StateElementWithPath => {
  let myBestWallet: StateElement | undefined;
  let myBestWalletHexId: string | undefined;
  myWallets.forEach((myWallet, hexId) => {
    if (
      (!myBestWallet || myBestWallet.ttd < myWallet.ttd) &&
      myWallet.createdAt < state.blockNumber &&
      verifyElementInIDFS(hexId) === VerificationStatus.FOUND
    ) {
      myBestWallet = myWallet;
      myBestWalletHexId = hexId;
    }
  });
  return {
    element: myBestWallet,
    path: myBestWalletHexId ? findPathToElementInIDFS(myBestWalletHexId) : [],
  };
};

export const myWalletsStream = Stream<MyWallets>();
