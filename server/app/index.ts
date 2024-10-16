import express from "express";
import { Socket, Server } from "socket.io";
import { md, pki } from "node-forge";

import { RateLimiterMemory } from "rate-limiter-flexible";

// Crypto
// Duplicate from frontend/src/crypto.ts
export const verifyMessage = (message: SignedMessage) => {
  const messageHash = md.md5
    .create()
    .update(JSON.stringify(message.raw))
    .digest()
    .toHex();
  return pki.ed25519.verify({
    message: messageHash,
    encoding: "utf8",
    signature: Buffer.from(message.signature, "hex"),
    publicKey: Buffer.from(message.raw.from, "hex"),
  });
};

// HTTP Server
const app = express();

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.listen(8080, () => {
  console.log(`Prfct entrance backend started ^_^`);
});

// Socket.IO Server
const io = new Server();

const rateLimiter = new RateLimiterMemory({
  points: 30,
  duration: 1,
});

const connections: Record<string, Socket> = {};

const broadcastStatus = () =>
  io.emit("status", { connections: Object.keys(connections) });

io.on("connection", (socket: Socket) => {
  let socketHexid: string;
  let heartbeatIndicator = true;

  const accountSid = "SSID";
  const authToken = "TOKEN";
  const client = require("twilio")(accountSid, authToken);
  client.tokens.create().then((token: any) => socket.emit("webrtc-ice", token));

  socket.on("message", async (message: SignedMessage) => {
    rateLimiter.consume(socketHexid || socket.id, 1).then(() => {
      if (!verifyMessage(message)) return;

      heartbeatIndicator = true;
      if (message.raw.to === "gate") {
        switch (message.raw.type) {
          case "LOGIN":
            socketHexid = message.raw.from;
            connections[message.raw.from] = socket;
            broadcastStatus();
            break;
        }
        return;
      }
      if (connections[message.raw.to] && message.raw.type === "WEBRTC") {
        connections[message.raw.to].emit("message", message);
      }
    });
  });

  socket.on("disconnect", () => {
    delete connections[socketHexid];
    broadcastStatus();
  });

  const timer = setInterval(() => {
    if (heartbeatIndicator) {
      heartbeatIndicator = false;
    } else {
      socket.disconnect();
      clearInterval(timer);
    }
  }, 60 * 1000);
});

io.listen(8070);

// Intrfaces
// Duplicate from frontend/src/crypto.ts
export interface SignedMessage {
  raw: Message;
  signature: string;
}
// Duplicate from frontend/src/crypto.ts
export interface Message<T = any> {
  from: string;
  to: string;
  type: string;
  ttr: number;
  data?: T;
}
