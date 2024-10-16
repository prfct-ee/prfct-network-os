import { StateElement, StateElementTypes, VerificationStatus } from "../../idfs/IDFS";
import { IDFSTestDriver } from "../drivers/idfsTestDriver";

const TEST_DATA: StateElement[] = Array(10)
  .fill(0)
  .map(
    (v, i) =>
      ({
        lookupKey: "lookupKey" + i,
        data: "testHexId" + i,
        type: StateElementTypes.WALLET,
        owner: "testhexid",
        ttd: 0,
      } as StateElement)
  );

describe("deleteInIDFS", () => {
  let driver = new IDFSTestDriver(TEST_DATA);

  beforeEach(async () => {
    await driver.initIDFS();
    await driver.setTestElements();
  });

  test("should be called without error for not existed element", async () => {
    await driver.deleteItemInIDFS("test");
    const verifyAllElementsResult = await driver.getAllElementsVerification();
    const allElementsAreFound = Array(TEST_DATA.length).fill(VerificationStatus.FOUND);
    expect(verifyAllElementsResult).toStrictEqual(allElementsAreFound);
  });

  test("should not delete root route", async () => {
    await driver.deleteItemInIDFS(driver.rootHexId);
    const verifyAllElementsResult = await driver.getAllElementsVerification();
    const allElementsAreFound = Array(TEST_DATA.length).fill(VerificationStatus.FOUND);
    expect(verifyAllElementsResult).toStrictEqual(allElementsAreFound);
  });

  test("should not delete routes", async () => {
    const childRoutersHexIds = Object.values(driver.getRootRouter().routers);
    await driver.deleteItemListInIDFS(childRoutersHexIds);
    const verificationResults = childRoutersHexIds.map(async (hexId) => {
      return await driver.getRouterVerification(hexId);
    });
    const verifyRoutes = await Promise.all(verificationResults);
    expect(verifyRoutes).toStrictEqual([VerificationStatus.FOUND, VerificationStatus.FOUND]);
  });

  test("should delete element form root route", async () => {
    const firstFourTestElement = driver.testHexIDs.slice(0, 4);
    const firstThreeTestElement = driver.testHexIDs.slice(0, 3);

    expect(await driver.getRouterElementHexIds(driver.rootHexId)).toStrictEqual(
      firstFourTestElement
    );

    await driver.deleteItemInIDFS(driver.testHexIDs[3]);

    expect(await driver.getRouterElementHexIds(driver.rootHexId)).toStrictEqual(
      firstThreeTestElement
    );
  });

  test("should not delete router if it has routes", async () => {
    const firstFourTestElement = driver.testHexIDs.slice(0, 4);
    expect(await driver.getRouterElementHexIds(driver.rootHexId)).toStrictEqual(
      firstFourTestElement
    );

    await driver.deleteItemListInIDFS(firstFourTestElement);

    const fourItemsAreNotFound = Array(4).fill(VerificationStatus.NOT_FOUND);
    expect(await driver.getElementsVerification(firstFourTestElement)).toStrictEqual(
      fourItemsAreNotFound
    );

    expect(await driver.getRouterVerification(driver.rootHexId)).toStrictEqual(
      VerificationStatus.FOUND
    );
  });

  test("should delete empty router after delete last element", async () => {
    const rootRoutersList = await driver.getRouterRoutesHexIds(driver.rootHexId);
    expect(rootRoutersList.length).toBe(2);

    const secondRouterElementIds = driver.testHexIDs.slice(6, 8);

    const secondChildElements = await driver.getRouterElementHexIds(rootRoutersList[1]);
    expect(secondChildElements).toStrictEqual(secondRouterElementIds);
    const secondChildRoutes = await driver.getRouterRoutesHexIds(rootRoutersList[1]);
    expect(secondChildRoutes).toStrictEqual([]);

    await driver.deleteItemListInIDFS(secondRouterElementIds);

    const rootRoutersListWithout2thRoute = await driver.getRouterRoutesHexIds(driver.rootHexId);
    expect(rootRoutersListWithout2thRoute.length).toBe(1);
    expect(rootRoutersListWithout2thRoute).toStrictEqual([rootRoutersList[0]]);
  });

  test("should update only all parent routes ids and size", async () => {
    const cashedRootRouterHexId = driver.rootHexId;
    expect(driver.getRootRouter().size).toBe(100);

    const rootRoutersList = await driver.getRouterRoutesHexIds(driver.rootHexId);

    const childRootRouter1 = await driver.getRouterElementHexIds(rootRoutersList[0]);
    expect(childRootRouter1).toStrictEqual([
      driver.testHexIDs[4],
      driver.testHexIDs[5],
      driver.testHexIDs[8],
      driver.testHexIDs[9],
    ]);
    expect(await driver.getRouterSize(rootRoutersList[0])).toBe(40);

    const cashedChild1RouterHexId = rootRoutersList[0];
    const cashedChild2RouterHexId = rootRoutersList[1];
    const cashedChild3RouterHexId = rootRoutersList[2];

    await driver.deleteItemInIDFS(driver.testHexIDs[8]);

    // rootRouter has new hexid and size
    expect(driver.rootHexId).not.toBe(cashedRootRouterHexId);
    expect(driver.getRootRouter().size).toBe(90);

    // child router does not have deleted element
    const updatedRootRoutersList = await driver.getRouterRoutesHexIds(driver.rootHexId);
    const updatedChildRootRouter1 = await driver.getRouterElementHexIds(updatedRootRoutersList[0]);
    expect(updatedChildRootRouter1).toStrictEqual([
      driver.testHexIDs[4],
      driver.testHexIDs[5],
      driver.testHexIDs[9],
    ]);

    // child router has new id and size
    expect(cashedChild1RouterHexId).not.toBe(updatedRootRoutersList[0]);
    expect(await driver.getRouterSize(updatedRootRoutersList[0])).toBe(30);

    // other routers are not changed
    expect(cashedChild2RouterHexId).toBe(updatedRootRoutersList[1]);
    expect(cashedChild3RouterHexId).toBe(updatedRootRoutersList[2]);
  });
});
