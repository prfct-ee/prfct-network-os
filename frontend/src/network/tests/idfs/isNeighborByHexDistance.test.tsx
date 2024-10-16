import { isNeighborByHexDistance } from "../../idfs/isNeighborByHexDistance";
import * as crypto from "../../crypto/crypto";
import { getHashFromData, maxPositionValue, myHexid } from "../../crypto/crypto";
import * as state from "../../state";
import { NetworkState } from "../../state";

const myHexId = "989680edef124a14312364949670536a";
const testPeerHexId = getHashFromData("TEST_PEER_HEX_ID");
const step = maxPositionValue / 5;

const initMocks = (myHexId: string) => {
  jest.spyOn(crypto, "myHexid").mockImplementation(() => myHexId);
  jest.spyOn(state, "getState").mockImplementation(
    () =>
      ({
        peersChildren: {
          [testPeerHexId]: [
            getHashFromData("TEST_CHILD_0_HEX_ID"),
            getHashFromData("TEST_CHILD_1_HEX_ID"),
            myHexId,
            getHashFromData("TEST_CHILD_2_HEX_ID"),
            getHashFromData("TEST_CHILD_3_HEX_ID"),
          ],
        },
      } as NetworkState)
  );
};

const getHexNumberByShift = (shift: number) =>
  (parseInt(myHexId.slice(0, 6), 16) + shift).toString(16);

describe("isNeighborByHexDistance", () => {
  beforeEach(() => {
    initMocks(myHexId);
  });
  afterEach(() => jest.clearAllMocks());

  test("should return true for close to my hexid items", () => {
    const closeRightItem = getHexNumberByShift(1);
    const closeLeftItem = getHexNumberByShift(-1);

    expect(isNeighborByHexDistance(testPeerHexId, closeRightItem)).toBe(true);
    expect(isNeighborByHexDistance(testPeerHexId, myHexId)).toBe(true);
    expect(isNeighborByHexDistance(testPeerHexId, closeLeftItem)).toBe(true);
  });

  test("should return true for items those closed to neighbour peers", () => {
    const rightNeighbourItem = getHexNumberByShift(step);
    const leftNeighbourItem = getHexNumberByShift(-step);

    expect(isNeighborByHexDistance(testPeerHexId, rightNeighbourItem)).toBe(true);
    expect(isNeighborByHexDistance(testPeerHexId, leftNeighbourItem)).toBe(true);
  });

  test("should return false for items those closed to far peers", () => {
    const rightFarItem = getHexNumberByShift(2 * step);
    const leftFarItem = getHexNumberByShift(-2 * step);

    expect(isNeighborByHexDistance(testPeerHexId, rightFarItem)).toBe(false);
    expect(isNeighborByHexDistance(testPeerHexId, leftFarItem)).toBe(false);
  });

  test("should return true for element from the end if myHexId in the start of diapason", () => {
    const myHexIdFromEnd = "00000edef124a14312364949670536a";
    const itemHexIdFromStart = "fffffedef124a14312364949670536a";
    initMocks(myHexIdFromEnd);

    expect(isNeighborByHexDistance(testPeerHexId, itemHexIdFromStart)).toBe(true);
  });

  test("should return true for element from the start if myHexId in the end of diapason", () => {
    const myHexIdFromStart = "fffffedef124a14312364949670536a";
    const itemHexIdFromEnd = "00000edef124a14312364949670536a";
    initMocks(myHexIdFromStart);

    expect(isNeighborByHexDistance(testPeerHexId, itemHexIdFromEnd)).toBe(true);
  });
});
