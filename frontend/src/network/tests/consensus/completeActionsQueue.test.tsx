import { IDFSTestDriver } from "../drivers/idfsTestDriver";
import { runActions } from "../../consensus/runActions";
import { Action } from "../../interfaces";
import * as IDFS from "../../idfs/IDFS";
import { StateElement } from "../../idfs/IDFS";

const pushToIdfsTreeMock = jest.fn();

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
    createdAt: 140000000,
    ...props.data,
  },
});

const timeList: [string, number][] = [];

const initMocks = () => {
  jest.spyOn(IDFS, "pushToIdfsTree").mockImplementation(
    pushToIdfsTreeMock.mockImplementation((item: StateElement) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          timeList.push([item.owner, new Date().getTime()]);
          resolve({
            hexId: item.owner,
            size: 1,
            affectedRouters: [],
          });
        }, Math.random() * 100);
      });
    })
  );
};

describe("completeActions loop", () => {
  let driver = new IDFSTestDriver([]);

  beforeEach(async () => {
    await driver.initIDFS();
    await driver.setTestElements();
    initMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should run all actions by order in a queue", async () => {
    const actions1: { [authorHexid: string]: Action } = {
      ["TEST_1"]: getMintAction({ from: "TEST_1", data: { hexid: "TEST_1" } }),
      ["TEST_2"]: getMintAction({ from: "TEST_2", data: { hexid: "TEST_2" } }),
      ["TEST_3"]: getMintAction({ from: "TEST_3", data: { hexid: "TEST_3" } }),
    };

    const actions2: { [authorHexid: string]: Action } = {
      ["TEST_4"]: getMintAction({ from: "TEST_4", data: { hexid: "TEST_4" } }),
      ["TEST_5"]: getMintAction({ from: "TEST_5", data: { hexid: "TEST_5" } }),
      ["TEST_6"]: getMintAction({ from: "TEST_6", data: { hexid: "TEST_6" } }),
    };

    const actions3: { [authorHexid: string]: Action } = {
      ["TEST_7"]: getMintAction({ from: "TEST_7", data: { hexid: "TEST_7" } }),
      ["TEST_8"]: getMintAction({ from: "TEST_8", data: { hexid: "TEST_8" } }),
      ["TEST_9"]: getMintAction({ from: "TEST_9", data: { hexid: "TEST_9" } }),
    };

    const actions4: { [authorHexid: string]: Action } = {
      ["TEST_10"]: getMintAction({ from: "TEST_10", data: { hexid: "TEST_10" } }),
      ["TEST_11"]: getMintAction({ from: "TEST_11", data: { hexid: "TEST_11" } }),
      ["TEST_12"]: getMintAction({ from: "TEST_12", data: { hexid: "TEST_12" } }),
    };

    const actions5: { [authorHexid: string]: Action } = {
      ["TEST_13"]: getMintAction({ from: "TEST_13", data: { hexid: "TEST_13" } }),
      ["TEST_14"]: getMintAction({ from: "TEST_14", data: { hexid: "TEST_14" } }),
      ["TEST_15"]: getMintAction({ from: "TEST_15", data: { hexid: "TEST_15" } }),
    };

    const results = [actions1, actions2, actions3, actions4, actions5].map(async (actions) => {
      return await runActions({
        actions: actions,
        initialRouterHexID: driver.rootHexId,
        authorWallet: undefined,
      });
    });

    await Promise.all(results);

    expect(timeList.sort((a, b) => a[1] - b[1]).map((a) => a[0])).toStrictEqual([
      "TEST_1",
      "TEST_2",
      "TEST_3",
      "TEST_4",
      "TEST_5",
      "TEST_6",
      "TEST_7",
      "TEST_8",
      "TEST_9",
      "TEST_10",
      "TEST_11",
      "TEST_12",
      "TEST_13",
      "TEST_14",
      "TEST_15",
    ]);
  });
});
