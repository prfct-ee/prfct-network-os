import { StateElement, StateElementTypes, VerificationStatus } from "../../idfs/IDFS";
import { getHashFromData } from "../../crypto/crypto";
import { IDFSTestDriver } from "../drivers/idfsTestDriver";

const TEST_DATA: StateElement[] = Array(10)
  .fill(0)
  .map((v, i) => ({
    lookupKey: "lookupKey" + (i + 1),
    data: "testHexId" + (i + 1),
    type: StateElementTypes.WALLET,
    owner: "testhexid",
    ttd: 0,
    createdAt: 140000000,
  }));

describe("pushToIdfsTree", () => {
  let driver = new IDFSTestDriver(TEST_DATA);

  beforeEach(async () => {
    await driver.initIDFS();
    await driver.setTestElements();
  });

  test("should verified all pushed elements", async () => {
    const verifyElements = await driver.getAllElementsVerification();
    expect(verifyElements).toStrictEqual(Array(TEST_DATA.length).fill(VerificationStatus.FOUND));
  });

  test("should created and verified 4 routes in root router", async () => {
    const routersList = await driver.getRouterRoutesHexIds(driver.rootHexId);
    const verifyRoutes = await driver.getRouterListVerification(routersList);
    expect(verifyRoutes).toStrictEqual([
      VerificationStatus.FOUND,
      VerificationStatus.FOUND,
      VerificationStatus.FOUND,
      VerificationStatus.FOUND,
    ]);
  });

  test("should create 4 first elements in root router", async () => {
    expect(await driver.getRouterElementHexIds(driver.rootHexId)).toStrictEqual(
      driver.testHexIDs.slice(0, 4)
    );
  });

  test("should construct right tree", async () => {
    const routersList = await driver.getRouterRoutesHexIds(driver.rootHexId);

    const firstRouterElements = await driver.getRouterElementHexIds(routersList[0]);
    expect(firstRouterElements).toStrictEqual([driver.testHexIDs[4]]);

    const secondRouterElements = await driver.getRouterElementHexIds(routersList[1]);
    expect(secondRouterElements).toStrictEqual([driver.testHexIDs[5], driver.testHexIDs[8]]);

    const thirdRouterElements = await driver.getRouterElementHexIds(routersList[2]);
    expect(thirdRouterElements).toStrictEqual([driver.testHexIDs[6], driver.testHexIDs[7]]);

    const fourthRouterElements = await driver.getRouterElementHexIds(routersList[3]);
    expect(fourthRouterElements).toStrictEqual([driver.testHexIDs[9]]);
  });

  test("should update only parent routes ids and size", async () => {
    expect(driver.getRootRouter().size).toBe(101);

    const routersList = await driver.getRouterRoutesHexIds(driver.rootHexId);
    const secondRouterElements = await driver.getRouterElementHexIds(routersList[1]);

    expect(secondRouterElements).toStrictEqual([driver.testHexIDs[5], driver.testHexIDs[8]]);

    const currentChild1RouterHexId = routersList[0];
    const currentChild2RouterHexId = routersList[1];
    const currentChild3RouterHexId = routersList[2];
    const currentChild4RouterHexId = routersList[3];

    expect(await driver.getRouterSize(routersList[1])).toBe(20);

    // push new element to tree
    const newElement: StateElement = {
      lookupKey: "lookupKey11",
      data: "testHexId11",
      type: StateElementTypes.WALLET,
      owner: "testhexid",
      ttd: 0,
      createdAt: 140000000,
    };
    const newElementHexId = getHashFromData(newElement);
    await driver.pushElementToTree(newElement);

    // rootRouter has new size
    expect(driver.getRootRouter().size).toBe(112);

    // child router has new element
    const updatedRoutersList = await driver.getRouterRoutesHexIds(driver.rootHexId);
    const updatedSecondRouterElements = await driver.getRouterElementHexIds(updatedRoutersList[1]);
    expect(updatedSecondRouterElements).toStrictEqual([
      driver.testHexIDs[5],
      driver.testHexIDs[8],
      newElementHexId,
    ]);

    // child router has new id and size
    expect(currentChild1RouterHexId).not.toBe(updatedRoutersList[1]);
    expect(await driver.getRouterSize(updatedRoutersList[1])).toBe(31);

    // other routers are not changed
    expect(currentChild1RouterHexId).toBe(updatedRoutersList[0]);
    expect(currentChild3RouterHexId).toBe(updatedRoutersList[2]);
    expect(currentChild4RouterHexId).toBe(updatedRoutersList[3]);
  });
});
