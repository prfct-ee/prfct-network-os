import { state } from "../consensus/consensus";
import { getHashFromData, getHexPosition, maxPositionValue } from "../crypto/crypto";
import { Stream } from "../logger/logger";
import { sendIDFSElement } from "../network";
import { getState } from "../state";
import {
  deleteFromDB,
  getAllKeys,
  getElementFromDB,
  getFromDB,
  getFromDBAsync,
  getRouterFromDB,
  ressurectFromIndexedDB,
  saveToDB,
} from "./idfsDB";
import { isNeighborByHexDistance } from "./isNeighborByHexDistance";
import { cloneObject } from "./utils";

export enum StateElementTypes {
  WALLET = "wallet",
  SMART_CONTRACT = "smart contract",
  STATE_ELEMENT = "state element",
}
export interface StateElement {
  type: StateElementTypes;
  lookupKey: string;
  owner: string;
  ttd: number;
  createdAt: number;
  data?: string;
}

interface StateElementInfo {
  hexId: string;
  size: number;
  ttd: number;
}

export interface Router {
  layer: number;
  shift: number;
  routers: Record<string, string>;
  stateElements: StateElementInfo[];
  size: number;
  createdAt: number;
}

interface RouterInfo {
  hexid: string;
  size: number;
  affectedRouters: Router[];
}

export enum VerificationStatus {
  FOUND,
  NOT_FOUND,
  LOST,
}

export const numElementsInRouter = 3;

let rootHexid = "";
let emptyRouterHexId = "";

export const setRootHexid = (hexid: string) => {
  if (rootHexid !== hexid) {
    rootHexid = hexid;
    idfsUpdateStream.emit(hexid);
  }
};

export const getRootHexid = () => rootHexid;

export const initRootRouter = () => {
  const router: Router = {
    routers: {},
    stateElements: [],
    size: 0,
    layer: 0,
    shift: 0,
    createdAt: state.blockNumber,
  };
  const elementHex = getHashFromData(router);
  emptyRouterHexId = elementHex;

  saveToDB(router);
  setRootHexid(elementHex);
};

export const pushToIdfsTree = (element: StateElement, mutateRootHexid: boolean = true) => {
  const elementHex = getHashFromData(element);
  const elementSize = element.data?.length || 1;
  saveToDB(element);

  const result = pushToRouter(rootHexid, elementHex, elementSize, element.ttd);

  if (result === undefined) return;
  mutateRootHexid && setRootHexid(result.hexid);

  return result;
};

const findElementInRouter = (router: Router, elementHex: string) => {
  return router.stateElements.find((elementInfo) => elementInfo.hexId === elementHex);
};

const findRouterInRouter = (router: Router, routerHex: string) =>
  Object.values(router.routers).find((v) => v === routerHex);

const pushToRouter = (
  routerHexid: string,
  elementHex: string,
  elementSize: number,
  ttd: number
): RouterInfo | undefined => {
  const router = getRouterFromDB(routerHexid);

  const stateElementInfo: StateElementInfo = { hexId: elementHex, size: elementSize, ttd };

  if (!router) return undefined;

  const affectedRouter = cloneObject(router);
  const affectedPath = findPathToRouterInIDFS(routerHexid, router?.layer, router?.shift);
  const affectedRouters = [...affectedPath, affectedRouter];

  router.size =
    router.size -
    router.stateElements
      .filter((element) => element.ttd < state.blockNumber)
      .reduce((sum, element) => sum + element.size, 0);
  router.stateElements = router.stateElements.filter((element) => element.ttd >= state.blockNumber);
  router.createdAt = state.blockNumber;

  const totalElementsInLayer = numElementsInRouter ** router.layer * numElementsInRouter;
  const elementPosition = getHexPosition(elementHex);
  const routerLength = maxPositionValue / totalElementsInLayer;
  const shift = Math.floor(elementPosition / routerLength);

  if (findElementInRouter(router, elementHex)) {
    return { size: router.size, hexid: getHashFromData(router), affectedRouters };
  }

  if (router.stateElements.length < numElementsInRouter) {
    router.stateElements.push(stateElementInfo);
    router.size = router.size + elementSize;

    const routerHexid = getHashFromData(router);
    saveToDB(router);

    const insuranceRouter = router.routers[router.layer + 1 + "/" + shift];
    insuranceRouter && affectedRouters.push(insuranceRouter);

    return { size: router.size, hexid: routerHexid, affectedRouters };
  } else {
    const internalRouterHex = router.routers[router.layer + 1 + "/" + shift];

    if (internalRouterHex) {
      const routerInfo = pushToRouter(internalRouterHex, elementHex, elementSize, ttd);
      if (!routerInfo) return undefined;
      router.routers[router.layer + 1 + "/" + shift] = routerInfo.hexid;
      router.size = router.size + elementSize;
      const routerHexid = getHashFromData(router);
      saveToDB(router);
      return { size: router.size, hexid: routerHexid, affectedRouters: routerInfo.affectedRouters };
    }

    const newRouter: Router = {
      layer: router.layer + 1,
      routers: {},
      stateElements: [stateElementInfo],
      size: elementSize,
      shift,
      createdAt: state.blockNumber,
    };

    const hexid = getHashFromData(newRouter);
    saveToDB(newRouter);

    router.routers[router.layer + 1 + "/" + shift] = hexid;
    router.size = router.size + newRouter.size;

    const routerHexid = getHashFromData(router);
    saveToDB(router);
    return { size: router.size, hexid: routerHexid, affectedRouters };
  }
};

export const deleteInIDFS = (stateElementHexid: string) => {
  const deleteResult = deleteInIDFSRecursion(rootHexid, stateElementHexid);
  if (deleteResult.removedSize === 0) return undefined;
  const rootRouter = deleteResult.routerInfo.hexid;
  setRootHexid(rootRouter);
  return deleteResult;
};

const deleteInIDFSRecursion = (
  routerHexid: string,
  stateElementHexid: string
): { routerInfo: RouterInfo; removedSize: number } => {
  const router = getRouterFromDB(routerHexid);

  if (!router)
    return { routerInfo: { size: 0, hexid: routerHexid, affectedRouters: [] }, removedSize: 0 };

  const affectedRouter = cloneObject(router);
  const affectedPath = findPathToRouterInIDFS(routerHexid, router?.layer, router?.shift);
  const affectedRouters = [...affectedPath, affectedRouter];

  router.size =
    router.size -
    router.stateElements
      .filter((element) => element.ttd < state.blockNumber)
      .reduce((sum, element) => sum + element.size, 0);
  router.stateElements = router.stateElements.filter((element) => element.ttd >= state.blockNumber);

  const elementPosition = getHexPosition(stateElementHexid);
  const totalElementsInLayer = numElementsInRouter ** router.layer * numElementsInRouter;
  const routerLength = maxPositionValue / totalElementsInLayer;
  const shift = Math.floor(elementPosition / routerLength);

  if (findElementInRouter(router, stateElementHexid)) {
    const element = router.stateElements.find((element) => element.hexId === stateElementHexid);
    const removedSize = element?.size || 1;
    const newStateElementList = router.stateElements.filter((_element) => _element != element);

    router.stateElements = newStateElementList;
    router.size = router.size - removedSize;

    const routerHexid = getHashFromData(router);
    saveToDB(router);

    return { routerInfo: { size: router.size, hexid: routerHexid, affectedRouters }, removedSize };
  } else {
    const internalRouterPath = router.layer + 1 + "/" + shift;
    const internalRouterHex = router.routers[internalRouterPath];

    if (!internalRouterHex) {
      return { routerInfo: { size: 0, hexid: routerHexid, affectedRouters: [] }, removedSize: 0 };
    }

    const { removedSize, routerInfo: nextInternalRouterInfo } = deleteInIDFSRecursion(
      internalRouterHex,
      stateElementHexid
    );

    const nextInternalRouter = getRouterFromDB(nextInternalRouterInfo.hexid);

    if (nextInternalRouter && nextInternalRouter.stateElements.length === 0) {
      delete router.routers[internalRouterPath];
      router.size = router.size - removedSize;
    } else {
      router.routers[internalRouterPath] = nextInternalRouterInfo.hexid;
      router.size = router.size - removedSize;
    }

    const newRouterHexid = getHashFromData(router);
    saveToDB(router);
    return {
      routerInfo: { size: router.size, hexid: newRouterHexid, affectedRouters },
      removedSize: removedSize,
    };
  }
};

export const lostInIDFS = (hexid: string) => {
  // deleteRouterFromDB(hexid);
  // deleteStateElementsFromDB(hexid);
};

export const verifyInIDFS = (hexid: string, element: StateElement | Router | undefined) => {
  if ((element as StateElement)?.data !== undefined) {
    return verifyElementInIDFS(hexid);
  } else {
    return verifyRouterInIDFS(hexid, (element as Router).layer, (element as Router).shift);
  }
};

export const verifyElementInIDFS = (hexid: string) => {
  return verifyElementRecursion(hexid, rootHexid);
};

(window as any).verify = verifyElementInIDFS;

export const verifyElementRecursion = (
  elementHexid: string,
  routerHexid: string
): VerificationStatus => {
  const router = getRouterFromDB(routerHexid);

  if (!router) {
    return VerificationStatus.LOST;
  }

  if (findElementInRouter(router, elementHexid)) {
    const stateElement = getElementFromDB(elementHexid);
    if (stateElement && stateElement.ttd < state.blockNumber) {
      return VerificationStatus.NOT_FOUND;
    } else if (stateElement) {
      return VerificationStatus.FOUND;
    }
    return VerificationStatus.LOST;
  }

  const internalRouterHex = getClosestInternalRouter(elementHexid, router);

  if (!internalRouterHex) {
    return VerificationStatus.NOT_FOUND;
  }

  return verifyElementRecursion(elementHexid, internalRouterHex);
};

export const verifyRouterInIDFS = (hexid: string, layer: number, shift: number) => {
  return verifyRouterInIDFSRecursion(hexid, layer, shift, rootHexid);
};

export const verifyRouterInIDFSRecursion = (
  hexid: string,
  layer: number,
  shift: number,
  routerHexid: string
): VerificationStatus => {
  const router = getRouterFromDB(routerHexid);

  if (!router) {
    return VerificationStatus.LOST;
  }

  if (findRouterInRouter(router, hexid) || hexid === routerHexid) {
    const stateElement = getRouterFromDB(hexid);
    if (stateElement) {
      return VerificationStatus.FOUND;
    }
    return VerificationStatus.LOST;
  }

  if (router.layer > layer) {
    return VerificationStatus.NOT_FOUND;
  }

  const elementsInSearchLayer = numElementsInRouter ** layer;
  const elementsInCurrentLayer = numElementsInRouter ** (router.layer + 1);
  const currentLayerShift = Math.floor(elementsInCurrentLayer * (shift / elementsInSearchLayer));
  const internalRouterPath = router.layer + 1 + "/" + currentLayerShift;
  const internalRouterHex = router.routers[internalRouterPath];

  if (!internalRouterHex) {
    return VerificationStatus.NOT_FOUND;
  }

  return verifyRouterInIDFSRecursion(hexid, layer, shift, internalRouterHex);
};

export const findPathToElementInIDFS = (hexid: string) => {
  return findPathToElementInIDFSRecursion(hexid, rootHexid, []);
};

const findPathToElementInIDFSRecursion = (
  hexid: string,
  routerHexid: string,
  path: Router[]
): Router[] => {
  const router = getRouterFromDB(routerHexid);

  if (!router) {
    return [];
  }

  path.push(router);

  if (findElementInRouter(router, hexid)) {
    return path;
  }

  const internalRouterHex = getClosestInternalRouter(hexid, router);

  if (!internalRouterHex) {
    return [];
  }

  return findPathToElementInIDFSRecursion(hexid, internalRouterHex, path);
};

export const findPathToRouterInIDFS = (hexid: string, layer: number, shift: number) => {
  return findPathToRouterInIDFSRecursion(hexid, layer, shift, rootHexid, []);
};

const findPathToRouterInIDFSRecursion = (
  hexid: string,
  layer: number,
  shift: number,
  routerHexid: string,
  path: Router[]
): Router[] => {
  const router = getRouterFromDB(routerHexid);

  if (!router) {
    return [];
  }

  path.push(router);

  if (findRouterInRouter(router, hexid) || hexid === routerHexid) {
    return path;
  }

  if (router.layer > layer) {
    return [];
  }

  const elementsInSearchLayer = numElementsInRouter ** layer;
  const elementsInCurrentLayer = numElementsInRouter ** (router.layer + 1);
  const currentLayerShift = Math.floor(elementsInCurrentLayer * (shift / elementsInSearchLayer));
  const internalRouterPath = router.layer + 1 + "/" + currentLayerShift;
  const internalRouterHex = router.routers[internalRouterPath];

  if (!internalRouterHex) {
    return [];
  }

  return findPathToRouterInIDFSRecursion(hexid, layer, shift, internalRouterHex, path);
};

export const idfsUpdateStream = Stream<string>();
export const onIDFSUpdate = idfsUpdateStream.on;

requestAnimationFrame(() => {
  initRootRouter();
  startElementsLoop();
});

export const setElementToVipList = (elementHexIds: string[]) => {
  const { peers } = getState();
  peers.forEach((peerHexid) => {
    elementHexIds.forEach((elementHexId) => {
      const element = getElementFromDB(elementHexId);
      sendIDFSElement(peerHexid, element);
    });
  });
}; //

const sendedKeys: string[] = [];

const startElementsLoop = async () => {
  const keys = await getAllKeys();
  console.log("IndexedDB database size: ", keys?.length);
  if (keys) {
    elementsLoop(0, keys);
  } else {
    setTimeout(startElementsLoop, 1000);
  }
};

const elementsLoop = async (index: number, keys: string[]) => {
  if (index < keys.length) {
    setTimeout(() => elementsLoop(++index, keys), 100);
    const hexid = keys[index];
    ressurectFromIndexedDB(hexid);
    const element = await getFromDBAsync(hexid);
    if (
      element &&
      verifyInIDFS(hexid, element) === VerificationStatus.NOT_FOUND &&
      getRootHexid() !== emptyRouterHexId
    ) {
      deleteFromDB(hexid);
    } else if (element && getRootHexid() !== emptyRouterHexId) {
      const { peers } = getState();
      peers.forEach((peerHexid) => {
        const closeToMe = isNeighborByHexDistance(peerHexid, hexid);
        if (closeToMe && !sendedKeys.includes(hexid + peerHexid)) {
          sendIDFSElement(peerHexid, element);
          // sendedKeys.push(hexid + peerHexid);
        }
      });
    }
  } else {
    setTimeout(startElementsLoop, 120);
  }
};

const getClosestInternalRouter = (hexid: string, router: Router) => {
  const elementPosition = getHexPosition(hexid);
  const totalElementsInLayer = numElementsInRouter ** router.layer * numElementsInRouter;
  const routerLength = maxPositionValue / totalElementsInLayer;
  const shift = Math.floor(elementPosition / routerLength);

  const internalRouterPath = router.layer + 1 + "/" + shift;
  return router.routers[internalRouterPath];
};
