import { StateElement, StateElementTypes } from "../../idfs/IDFS";
import { IDFSTestDriver } from "../drivers/idfsTestDriver";

const TEST_DATA: StateElement[] = Array(7)
  .fill(0)
  .map((v, i) => ({
    lookupKey: "lookupKey" + i,
    data: "testHexId" + i,
    type: StateElementTypes.WALLET,
    owner: "testhexid",
    ttd: 0,
    createdAt: 140000000,
  }));

describe("findPathInIDFS", () => {
  let driver = new IDFSTestDriver(TEST_DATA);

  beforeEach(async () => {
    await driver.initIDFS();
    await driver.setTestElements();
  });

  test("should return element path from child router", async () => {
    const pathTo4thElement = await driver.findPathToElement(driver.testHexIDs[4]);
    const rootRouterChildRouters = await driver.getRouterRoutesHexIds(driver.rootHexId);
    expect(pathTo4thElement).toStrictEqual([driver.rootHexId, rootRouterChildRouters[0]]);
  });

  test("should return empty path for not added hexId", async () => {
    const pathToNotExistedElement = await driver.findPathToElement("not existed");
    expect(pathToNotExistedElement).toStrictEqual([]);
  });

  test("should return empty path for deleted element", async () => {
    const testElementHexId = driver.testHexIDs[5];
    const foundRouters = await driver.findPathToElement(testElementHexId);
    const rootRouterChildRouters = await driver.getRouterRoutesHexIds(driver.rootHexId);
    expect(foundRouters).toStrictEqual([driver.rootHexId, rootRouterChildRouters[1]]);

    await driver.deleteItemInIDFS(testElementHexId);
    const foundRoutersAfterDelete = await driver.findPathToElement(testElementHexId);
    expect(foundRoutersAfterDelete).toStrictEqual([]);
  });

  test("should return empty path for lost route elements", async () => {
    const rootRouterChildRouters = await driver.getRouterRoutesHexIds(driver.rootHexId);
    const testElementHexId = driver.testHexIDs[4];
    const firstRouterInRoot = rootRouterChildRouters[0];

    const foundRoutersToElement = await driver.findPathToElement(testElementHexId);
    expect(foundRoutersToElement).toStrictEqual([driver.rootHexId, firstRouterInRoot]);

    // lost router
    await driver.lostItem(firstRouterInRoot);

    const foundRoutersToElementAfterLost = await driver.findPathToElement(testElementHexId);
    expect(foundRoutersToElementAfterLost).toStrictEqual([]);
  });
});
