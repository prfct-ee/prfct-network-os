import { StateElement, StateElementTypes, VerificationStatus } from "../../idfs/IDFS";
import { IDFSTestDriver } from "../drivers/idfsTestDriver";

const TEST_DATA: StateElement[] = Array(5)
  .fill(0)
  .map((v, i) => ({
    lookupKey: "lookupKey" + (i + 1),
    data: "testHexId" + (i + 1),
    type: StateElementTypes.WALLET,
    owner: "testhexid",
    ttd: 0,
    createdAt: 140000000,
  }));

describe("lostInIDFS", () => {
  let driver = new IDFSTestDriver(TEST_DATA);

  beforeEach(async () => {
    await driver.initIDFS();
    await driver.setTestElements();
  });

  test("should return undefined for not loaded router and all its routes and elements", async () => {
    // check router verified
    const routersList = await driver.getRouterRoutesHexIds(driver.rootHexId);
    const firstRouterFromRoot = routersList[0];
    const firstRouter = await driver.getRouterByHexId(firstRouterFromRoot);

    expect(await driver.getRouterVerification(firstRouterFromRoot)).toBe(VerificationStatus.FOUND);

    // check element verified
    const firsRoutersElements = await driver.getRouterElementHexIds(firstRouterFromRoot);
    expect(await driver.getElementsVerification(firsRoutersElements)).toStrictEqual([
      VerificationStatus.FOUND,
    ]);

    // lost created router
    await driver.lostItem(firstRouterFromRoot);

    // check router lost
    expect(await driver.getRouterVerification(firstRouterFromRoot, firstRouter)).toBe(
      VerificationStatus.LOST
    );

    // check element lost
    expect(await driver.getElementsVerification(firsRoutersElements)).toStrictEqual([
      VerificationStatus.LOST,
    ]);

    // check other elements verified
    const existedElementIds = driver.testHexIDs.slice(0, 4);
    const existedVerification = await driver.getElementsVerification(existedElementIds);
    expect(existedVerification).toStrictEqual(
      Array(existedElementIds.length).fill(VerificationStatus.FOUND)
    );

    // check other rootRouter verified
    expect(await driver.getRouterVerification(driver.rootHexId)).toBe(VerificationStatus.FOUND);
  });
});
