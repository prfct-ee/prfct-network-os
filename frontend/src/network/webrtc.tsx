import { stepDuration } from "./consensus/constants";
import { getHexPosition, myHexid, verifyMessage } from "./crypto/crypto";
import { Stream } from "./EventEmitter/EventEmitter";
import { saveToDB } from "./idfs/idfsDB";
import { Message, SignedMessage } from "./interfaces";
import { _log } from "./logger/logger";
import { connectWith, isHexidIgnored, sendMessage } from "./network";

//_ Apply WebRTC technical message fn
export const applyWebRTCMessage = (message: Message) => {
  if (message.type === "WEBRTC") {
    message.data.subtype !== "ice candidate" &&
      _log("webrtc", `get webrtc message ${message.data.subtype} from ${message.from.slice(0, 6)}`);

    if (isHexidIgnored(message.from) && ["welcome", "invite"].includes(message.data.subtype))
      return;

    switch (message.data.subtype) {
      case "welcome":
        if (getHexPosition(myHexid()) < getHexPosition(message.from)) connectWith(message.from);
        break;
      case "invite":
        webrtcApplyInvite(message.from, message.data.description);
        break;
      case "invite response":
        webrtcApplyInviteResponse(message.from, message.data.description);
        break;
      case "ice candidate":
        webtrcApplyIceCandidate(message.from, message.data.candidate);
        break;

      default:
        break;
    }
  }
};

//
// WebRTC Connection Init
//
const connections: Record<string, RTCPeerConnection> = {};
const dataChannels: Record<string, RTCDataChannel> = {};

const recievedMessagesStamp: number[] = [];

const addDataChannel = (hexid: string, dataChannel: RTCDataChannel) => {
  dataChannels[hexid] = dataChannel;

  dataChannel.onmessage = (messageEvent) => {
    try {
      const signedMessage = JSON.parse(messageEvent.data) as SignedMessage;
      if (!verifyMessage(signedMessage)) {
        console.warn("signature verification failed");
        _log("webrtc", `verification failed`);
        return;
      }

      signedMessageStream.emit(signedMessage);

      if (signedMessage.raw.type === "IDFS") {
        saveToDB(signedMessage.raw.data);
        return;
      }

      if (signedMessage.raw.type === "SMS") {
        if (recievedMessagesStamp.includes(signedMessage.raw.datestamp)) return;
        recievedMessagesStamp.push(signedMessage.raw.datestamp);

        smsMessageStream.emit(signedMessage);
        signedMessage.raw.data.type !== "SMS_PING" &&
          _log("webrtc", `get sms ` + signedMessage.raw.data.type);
        return;
      }

      if (signedMessage.raw.to === myHexid()) {
        directMessageStream.emit(signedMessage);
      } else {
        sendToDatachannel(signedMessage.raw.to, signedMessage);
      }

      if (signedMessage.raw.type !== "WEBRTC") {
        heartbeat(hexid);
      }
    } catch (error) {
      _log("webrtc", `💥 error - parse message from ${hexid.slice(0, 6)} ` + error);
      // console.log("💥 error", messageEvent);
      return;
    }
  };

  dataChannel.onclose = () => {
    _log("webrtc", `Event: dataChannel.onclose ${hexid.slice(0, 6)}`);
    destroy(hexid);
  };
  dataChannel.onerror = () => {
    _log("webrtc", `Event: dataChannel.onerror ${hexid.slice(0, 6)}`);
    destroy(hexid);
  };

  dataChannelStream.emit(Object.keys(dataChannels));
};

export const destroy = (hexid: string) => {
  if (dataChannels[hexid]) {
    dataChannels[hexid].close();
    dataChannels[hexid].onmessage = null;
    delete dataChannels[hexid];
    _log("webrtc", `Data Channel ⚡️ closed with ${hexid.slice(0, 6)}`);
    dataChannelStream.emit(Object.keys(dataChannels));
    connectionDestroyedStream.emit(hexid);
  }

  if (connections[hexid]) {
    connections[hexid].close();
    connections[hexid].onicecandidate = null;
    delete connections[hexid];
    _log("webrtc", `Connection ⭕️ closed with ${hexid.slice(0, 6)}`);
    connectionStream.emit(Object.keys(connections));
    connectionDestroyedStream.emit(hexid);
  }
};

(window as any).destroy = destroy;

const createConnetion = (hexid: string) => {
  if (connections[hexid]) destroy(hexid);
  const webrtcToken = getWebrtcToken();

  const connection = new RTCPeerConnection(webrtcToken as RTCConfiguration);
  connection.onicecandidate = onIceCandidate(hexid);
  connections[hexid] = connection;
  connectionStream.emit(Object.keys(connections));

  heartbeat(hexid);
  return connection;
};

//_ Direct connect by WebRTC
// async Approved
export const directConnectWith = async (hexid: string) => {
  const connection = createConnetion(hexid);
  const dataChannel = connection.createDataChannel("sendDataChannel");
  dataChannel.onopen = () => {
    _log("webrtc", `👻 data channel open with  ${hexid.slice(0, 6)}`);
    addDataChannel(hexid, dataChannel);
  };

  const description = await connection.createOffer();
  connection.setLocalDescription(description);

  _log("webrtc", `invite created for ${hexid.slice(0, 6)}`);
  sendMessage(hexid, "WEBRTC", { subtype: "invite", description });
};

//_ Apply WebRTC Invite fn
// async Approved
const webrtcApplyInvite = async (hexid: string, description: RTCSessionDescriptionInit) => {
  _log("webrtc", `apply invite from ${hexid.slice(0, 6)}. description.type - ${description.type}`);

  const connection = createConnetion(hexid);
  connection.ondatachannel = (event) => {
    const dataChannel = event.channel;
    addDataChannel(hexid, dataChannel);
    _log("webrtc", `👻 data channel open by invite with  ${hexid.slice(0, 6)}`);
  };

  connection.setRemoteDescription(description);
  const answer = await connection.createAnswer();
  connection.setLocalDescription(answer);

  sendMessage(hexid, "WEBRTC", { subtype: "invite response", description: answer });
};

//_ Apply Invite response fn
const webrtcApplyInviteResponse = (hexid: string, description: RTCSessionDescriptionInit) => {
  if (connections[hexid]) {
    connections[hexid].setRemoteDescription(description);
  }
};

//_ On Ice Candidate fn
const onIceCandidate = (hexid: string) => (event: RTCPeerConnectionIceEvent) => {
  if (event.candidate) {
    sendMessage(hexid, "WEBRTC", {
      subtype: "ice candidate",
      candidate: event.candidate,
    });
  }
};

//_ Apply Ice Candidate fn
const webtrcApplyIceCandidate = (hexid: string, candidate: RTCIceCandidate) => {
  if (connections[hexid]?.remoteDescription?.type) {
    connections[hexid].addIceCandidate(candidate);
  }
};

//
// Heartbeat
//
const hearts: Record<string, boolean> = {};
const heartbeat = (hexid: string) => {
  hearts[hexid] = true;
};

setInterval(() => {
  Object.keys(hearts).forEach((hexid) => {
    if (hearts[hexid]) {
      hearts[hexid] = false;
    } else if (connections[hexid]) {
      if (process.env.NODE_ENV != "development") {
        destroy(hexid);
        delete hearts[hexid];
      }
      _log("webrtc", `heart attack 💔 ${hexid.slice(0, 6)}`);
    } else {
      delete hearts[hexid];
    }
  });
}, stepDuration * 2);

export const sendToDatachannel = (hexid: string, message: SignedMessage) => {
  // message.raw.data.type === "SMS_TEXT" && console.log("<-", message);
  const datachannel = dataChannels[hexid];
  if (datachannel && datachannel.readyState === "open") {
    datachannel.send(JSON.stringify(message));
    return true;
  } else {
    return false;
  }
};

let webRTCToken: RTCConfiguration | null = null;
export const setWebRTCToken = (token: RTCConfiguration) => (webRTCToken = token);
const getWebrtcToken = () => webRTCToken;

export const resetNetwork = () => Object.keys(connections).forEach((hexid) => destroy(hexid));

// events

const directMessageStream = Stream<SignedMessage>();
export const onDirectMessage = directMessageStream.on;

const connectionStream = Stream<string[]>();
export const onConnectionsUpdate = connectionStream.on;

const smsMessageStream = Stream<SignedMessage>();
export const onNewSmsMessage = smsMessageStream.on;

const dataChannelStream = Stream<string[]>();
export const onDatachannel = dataChannelStream.on;

const connectionDestroyedStream = Stream<string>();
export const onConnectionDestroyed = connectionDestroyedStream.on;

const signedMessageStream = Stream<SignedMessage>();
export const onSignedMessage = signedMessageStream.on;
