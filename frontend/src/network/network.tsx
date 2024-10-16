import { addNewAction, addNewBlock, addNewColdMessage, state } from "./consensus/consensus";
import { stepDuration, supportNodes } from "./consensus/constants";
import { runActions } from "./consensus/runActions";
import {
  decryptFrom,
  encryptFor,
  getHashFromData,
  getHexDistance,
  getHexPosition,
  myHexid,
  signMessage,
} from "./crypto/crypto";
import { Stream } from "./EventEmitter/EventEmitter";
import { getRootHexid, setRootHexid } from "./idfs/IDFS";
import { saveToDB } from "./idfs/idfsDB";
import { getMyBestWallet } from "./idfs/myWallets";
import {
  Action,
  ActionContainer,
  Block,
  ColdMessageSource,
  GateStatusMessage,
  Message,
  MessageType,
  SignedMessage,
  SMS,
  SMSMessage,
} from "./interfaces";
import { _log } from "./logger/logger";
import {
  isSocketConnected,
  onSocketConnection,
  onSocketStatus,
  sendSocketMessage,
  socketConnect,
  socketDisconnect,
} from "./socket";
import { eventEmitter, getState, subscribe } from "./state";
import {
  applyWebRTCMessage,
  destroy,
  directConnectWith,
  onConnectionDestroyed,
  onConnectionsUpdate,
  onDatachannel,
  onDirectMessage,
  onNewSmsMessage,
  sendToDatachannel,
} from "./webrtc";

let networkState = getState();

subscribe((_networkState) => {
  networkState = _networkState;
});

let ignoreHexids: string[] = [];
export const isHexidIgnored = (hexid: string) => {
  return ignoreHexids.includes(hexid);
};
export const addToIgnoreList = (hexid: string) => {
  ignoreHexids.push(hexid);
  setTimeout(() => {
    removeFromIgnoreList(hexid);
  }, stepDuration / 2);
};
export const removeFromIgnoreList = (hexid: string) => {
  ignoreHexids = ignoreHexids.filter((_hexid) => hexid != _hexid);
};

onConnectionDestroyed((hexid) => {
  addToIgnoreList(hexid);
});

//_ UI send action
export const sendAction = (type: string, data: any) => {
  _log("d_pixel", `send action ${type}  ${JSON.stringify(data)}`);

  const action: Action = {
    from: myHexid(),
    type,
    ttr: state.blockNumber + 2,
    data: data,
  };

  const myBestWallet = getMyBestWallet();
  const rootHexid = getRootHexid();

  const { affectedElements, affectedRoutes, completedActions } = runActions({
    actions: { [myHexid()]: action },
    initialRouterHexID: getRootHexid(),
    authorWallet: myBestWallet.element,
  });
  setRootHexid(rootHexid);

  if (completedActions.length === 0) return;

  if (addNewAction(action)) {
    broadcastAction({ action, affectedElements, affectedRoutes });
  }
};

const broadcastAction = (actionContainer: ActionContainer, excludeList: string[] = []) => {
  _log("d_pixel", `broadcast action ${JSON.stringify(actionContainer.action.data)}`);

  networkState.peers.forEach((hexid) => {
    if (hexid === actionContainer.action.from || excludeList.includes(hexid)) {
      return;
    }
    sendMessage(hexid, "ACTION", actionContainer);
  });
};

export const broadcastBlock = (block: Block) => {
  networkState.peers.forEach((hexid) => {
    sendMessage(hexid, "BLOCK", block);
  });
};

export const broadcastColdMessage = (message: ColdMessageSource) => {
  networkState.peers.forEach((hexid) => {
    sendMessage(hexid, "COLD_MESSAGE", message);
  });
};

export const maxPeers = 6;

//_ Update connections fn
export const updateConnections = () => {
  if (
    networkState.peers.length < 2 ||
    supportNodes.includes(myHexid()) ||
    (networkState.candidates.length && isSocketConnected()) ||
    process.env.NODE_ENV === "development"
  ) {
    socketConnect();
  } else {
    socketDisconnect();
  }
  if (networkState.peers.length > maxPeers * 2) {
    destroy(
      networkState.peers.sort(
        (a, b) => getHexDistance(b, myHexid()) - getHexDistance(a, myHexid())
      )[0]
    );
  }

  if (networkState.peers.length + networkState.candidates.length <= maxPeers) {
    const remotePeers = networkState.peers
      .flatMap((hexid) => {
        return networkState.peersChildren[hexid] || [];
      })
      .concat(networkState.gatePeers)
      .filter(
        (hexid, i, a) =>
          !networkState.peers.includes(hexid) &&
          !networkState.candidates.includes(hexid) &&
          hexid !== myHexid() &&
          !isHexidIgnored(hexid) &&
          a.indexOf(hexid) === i
      )
      .sort((a, b) => getHexDistance(a, myHexid()) - getHexDistance(b, myHexid()));

    remotePeers.slice(0, 3).map((hexid) => connectWith(hexid));
  }

  setTimeout(updateConnections, 500);
};

//_ Connect with fn
let welcomes: string[] = [];
export const connectWith = (hexid: string) => {
  if (networkState.candidates.includes(hexid)) return false;

  if (getHexPosition(myHexid()) > getHexPosition(hexid)) {
    if (!welcomes.includes(hexid)) {
      sendMessage(hexid, "WEBRTC", { subtype: "welcome" });
      welcomes.push(hexid);
      setTimeout(() => (welcomes = welcomes.filter((_hexid) => _hexid !== hexid)), stepDuration);
      _log("webrtc", "welcome to " + hexid.slice(0, 6));
    }
  } else {
    directConnectWith(hexid);
  }
};

export const sendIDFSElement = (to: string, data: any = undefined) => {
  const signedMessage = signMessage(makeMessage(to, "IDFS", data));
  sendToDatachannel(to, signedMessage);
  ownIDFSMessageStream.emit(signedMessage);
};

//_ Send message fn
export const sendMessage = (to: string, type: MessageType, data: any = undefined) => {
  if (to === myHexid()) return;

  type !== "PING" &&
    _log("webrtc", `send message -> ${to.slice(0, 6)} ${type} ${JSON.stringify(data)}`);

  const webrtcResult = sendToDatachannel(to, signMessage(makeMessage(to, type, data)));

  const message = makeMessage(to, type, data);
  ownMessageStream.emit(message);

  if (!webrtcResult) {
    const proxys: string[] = [];

    for (let a = 0; a < networkState.peers.length; a++) {
      const peerID = networkState.peers[a];
      if (networkState.peersChildren[peerID]?.includes(to)) {
        proxys.push(peerID);
      }
    }

    if (proxys.length > 0) {
      const proxyID = proxys[Math.floor(proxys.length * Math.random())];
      sendToDatachannel(proxyID, signMessage(makeMessage(to, type, data)));
    } else if (type === "WEBRTC") {
      sendSocketMessage(signMessage(makeMessage(to, type, data)));
    }
  }
};

export const makeMessage = (to: string, type: MessageType, data: any = undefined): Message => ({
  from: myHexid(),
  datestamp: Date.now(),
  to,
  type,
  data,
});

const updateClientPeersReducer = eventEmitter<Message>((state, message) => {
  return {
    ...state,
    peersChildren: {
      ...state.peersChildren,
      [message.from]: message.data,
    },
  };
});

onDirectMessage((message) => {
  switch (message.raw.type) {
    case "WEBRTC":
      applyWebRTCMessage(message.raw);
      break;
    case "STATUS":
      updateClientPeersReducer(message.raw);
      resendCachedSMS();
      break;
    case "BLOCK":
      addNewBlock(message.raw.data, message.raw.from);
      break;
    case "COLD_MESSAGE":
      void addNewColdMessage(
        {
          rootRouter: message.raw.data.rootRouter,
          author: message.raw.from,
          wallet: message.raw.data.wallet,
        },
        message.raw.from
      );
      break;
    case "ACTION":
      _log(
        "d_pixel",
        `get action from ${message.raw.from.slice(0, 6)}  ${JSON.stringify(message.raw.data.data)}`
      );
      const actionContainer: ActionContainer = message.raw.data;
      const actionPushResult = addNewAction(actionContainer.action);

      if (actionPushResult) {
        for (const item of actionContainer.affectedElements) {
          saveToDB(item);
        }
        for (const router of actionContainer.affectedRoutes) {
          saveToDB(router);
        }
        broadcastAction(actionContainer, [message.raw.from]);
      }
      break;
  }
});

onSocketConnection(
  eventEmitter<boolean>((state, isGateConnected) => ({ ...state, isGateConnected, gatePeers: [] }))
);

const replaceGatePeersReducer = eventEmitter<GateStatusMessage>((state, status) => {
  return { ...state, gatePeers: status.connections };
});
onSocketStatus(replaceGatePeersReducer);

const updateDataChannelsReducer = eventEmitter<string[]>((state, peers) => {
  const candidates = networkState.candidates.filter((hexid) => !peers.includes(hexid));
  const peersChildren = { ...networkState.peersChildren };
  Object.keys(networkState.peersChildren)
    .filter((hexid) => !networkState.peers.includes(hexid))
    .forEach((hexid) => {
      delete peersChildren[hexid];
    });

  return { ...state, peers, peersChildren, candidates };
});
onDatachannel((dataChannels: string[]) => {
  updateDataChannelsReducer(dataChannels);

  dataChannels.forEach((hexid) => {
    sendMessage(hexid, "STATUS", networkState.peers);
  });
});

const connetionUpdateReducer = eventEmitter<string[]>((state, connections) => {
  const peersChildren = { ...networkState.peersChildren };
  Object.keys(networkState.peersChildren)
    .filter((hexid) => !connections.includes(hexid))
    .forEach((hexid) => {
      delete peersChildren[hexid];
    });

  const candidates = connections.filter((hexid) => !networkState.peers.includes(hexid));
  return { ...state, connections, peersChildren, candidates };
});
onConnectionsUpdate(connetionUpdateReducer);

const getHorizonPeers = () => [
  ...networkState.peers,
  ...networkState.peers.flatMap((hexid) => networkState.peersChildren[hexid] || []),
];

const stageSteps = 6;
const numSymbolsToSave = 5;
let cacheForSMS: SignedMessage[] = [];
const arrivedHashList: string[] = [];

const resendCachedSMS = () => {
  getHorizonPeers().map((hexid) => {
    const cachedSMS = cacheForSMS.filter((signedSmsMessage) => hexid === signedSmsMessage.raw.to);
    cachedSMS.forEach((signedSmsMessage) => {
      sendSMSMessage(signedSmsMessage);
    });
    cacheForSMS = cacheForSMS.filter((message) => !cachedSMS.includes(message));
  });
};

onNewSmsMessage((signedSmsMessage: SignedMessage) => {
  const smsMessage = signedSmsMessage.raw;

  const isLastStep = signedSmsMessage.stage.length >= stageSteps * numSymbolsToSave;
  const isPreLastStep = signedSmsMessage.stage.length >= (stageSteps - 1) * numSymbolsToSave;

  // todo: returning a message from a deadlock
  const hash = getHashFromData(smsMessage);
  if (arrivedHashList.indexOf(hash) !== -1) return;
  arrivedHashList.push(hash);

  if (smsMessage.to === myHexid()) {
    const decodedSMS = smsMessageToSms(smsMessage);
    const encodedSMS: SMS = {
      ...decodedSMS,
      content: JSON.parse(decryptFrom(decodedSMS.from, decodedSMS.content)),
    };
    smsStream.emit(encodedSMS);
  } else {
    if (signedSmsMessage.stage.length > stageSteps * numSymbolsToSave) return;

    if (smsMessage.data.type === "SMS_TEXT" && (isLastStep || isPreLastStep)) {
      const smsMessageWithNextStage = {
        ...signedSmsMessage,
        stage: signedSmsMessage.stage + myHexid().slice(0, numSymbolsToSave),
      };
      networkState.peers.forEach((hexid) => sendToDatachannel(hexid, smsMessageWithNextStage));

      if (
        !cacheForSMS.find(
          (_message) => _message.raw.data.content === signedSmsMessage.raw.data.content
        )
      ) {
        cacheForSMS.push(signedSmsMessage);
        cacheForSMS = cacheForSMS.slice(0, 1000);
      }
    } else {
      sendSMSMessage(signedSmsMessage);
    }
  }
});

const sendSMSMessage = (signedSmsMessage: SignedMessage) => {
  const channels = networkState.peers.sort(
    (a, b) =>
      getHexDistance(a, signedSmsMessage.raw.to) - getHexDistance(b, signedSmsMessage.raw.to)
  );
  const channelsExcludeHistory = channels.filter(
    (hexid) => signedSmsMessage.stage.indexOf(hexid.slice(0, numSymbolsToSave)) === -1
  );

  const closestChannelID = [...channelsExcludeHistory, ...channels][0];
  const closestChannelID1 = [...channelsExcludeHistory, ...channels][1];

  const smsMessageWithNextStage = {
    ...signedSmsMessage,
    stage: signedSmsMessage.stage + myHexid().slice(0, numSymbolsToSave),
  };

  sendToDatachannel(closestChannelID, smsMessageWithNextStage);
  closestChannelID1 &&
    closestChannelID !== myHexid() &&
    sendToDatachannel(closestChannelID1, smsMessageWithNextStage);
};

//_ Send SMS fn
export const sendSMS = (sms: SMS) => {
  const encryptedContent = encryptFor(sms.to, sms.content);
  const signedSmsMessage = signMessage(smsToSmsMessage({ ...sms, content: encryptedContent }));
  sendSMSMessage(signedSmsMessage);
};

const smsToSmsMessage = (sms: SMS): SMSMessage => ({
  from: sms.from,
  to: sms.to,
  type: "SMS",
  datestamp: Date.now(),
  data: {
    type: sms.type,
    content: sms.content,
  },
});

const smsMessageToSms = (smsMessage: SMSMessage): SMS => ({
  from: smsMessage.from,
  to: smsMessage.to,
  type: smsMessage.data.type,
  content: smsMessage.data.content,
});

// streams
const smsStream = Stream<SMS>();
export const onSMSforAccount = smsStream.on;

const ownMessageStream = Stream<Message>();
export const onOwnMessage = ownMessageStream.on;

const ownIDFSMessageStream = Stream<SignedMessage>();
export const onOwnIDFSMessage = ownIDFSMessageStream.on;
