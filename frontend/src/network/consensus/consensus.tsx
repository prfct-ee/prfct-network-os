import { getHashFromData, myHexid } from "../crypto/crypto";
import { Stream } from "../EventEmitter/EventEmitter";
import { getRootHexid, setRootHexid } from "../idfs/IDFS";
import { getRouterFromDB, saveToDB } from "../idfs/idfsDB";
import { getMyBestWallet } from "../idfs/myWallets";
import { Action, Actions, Block, ColdMessage, ColdMessagesStorage, State } from "../interfaces";
import { broadcastBlock, broadcastColdMessage, updateConnections } from "../network";
import { APP_VERSION, stepDuration, supportNodes, warmupDelay } from "./constants";
import { runActions } from "./runActions";
import { countWalletScores, isWalletVerified, measureBlock } from "./utils";

export const state: State = {
  blockNumber: 0,
  version: APP_VERSION,
  rootRouter: undefined,
};

// Init Loop
let isLoopStarted = false;
export const initLoop = () => {
  if (isLoopStarted) return;
  isLoopStarted = true;

  console.log("init PoS loop");
  setTimeout(startWarmupStage, stepDuration - (Date.now() % stepDuration));
  updateConnections();
};

let stage: "WARMUP" | "COOLDOWN" = "WARMUP";

export const startWarmupStage = () => {
  const startTime = Date.now();
  stage = "WARMUP";
  bestBlock = undefined;

  const blockNumber = Math.round((Date.now() - 1645 * 10 ** 9) / stepDuration);
  state.blockNumber = blockNumber;
  console.log(`${blockNumber} --> warmup stage`);

  // Block generation
  const block: Block = {
    scores: 0,
    data: {
      author: myHexid(),
      actions: [],
      initial: getRootHexid(),
      final: "final",
      block: state.blockNumber,
      wallet: getMyBestWallet(),
    },
  };
  const thisStepActions: { [authorHexid: string]: Action } = actions[state.blockNumber] || {};

  const { completedActions } = runActions({
    actions: thisStepActions,
    initialRouterHexID: block.data.initial,
    authorWallet: block.data.wallet?.element,
  });
  block.data.actions = completedActions;

  block.data.final = getRootHexid();
  setRootHexid(block.data.initial);
  const blockScores = measureBlock(block.data, true);
  block.scores = blockScores;
  setRootHexid(block.data.initial);

  addNewBlock(block, myHexid());
  currentBlockStream.emit(block);

  console.log(`warmup delay:  ${Date.now() - startTime}`);
  setTimeout(startCooldownStage, warmupDelay - (Date.now() - startTime));
};

const startCooldownStage = () => {
  setTimeout(startWarmupStage, stepDuration - (Date.now() % stepDuration));

  stage = "COOLDOWN";
  console.log("----- cooldown");
  coldStorage = {};
  bestFinalHexid = undefined;

  if (bestBlock) {
    setRootHexid(bestBlock.data.final);
    const rootHexid = getRootHexid();
    const rootRouter = getRouterFromDB(rootHexid);
    if (!rootRouter) {
      console.log("No root router in DB", rootHexid, bestBlock);
      return;
    }
    const myColdMessage: ColdMessage = {
      author: bestBlock.data.author,
      wallet: getMyBestWallet(),
      rootRouter,
    };

    addNewColdMessage(myColdMessage, myHexid());
  } else {
    console.warn("err: consensus.tsx | startCooldownStage() - no best block");
  }
};

// Add new Action
const actions: Actions = {};

export const getActions = () => actions;

export const addNewAction = (action: Action): boolean => {
  const isActionSuitable =
    !actions[action.ttr]?.[action.from] &&
    action.ttr > state.blockNumber &&
    action.ttr < state.blockNumber + 4;

  if (!isActionSuitable) return false;
  if (!actions[action.ttr]) actions[action.ttr] = {};
  actions[action.ttr][action.from] = action;

  return true;
};

// Add new Block
let bestBlock: Block | undefined = undefined;
export const addNewBlock = (block: Block, from: string) => {
  if (stage == "COOLDOWN") return;

  const wallet = block.data.wallet?.element;
  if (wallet && (wallet?.owner !== block.data.author || !isWalletVerified(block.data.wallet)))
    return;

  blockStream.emit({ block, from });

  const bestBlockScores = bestBlock?.scores || 0;

  if (bestBlockScores > block.scores) {
    return;
  }

  const initialRootHexid = getRootHexid();

  const blockActions = block.data.actions.reduce<Record<string, Action>>((prev, curr) => {
    if (actions[state.blockNumber] && actions[state.blockNumber][curr]) {
      prev[curr] = actions[state.blockNumber][curr];
    }
    return prev;
  }, {});

  const runResult = runActions({
    actions: blockActions,
    initialRouterHexID: block.data.initial,
    authorWallet: block.data.wallet?.element,
  });
  setRootHexid(initialRootHexid);

  if (runResult.completedActions.length !== block.data.actions.length) return;

  const incomingBlockScores = measureBlock(block.data);

  if (incomingBlockScores !== block.scores) {
    // console.warn("fake scores in block", incomingBlockScores, block.scores, block);
    console.log("-> block scores mismatch");
    return;
  }

  if (bestBlockScores < incomingBlockScores) {
    bestBlock = { ...block, scores: incomingBlockScores };
    broadcastBlock(block);
    bestBlockStream.emit(block);
  }
};

// Add new Cold Message
let coldStorage: ColdMessagesStorage = {};
let bestFinalHexid: string | undefined;
export const addNewColdMessage = (message: ColdMessage, from: string) => {
  if (stage == "WARMUP") return;

  const wallet = message.wallet?.element;
  if (wallet) saveToDB(wallet);

  if (wallet && (wallet?.owner !== from || !isWalletVerified(message.wallet))) return;

  coldMessagesStream.emit({ coldMessage: message, from });

  const coldMessageRouterHexId = getHashFromData(message.rootRouter);
  if (coldMessageRouterHexId === "ed46ffc743e80ff8474280f719ccdc8e") return;

  saveToDB(message.rootRouter);

  const isSupportNode = supportNodes.includes(message.author);

  const scores = Math.min(10e10, countWalletScores(message.wallet?.element));

  coldStorage[message.author] = {
    scores: isSupportNode ? 10e12 + scores : scores,
    finalHexid: coldMessageRouterHexId,
  };

  const selector: { [hexid: string]: number } = {};

  Object.values(coldStorage).forEach((coldMessage) => {
    if (selector[coldMessage.finalHexid]) {
      selector[coldMessage.finalHexid] += coldMessage.scores;
    } else {
      selector[coldMessage.finalHexid] = coldMessage.scores;
    }
  });

  const _bestFinalHexid = Object.entries(selector).sort((a, b) => b[1] - a[1])[0][0];

  if (bestFinalHexid === _bestFinalHexid) {
    return;
  }

  bestFinalHexid = _bestFinalHexid;

  selectedColdMessagesStream.emit(message);

  const bestRootRouter = getRouterFromDB(bestFinalHexid);

  if (bestRootRouter) {
    broadcastColdMessage(message);
    setRootHexid(bestFinalHexid);
  } else {
    console.warn("Broadcast router is not found!");
  }
};

export const currentBlockStream = Stream<Block>();
export const blockStream = Stream<{ block: Block; from: string }>(); // All received blocks
export const bestBlockStream = Stream<Block>();
export const coldMessagesStream = Stream<{ coldMessage: ColdMessage; from: string }>();
export const selectedColdMessagesStream = Stream<ColdMessage>();
