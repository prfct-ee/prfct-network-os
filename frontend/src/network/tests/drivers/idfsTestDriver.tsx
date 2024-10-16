import {
  deleteInIDFS,
  findPathToElementInIDFS,
  initRootRouter,
  lostInIDFS,
  onIDFSUpdate,
  pushToIdfsTree,
  Router,
  StateElement,
  verifyElementInIDFS,
  verifyRouterInIDFS,
} from "../../idfs/IDFS";
import { getHashFromData } from "../../crypto/crypto";
import { wait } from "@testing-library/user-event/dist/utils";
import { getElementFromDB, getRouterFromDB } from "../../idfs/idfsDB";

export class IDFSTestDriver {
  testHexIDs: string[] = [];
  rootHexId: string = "";
  private rootRouter?: Router;
  testData: StateElement[];

  constructor(testData: StateElement[]) {
    this.testData = testData;
  }

  async initIDFS() {
    onIDFSUpdate((hexId) => {
      this.rootHexId = hexId;
    });
    await initRootRouter();
    await wait(100);
  }

  async setTestElements() {
    this.testHexIDs = this.testData.map(getHashFromData);
    for (const stateElement of this.testData) {
      await this.pushElementToTree(stateElement);
    }
    await wait(100);
  }

  async pushElementToTree(element: StateElement) {
    await pushToIdfsTree(element);
    await this.updateRootRouter();
  }

  async updateRootRouter() {
    const foundNewRouter = await getRouterFromDB(this.rootHexId);
    if (!foundNewRouter) {
      throw new Error("Root Router is undefined");
    }
    this.rootRouter = foundNewRouter;
  }

  getRootRouter() {
    if (!this.rootRouter) {
      throw new Error("Root Router is undefined");
    }
    return this.rootRouter;
  }

  async getRouterByHexId(hesId: string) {
    const router = await getRouterFromDB(hesId);
    if (!router) {
      throw new Error(`Router ${hesId} is undefined`);
    }
    return router;
  }

  async getElementVerification(elementsHexId: string) {
    return await verifyElementInIDFS(elementsHexId);
  }

  async getAllElementsVerification() {
    return await this.getElementsVerification(this.testHexIDs);
  }

  async getElementsVerification(elementsHexIds: string[]) {
    const verifyResult = elementsHexIds.map(
      async (hexId) => await this.getElementVerification(hexId)
    );
    return await Promise.all(verifyResult);
  }

  async deleteItemInIDFS(hexId: string) {
    await deleteInIDFS(hexId);
    await this.updateRootRouter();
  }

  async deleteItemListInIDFS(hexIds: string[]) {
    for (const hexId of hexIds) {
      await this.deleteItemInIDFS(hexId);
    }
    await this.updateRootRouter();
  }

  async getRouterElementHexIds(routerHexId: string) {
    const router = await this.getRouterByHexId(routerHexId);
    return router.stateElements.map((element) => element.hexId);
  }

  async getRouterSize(routerHexId: string) {
    const router = await this.getRouterByHexId(routerHexId);
    return router.size;
  }

  async getRouterRoutesHexIds(routerHexId: string): Promise<string[]> {
    const router = await this.getRouterByHexId(routerHexId);
    return Object.values(router.routers);
  }

  async getRouterVerification(routerHexId: string, routerItem?: Router) {
    const router = routerItem ? routerItem : await this.getRouterByHexId(routerHexId);
    return await verifyRouterInIDFS(routerHexId, router.layer, router.shift);
  }

  async getRouterListVerification(routersHexIds: string[]) {
    const newRoutesIDs = routersHexIds.map(
      async (hexId) => await this.getRouterVerification(hexId)
    );
    return await Promise.all(newRoutesIDs);
  }

  async findPathToElement(hexId: string) {
    const foundRouters = await findPathToElementInIDFS(hexId);
    return foundRouters.map(getHashFromData);
  }

  async lostItem(hexId: string) {
    await lostInIDFS(hexId);
  }

  async getElementFromIDFS(hexId: string) {
    return await getElementFromDB(hexId);
  }
}
