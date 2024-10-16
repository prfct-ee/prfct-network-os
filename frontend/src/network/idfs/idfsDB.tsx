import { DBSchema, IDBPDatabase, openDB } from "idb";
import { stepDuration } from "../consensus/constants";
import { getHashFromData, myHexid } from "../crypto/crypto";
import { Router, StateElement, VerificationStatus, verifyInIDFS } from "./IDFS";
import { MyWallets, updateMyWallets } from "./myWallets";
import { cloneObject } from "./utils";

// Routers DB
const cache: Record<string, Router | StateElement | undefined> = {};
(window as any).cache = cache;
const timeCache: Record<string, boolean> = {};

export const saveToDB = (element: Router | StateElement) => {
  !element && console.error("!--> setElementToDB, empty element");
  const hexid = getHashFromData(element);
  cache[hexid] = cloneObject(element);
  saveToIndexedDB(element);

  timeCache[hexid] = true;
  setInterval(() => {
    timeCache[hexid] = false;
    delete timeCache[hexid];
  }, stepDuration * 3);
};

export const deleteFromDB = async (hexid: string) => {
  if (timeCache[hexid]) return;
  delete cache[hexid];
  (await idfsDB)?.delete("elements", hexid);
};

export const getFromDB = (hexid: string): StateElement | Router | undefined => {
  ressurectFromIndexedDB(hexid);
  const fromCache = cloneObject(cache[hexid]);
  if (!fromCache) return undefined;
  return cache[hexid] as StateElement | Router;
};

export const getFromDBAsync = async (hexid: string): Promise<StateElement | Router | undefined> => {
  const element = await (await idfsDB)?.get("elements", hexid);
  return element;
};

export const getElementFromDB = (hexid: string): StateElement | undefined => {
  const fromCache = cloneObject(cache[hexid]);
  if (fromCache && (fromCache as StateElement).data === undefined) {
    console.log("Error in DB. Find Router instead StateElement", hexid);
  }
  ressurectFromIndexedDB(hexid);
  return cache[hexid] as StateElement;
};

export const getRouterFromDB = (hexid: string): Router | undefined => {
  const fromCache = cloneObject(cache[hexid]);
  if (fromCache && (fromCache as StateElement).data !== undefined) {
    console.log("Error in DB. Find StateElement instead Router", hexid);
  }
  ressurectFromIndexedDB(hexid);
  return fromCache as Router;
};

const saveToIndexedDB = async (element: Router | StateElement) => {
  (await idfsDB)?.put("elements", element, getHashFromData(element));
};

export const ressurectFromIndexedDB = async (hexid: string) => {
  // const element = await (await idfsDB)?.get("elements", hexid);
  // if (element) {
  //   cache[getHashFromData(element)] = cloneObject(element);
  // }
};

interface IdfsDB extends DBSchema {
  elements: {
    key: string;
    value: Router | StateElement;
    indexes: { owner: string };
  };
}

let idfsDB: Promise<IDBPDatabase<IdfsDB>> | undefined;

(async () => {
  idfsDB = openDB<IdfsDB>("idfs-db_v0026", 1, {
    upgrade: (db) => {
      const store = db.createObjectStore("elements");
      store.createIndex("owner", "owner");
      db.onerror = console.log;
    },
  });
})();

export const getAllKeys = async () => {
  const keys = await (await idfsDB)?.getAllKeys("elements");
  return keys;
};

setInterval(async () => {
  const db = await idfsDB;
  const result = (await db?.getAllFromIndex(
    "elements",
    "owner",
    IDBKeyRange.only(myHexid())
  )) as StateElement[];
  const filtered = result?.filter(
    (element) => verifyInIDFS(getHashFromData(element), element) == VerificationStatus.FOUND
  );
  const wallets: MyWallets = new Map(filtered.map((obj) => [getHashFromData(obj), obj]));
  updateMyWallets(wallets);
}, stepDuration);

//
// interface ElementStream {
//   element: StateElement;
//   hexid: string;
// }
// const setIDFSElementStream = Stream<ElementStream>();
// export const onSetIDFSElement = setIDFSElementStream.on;
