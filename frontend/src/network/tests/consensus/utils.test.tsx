import { Actions, BlockData } from "../../interfaces";
import { stepSize } from "../../consensus/constants";
import { measureBlock, timePointsToTDD, ttdToTimePoints } from "../../consensus/utils";
import * as completeActions from "../../consensus/runActions";
import * as IDFS from "../../idfs/IDFS";
import * as consensus from "../../consensus/consensus";
import { StateElement, StateElementTypes } from "../../idfs/IDFS";

const TEST_initialRouterHexID = "899821def0912744acb";
const TEST_finalRouterHexID = "327878fab3ce09a7af";
const TEST_authorHexID = "32106afec";
const TEST_actions_list = [TEST_authorHexID];
const TEST_block_number = 1111;

const getBlockData = (props?: Partial<BlockData>): BlockData => ({
  block: TEST_block_number,
  actions: TEST_actions_list,
  initial: TEST_initialRouterHexID,
  final: TEST_finalRouterHexID,
  author: TEST_authorHexID,
  wallet: {
    element: {
      lookupKey: "no lookup key",
      data: "",
      type: StateElementTypes.WALLET,
      owner: "testhexid",
      ttd: 0,
    } as StateElement,
    path: [],
  },
  ...props,
});

const getAction = () => ({
  from: TEST_authorHexID,
  type: "",
  ttr: 50000,
  data: {},
});

const runActionsSpy = jest.fn();

const initMocks = (runActions = TEST_actions_list) => {
  let getRootHexidCalledTimes = 0;
  jest.spyOn(completeActions, "runActions").mockImplementation(
    runActionsSpy.mockImplementation(() => ({
      completedActions: runActions,
    }))
  );
  jest.spyOn(IDFS, "getRootHexid").mockImplementation(() => {
    const result = [TEST_initialRouterHexID, TEST_finalRouterHexID][getRootHexidCalledTimes];
    getRootHexidCalledTimes++;
    return result;
  });
  jest.spyOn(consensus, "getActions").mockImplementation(
    () =>
      ({
        [TEST_block_number]: {
          [TEST_authorHexID]: getAction(),
        },
      } as Actions)
  );
};

describe("Consensus utils", () => {
  describe("ttdToTimePoints", () => {
    test("should return time point for one step size", () => {
      expect(ttdToTimePoints(100000, stepSize, 50000)).toBe(50000);
    });
    test("should return time point for 5 step size", () => {
      expect(ttdToTimePoints(100000, 5 * stepSize, 50000)).toBe(10000);
    });
    test("should return time point for zero size the same as for one step size", () => {
      expect(ttdToTimePoints(100000, 0, 50000)).toBe(50000);
    });
  });

  describe("timePointsToTDD", () => {
    test("should return ttd for one step size", () => {
      expect(timePointsToTDD(50000, stepSize, 50000)).toBe(100000);
    });
    test("should return ttd for 5 step size", () => {
      expect(timePointsToTDD(50000, 5 * stepSize, 50000)).toBe(60000);
    });
    test("should return ttd for zero size the same as for one step size", () => {
      expect(timePointsToTDD(50000, 0, 50000)).toBe(100000);
    });
  });

  describe("measureBlock", () => {
    afterEach(jest.clearAllMocks);

    test("should measure block and NOT call completeActions if it is skipped", async () => {
      initMocks();

      const block = getBlockData();
      const blockScores = await measureBlock(block, true);
      expect(runActionsSpy).not.toBeCalled();
      expect(blockScores).toBe(4246563);
    });

    test("should return -1 if initialRouterHexID is not equal", async () => {
      initMocks();

      const block = getBlockData({
        initial: "WRONG_HEX_ID",
      });
      const blockScores = await measureBlock(block);
      expect(blockScores).toBe(-1);
    });

    test("should return -1 if actions is not equal", async () => {
      initMocks();

      const block = getBlockData({
        actions: ["WRONG_HEX_ID"],
      });
      const blockScores = await measureBlock(block);
      expect(blockScores).toBe(-1);
    });

    test("should return -1 if finalRouterHexID is not equal", async () => {
      initMocks();

      const block = getBlockData({
        final: "WRONG_HEX_ID",
      });
      const blockScores = await measureBlock(block);
      expect(blockScores).toBe(-1);
    });

    test("should complete action and measure block successfuly", async () => {
      initMocks();

      const block = getBlockData();
      const blockScores = await measureBlock(block);
      expect(blockScores).toBe(4246563);
    });
  });
});
