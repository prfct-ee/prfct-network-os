import { StateElement, StateElementTypes, VerificationStatus } from "../../idfs/IDFS";
import { IDFSTestDriver } from "../drivers/idfsTestDriver";

const TEST_DATA: StateElement[] = [
  {
    lookupKey: "lookupKey",
    data: "testHexId",
    type: StateElementTypes.WALLET,
    owner: "testhexid",
    ttd: 0,
    createdAt: 140000000,
  },
];

describe("verifyStateElement", () => {
  let driver = new IDFSTestDriver(TEST_DATA);

  beforeEach(async () => {
    await driver.initIDFS();
    await driver.setTestElements();
  });

  test("should return false for empty state tree", async () => {
    expect(await driver.getElementVerification("test")).toBe(VerificationStatus.NOT_FOUND);
  });

  test("should return true for verify root hexid", async () => {
    expect(await driver.getRouterVerification(driver.rootHexId)).toBe(VerificationStatus.FOUND);
  });

  test("should return true for verify set element hex id", async () => {
    expect(await driver.getElementVerification(driver.testHexIDs[0])).toBe(
      VerificationStatus.FOUND
    );
  });

  test("should return undefined for not loaded element", async () => {
    const testElementHexId = driver.testHexIDs[0];
    expect(await driver.getElementVerification(testElementHexId)).toBe(VerificationStatus.FOUND);
    await driver.lostItem(testElementHexId);
    expect(await driver.getElementVerification(testElementHexId)).toBe(VerificationStatus.LOST);
  });
});
