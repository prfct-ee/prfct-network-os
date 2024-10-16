import { getHashFromData } from "../crypto/crypto";
import {
  deleteInIDFS,
  findPathToElementInIDFS,
  getRootHexid,
  pushToIdfsTree,
  Router,
  setElementToVipList,
  setRootHexid,
  StateElement,
  StateElementTypes,
  VerificationStatus,
  verifyElementInIDFS,
} from "../idfs/IDFS";
import { getElementFromDB } from "../idfs/idfsDB";
import { Action } from "../interfaces";
import { maxDataSize } from "../settings";
import { state } from "./consensus";
import { rootUsers, supportNodes } from "./constants";
import { timePointsToTDD, ttdToTimePoints } from "./utils";

const getRoutesForElements = (hexIds: string[]) => {
  const affectedRoutesList = hexIds.map((hexId: string) => findPathToElementInIDFS(hexId));
  return affectedRoutesList.flatMap((router) => router);
};

const filterRouterList = (routerList: Router[]) => {
  const uniqRoutes = [...new Map(routerList.map((item) => [getHashFromData(item), item])).values()];
  return uniqRoutes.filter((router) => router.layer !== 0);
};

export interface RunActionsProps {
  actions: { [authorHexid: string]: Action };
  initialRouterHexID: string;
  authorWallet?: StateElement;
}

export interface RunActionsResult {
  completedActions: string[];
  affectedElements: StateElement[];
  affectedRoutes: Router[];
}

export const runActions = (props: RunActionsProps) => {
  const { actions, authorWallet, initialRouterHexID: _initialRouterHexID } = props;

  let completedActions: string[] = [];
  let affectedElements: StateElement[] = [];
  let affectedRoutes: Router[] = [];

  const actionsKeys = Object.keys(actions).sort();

  let initialRouterHexID = _initialRouterHexID;

  // REWARD
  // if (authorWallet) {
  //   const authorWalletHexid = getHashFromData(authorWallet);
  //   const autorWalletHexidVerification = verifyElementInIDFS(authorWalletHexid);

  //   if (autorWalletHexidVerification !== VerificationStatus.FOUND) {
  //     console.log("Reward wallet is not found", authorWallet, authorWalletHexid);
  //   }

  //   if (autorWalletHexidVerification !== VerificationStatus.FOUND) {
  //     return {
  //       completedActions,
  //       affectedElements,
  //       affectedRoutes: filterRouterList(affectedRoutes),
  //     };
  //   }

  //   const rewardWallet: StateElement = {
  //     ...authorWallet,
  //     ttd: authorWallet.ttd + 10000,
  //     createdAt: action.ttr,
  //   };

  //   const pushResult = pushToIdfsTree(rewardWallet);
  //   const deleteResult = deleteInIDFS(authorWalletHexid);

  //   if (!pushResult || !deleteResult) {
  //     setRootHexid(initialRouterHexID);
  //   }
  // }

  for (var i = 0; i < actionsKeys.length; i++) {
    const actionAuthorHexid = actionsKeys[i];
    const action = actions[actionAuthorHexid];
    initialRouterHexID = getRootHexid();

    switch (action.type) {
      case "mint": {
        if (
          ![...supportNodes, ...rootUsers].includes(actionAuthorHexid) &&
          process.env.NODE_ENV != "development"
        ) {
          continue;
        }

        const element: StateElement = {
          lookupKey: getHashFromData(action.data.hexid + action.ttr + action.data.data),
          owner: action.data.hexid,
          ttd: action.ttr + parseInt(action.data.value),
          type: StateElementTypes.WALLET,
          data: action.data.data,
          createdAt: action.ttr,
        };

        const result = pushToIdfsTree(element);

        if (result) {
          completedActions.push(actionAuthorHexid);
          affectedRoutes.push(...result.affectedRouters);
          console.log("Mint success!");
          console.log(`${action.data.value}TP to ${action.data.hexid}`);
          console.log("Hash", getHashFromData(element));
          console.log("Path:", findPathToElementInIDFS(getHashFromData(element)));
          console.log(
            JSON.stringify([...findPathToElementInIDFS(getHashFromData(element)), element])
          );
          console.log("----------------");
        } else {
          console.log("ATTENTION: run actions error: Mint", element);
          setRootHexid(initialRouterHexID);
          continue;
        }
        break;
      }

      case "split": {
        const { wallet, receiver, data } = action.data;
        const amount = parseInt(action.data.amount);
        if (amount < 0) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }
        const sourceWalletVerification = verifyElementInIDFS(wallet);
        if (sourceWalletVerification !== VerificationStatus.FOUND) {
          console.log(
            "ATTENTION: run actions error: SPLIT: sourceWalletVerification !== VerificationStatus.FOUND",
            action
          );
          setRootHexid(initialRouterHexID);
          continue;
        }

        const source = getElementFromDB(wallet);
        if (!source) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        if (source.owner !== action.from) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        affectedElements.push(source);
        affectedRoutes.push(...getRoutesForElements([wallet]));

        const deleteSourceResult = deleteInIDFS(wallet);
        if (!deleteSourceResult) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        const nextSourceTdd = timePointsToTDD(
          ttdToTimePoints(source.ttd, source.data?.length, action.ttr) - amount,
          source.data?.length,
          action.ttr
        );
        const nextRecieverTdd = timePointsToTDD(amount * 0.99, data.length, action.ttr);

        if (nextSourceTdd < action.ttr || nextRecieverTdd < action.ttr) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        const nextSourceWalletElement = {
          lookupKey: source.lookupKey,
          owner: source.owner,
          ttd: nextSourceTdd,
          type: StateElementTypes.WALLET,
          data: source.data,
          createdAt: action.ttr,
        };
        const nextSourceWallet = pushToIdfsTree(nextSourceWalletElement);
        const nextSourceWalletHexId = getHashFromData(nextSourceWalletElement);

        if (!nextSourceWallet) {
          console.log(
            "ATTENTION: run actions error: split, !nextSourceWallet",
            action,
            nextSourceWallet
          );
          setRootHexid(initialRouterHexID);
          continue;
        }

        const nextReceiverWalletElement = {
          lookupKey: getHashFromData(action.data.hexid + action.ttr + action.data.data),
          owner: receiver,
          ttd: nextRecieverTdd,
          type: StateElementTypes.WALLET,
          data: data.slice(0, maxDataSize),
          createdAt: action.ttr,
        };
        const nextRecieverWallet = pushToIdfsTree(nextReceiverWalletElement);
        const nextRecieverWalletHexId = getHashFromData(nextReceiverWalletElement);

        if (!nextRecieverWallet) {
          console.log(
            "ATTENTION: run actions error: split, !nextRecieverWallet",
            action,
            nextRecieverWallet
          );
          setRootHexid(initialRouterHexID);
          continue;
        }

        setElementToVipList([wallet, nextSourceWalletHexId, nextRecieverWalletHexId]);

        affectedRoutes.push(
          ...nextSourceWallet?.affectedRouters,
          ...nextRecieverWallet?.affectedRouters
        );
        completedActions.push(actionAuthorHexid);

        break;
      }

      case "merge":
        const { main: mainWalletHexid, source: sourceWalletHexid } = action.data;

        if (!mainWalletHexid || !sourceWalletHexid) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        const mainWallet = getElementFromDB(mainWalletHexid);
        const sourceWallet = getElementFromDB(sourceWalletHexid);

        if (!mainWallet || !sourceWallet) {
          console.log(
            "ATTENTION: run actions error: ",
            mainWallet,
            sourceWallet,
            mainWalletHexid,
            sourceWalletHexid
          );
          setRootHexid(initialRouterHexID);
          continue;
        }

        if (mainWallet.ttd < action.ttr || sourceWallet.ttd < action.ttr) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        if (mainWallet.owner !== action.from || sourceWallet.owner !== action.from) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        const mainWalletVerification = verifyElementInIDFS(mainWalletHexid);

        if (mainWalletVerification !== VerificationStatus.FOUND) {
          console.log(
            "ATTENTION: run actions error: MERGE: mainWalletVerification !== VerificationStatus.FOUND"
          );
          setRootHexid(initialRouterHexID);
          continue;
        }

        const sourceWalletVerification = verifyElementInIDFS(sourceWalletHexid);

        if (sourceWalletVerification !== VerificationStatus.FOUND) {
          console.log(
            "ATTENTION: run actions error: MERGE: sourceWalletVerification !== VerificationStatus.FOUND "
          );
          setRootHexid(initialRouterHexID);
          continue;
        }

        const resultBalance = timePointsToTDD(
          ttdToTimePoints(mainWallet.ttd, mainWallet.data?.length, action.ttr) +
            ttdToTimePoints(sourceWallet.ttd, sourceWallet.data?.length, action.ttr),
          mainWallet.data?.length,
          action.ttr
        );

        if (resultBalance < action.ttr) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        const resultWalletElement = {
          lookupKey: mainWallet.lookupKey,
          owner: action.from,
          ttd: resultBalance,
          type: StateElementTypes.WALLET,
          data: mainWallet.data,
          createdAt: action.ttr,
        };
        const resultWallet = pushToIdfsTree(resultWalletElement);

        if (!resultWallet) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        affectedRoutes.push(...getRoutesForElements([mainWalletHexid, sourceWalletHexid]));

        const deleteSource1Result = deleteInIDFS(mainWalletHexid);
        const deleteSource2Result = deleteInIDFS(sourceWalletHexid);

        if (!deleteSource1Result || !deleteSource2Result) {
          console.log("ATTENTION: run actions error: ");
          setRootHexid(initialRouterHexID);
          continue;
        }

        completedActions.push(actionAuthorHexid);

        affectedElements.push(mainWallet, sourceWallet);
        affectedRoutes.push(...resultWallet.affectedRouters);

        break;

      default:
        break;
    }
  }

  return { completedActions, affectedElements, affectedRoutes: filterRouterList(affectedRoutes) };
};
