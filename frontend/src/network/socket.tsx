import { io } from "socket.io-client";
import { signMessage, verifyMessage } from "./crypto/crypto";
import { Stream } from "./EventEmitter/EventEmitter";
import { GateStatusMessage, Message, SignedMessage } from "./interfaces";
import { _log } from "./logger/logger";
import { makeMessage } from "./network";
import { applyWebRTCMessage, setWebRTCToken } from "./webrtc";

export const localhost =
  process.env.NODE_ENV === "development" ? "http://localhost" : "https://prfct.ee";
// const localhost = "https://prfct.ee";

const socket = io(localhost, {
  autoConnect: false,
  reconnection: false,
});

socket.on("connect", () => {
  sendSocketMessage(signMessage(makeMessage("gate", "LOGIN")));
  socketConnectionStream.emit(true);
});

socket.on("disconnect", () => {
  socketConnectionStream.emit(false);
});

socket.on("webrtc-ice", (token: any) => setWebRTCToken(token));

socket.on("status", (status: GateStatusMessage) => {
  socketStatusStream.emit(status);
  _log("gate", `status: [${status.connections.map((hexid) => hexid.slice(0, 6)).join(", ")}]`);
});

socket.on("message", (message: SignedMessage) => {
  if (!verifyMessage(message)) return;

  socketMessagesStream.emit(message.raw);

  if (message.raw.type === "WEBRTC") {
    applyWebRTCMessage(message.raw);
  }

  _log(
    "gate",
    `get message: ${message.raw.from.slice(0, 6)} -> ${message.raw.to.slice(0, 6)} | ${
      message.raw.type
    }`
  );
});

export const socketConnect = () => socket.connect();
export const socketDisconnect = () => socket.disconnect();
export const isSocketConnected = () => socket.connected;

export const sendSocketMessage = (signedMessage: SignedMessage) => {
  socket.emit("message", signedMessage);
  ownSocketStream.emit(signedMessage);
  if (signedMessage.raw.type === "WEBRTC")
    _log("webrtc", `send socket webrtc message to ${signedMessage.raw.to.slice(0, 6)}`);

  _log(
    "gate",
    `send message: to - ${signedMessage.raw.to.slice(0, 6)}, type - ${signedMessage.raw.type}`
  );
};

// events

const socketConnectionStream = Stream<boolean>();
export const onSocketConnection = socketConnectionStream.on;

const socketStatusStream = Stream<GateStatusMessage>();
export const onSocketStatus = socketStatusStream.on;

const socketMessagesStream = Stream<Message>();
export const onSocketMessage = socketMessagesStream.on;

const ownSocketStream = Stream<SignedMessage>();
export const onOwnSocketMessage = ownSocketStream.on;
