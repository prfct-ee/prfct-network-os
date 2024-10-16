import { IDFSTestDriver } from "../drivers/idfsTestDriver";
import { runActions } from "../../consensus/runActions";
import { Action } from "../../interfaces";
import { state } from "../../consensus/consensus";
import { rootUsers } from "../../consensus/constants";
import * as IDFS from "../../idfs/IDFS";
import {
  deleteInIDFS,
  setRootHexid,
  StateElement,
  StateElementTypes,
  VerificationStatus,
  verifyElementInIDFS,
} from "../../idfs/IDFS";

const pushToIdfsTreeMock = jest.fn();
const verifyElementInIDFSMock = jest.fn();
const getElementFromDBMock = jest.fn();
const deleteInIDFSMock = jest.fn();
const setRootHexidMock = jest.fn();

interface InitMock {
  verifyElementInIDFS?: () => VerificationStatus;
  getElementFromDB?: () => StateElement | undefined;
  deleteInIDFS?: () => boolean;
  pushResultList?: (StateElement | undefined)[];
  blockNumber?: number;
}

const getWallet = (props?: Partial<StateElement>): StateElement => ({
  lookupKey: "TEST_LOOK_UP_KEY",
  owner: "TEST_AUTHOR_ID",
  ttd: 10000,
  type: StateElementTypes.WALLET,
  data: "test",
  createdAt: 140000000,
  ...props,
});

const initMocks = ({
  verifyElementInIDFS,
  getElementFromDB,
  deleteInIDFS,
  pushResultList,
  blockNumber,
}: InitMock) => {
  let pushIndex = 0;
  jest.spyOn(IDFS, "pushToIdfsTree").mockImplementation(
    pushToIdfsTreeMock.mockImplementation(() => {
      const currentResult = pushResultList?.[pushIndex];
      pushIndex++;
      return pushResultList ? currentResult : { size: 100, hexid: "", affectedRouters: [] };
    })
  );
  jest.spyOn(IDFS, "setRootHexid").mockImplementation(setRootHexidMock);
  jest
    .spyOn(IDFS, "verifyElementInIDFS")
    .mockImplementation(
      verifyElementInIDFSMock.mockImplementation(
        verifyElementInIDFS || (() => VerificationStatus.FOUND)
      )
    );
  // jest
  //   .spyOn(IDFS, "getElementFromDB")
  //   .mockImplementation(
  //     getElementFromDBMock.mockImplementation(getElementFromDB || (() => getWallet()))
  //   );
  jest
    .spyOn(IDFS, "deleteInIDFS")
    .mockImplementation(deleteInIDFSMock.mockImplementation(deleteInIDFS || (() => true)));
  state.blockNumber = blockNumber || 0;
};

describe("completeActions", () => {
  let driver = new IDFSTestDriver([]);

  beforeEach(async () => {
    await driver.initIDFS();
    await driver.setTestElements();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("return empty array for empty ation list", async () => {
    const completedActions = await runActions({
      actions: {},
      initialRouterHexID: driver.rootHexId,
    });
    expect(completedActions.completedActions).toStrictEqual([]);
  });

  describe("mint", () => {
    const getMintAction = (props: Partial<Action> = {}) => ({
      from: "TEST_AUTHOR_ID",
      type: "mint",
      ttr: 100000,
      ...props,
      data: {
        hexid: "TEST_HEX_ID",
        value: "1000000",
        nonce: 10000,
        data: "",
        ...props.data,
      },
    });

    // TODO: return with rootUsers check
    test.skip("should complete action from root user only and save minted wallet", async () => {
      initMocks({});
      const rootUserHexId = rootUsers[0];
      const rootUserAction = getMintAction({
        from: rootUserHexId,
        data: { hexid: "ROOT_USER_ACTION_HEX_ID" },
      });

      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getMintAction(),
        [rootUserHexId]: rootUserAction,
      };
      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions).toStrictEqual([rootUserHexId]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(1);
      expect(pushToIdfsTreeMock).toBeCalledWith(
        expect.objectContaining({
          owner: "ROOT_USER_ACTION_HEX_ID",
          type: "wallet",
        })
      );
    });
  });

  describe("split", () => {
    const getSplitAction = (props: Partial<Action> = {}) => ({
      from: "TEST_AUTHOR_ID",
      type: "split",
      ttr: 10000,
      ...props,
      data: {
        wallet: "TEST_WALLET_ID",
        receiver: "TEST_RECEIVER_ID",
        amount: "1000",
        data: "",
        nonce: 1000,
        ...props.data,
      },
    });

    test("should not complete split if wallet amount less then 0", async () => {
      initMocks({});
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction({ data: { amount: "-10" } }),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(0);
    });

    test("should not complete split if wallet is not found", async () => {
      initMocks({ verifyElementInIDFS: () => VerificationStatus.NOT_FOUND });
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(0);
    });

    test("should not complete split if wallet is not existed in DB", async () => {
      initMocks({ getElementFromDB: () => undefined });
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(0);
    });

    test("should not complete split if wallet owner is not action author", async () => {
      initMocks({
        getElementFromDB: () => getWallet({ owner: "WRONG_AUTHOR_HEX_ID" }),
      });
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(0);
    });

    test("should not complete split if source wallet is not deleted", async () => {
      initMocks({ deleteInIDFS: () => false });
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(0);

      expect(setRootHexidMock).toBeCalledTimes(2);
      expect(setRootHexidMock).toBeCalledWith(driver.rootHexId);
    });

    test("should not complete split if next source ttd is less then block number", async () => {
      initMocks({ blockNumber: 1000000000 });
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(0);

      expect(setRootHexidMock).toBeCalledTimes(2);
      expect(setRootHexidMock).toBeCalledWith(driver.rootHexId);
    });

    test("should not complete split if next source wallet is not saved", async () => {
      initMocks({ pushResultList: [undefined] });
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(1);

      expect(setRootHexidMock).toBeCalledTimes(2);
      expect(setRootHexidMock).toBeCalledWith(driver.rootHexId);
    });

    test("should not complete split if next receiver wallet is not saved", async () => {
      initMocks({ pushResultList: [getWallet(), undefined] });
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual([]);
      expect(pushToIdfsTreeMock).toBeCalledTimes(2);

      expect(setRootHexidMock).toBeCalledTimes(2);
      expect(setRootHexidMock).toBeCalledWith(driver.rootHexId);
    });

    test("should complete split", async () => {
      initMocks({});
      const actions: { [authorHexid: string]: Action } = {
        TEST_AUTHOR_ID: getSplitAction(),
      };

      const completedActions = await runActions({ actions, initialRouterHexID: driver.rootHexId });
      expect(completedActions.completedActions).toStrictEqual(["TEST_AUTHOR_ID"]);
    });
  });
});
