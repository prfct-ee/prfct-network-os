import React, { ChangeEvent, useCallback, useEffect, useState } from "react";
import { Widget } from "../../../components/Widget/Widget";
import { myHexid } from "prfct-network-engine";
import { emojiFromData } from "prfct-network-engine/utils/emoji";
import { onSocketMessage } from "prfct-network-engine/socket";
import { Message } from "prfct-network-engine/interfaces";
import { onDirectMessage } from "prfct-network-engine/webrtc";
import { NetworkStatusConnections } from "./NetworkStatusConnections";

const height = 300;
const rate = 1000;
const SILENCE_TIMEOUT = 5000;
const DISCONNECTION_TIMEOUT = 10000;

export interface Status {
  type: string;
  time: number;
  hash: string;
  height: number;
  isState?: boolean;
}
export interface Connection {
  statuses: Status[];
  lastMessageTime: number;
  isSilent?: boolean;
}
export type Connections = Record<string, Connection>;

let _connections: Connections = {};

const getWebRTCSymbol = (message: Message) => {
  const subType = message.data.subtype;
  if (subType) {
    switch (subType) {
      case "welcome":
        return "W";
      case "invite response":
        return "IR";
      case "ice candidate":
        return "IC";
      default:
        return subType[0];
    }
  }
  return message.type[0];
};
const getType = (message: Message) => {
  const type = message.type;
  switch (type) {
    case "STATUS":
      return { symbol: "S" };
    // case "STATE":
    //   return { symbol: emojiFromData(message.data), isState: true };
    case "ACTION":
      return { symbol: "A" };
    case "WEBRTC":
      return { symbol: getWebRTCSymbol(message) };
    default:
      return { symbol: type[0] };
  }
};

const getPosition = (time: number, currentTime: number, speed: number = 3) => {
  return ((currentTime - time) / rate) * (height / 60) * speed;
};

const getUpdatedConnectionsList = (message: Message) => {
  const type = getType(message);
  const time = new Date().getTime();
  if (!type) {
    return _connections;
  }
  return {
    ..._connections,
    [message.from]: {
      statuses: [
        {
          type: type.symbol,
          hash: message.to !== myHexid() ? message.to.slice(0, 4) : "",
          time: new Date().getTime(),
          isState: false, // type.isState,
          height: 0,
        },
        ...(_connections[message.from]?.statuses || []).slice(0, 100),
      ],
      lastMessageTime: time,
    },
  };
};

const getUpdatedConnections = (connections: Connections, speed: number): Connections => {
  const currentTime = new Date().getTime();
  return Object.keys(connections).reduce((filteredConnections: Connections, hash: string) => {
    const connection = connections[hash];
    if (!connection) {
      return filteredConnections;
    }
    const firstStatus = connection.statuses[0];
    if (firstStatus) {
      firstStatus.height = getPosition(firstStatus.time, currentTime, speed);
    }
    connection.isSilent = currentTime - connection.lastMessageTime > SILENCE_TIMEOUT;
    if (currentTime - connection.lastMessageTime < DISCONNECTION_TIMEOUT) {
      filteredConnections[hash] = connection;
    }
    return filteredConnections;
  }, {});
};

export const NetworkStatusWidget = () => {
  const [speed, setSpeed] = useState<number>(3);
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [connections, setConnections] = useState<Connections>({});

  const onSpeedChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSpeed(Number(event.target.value));
  }, []);
  const onPaused = useCallback(() => {
    setIsPaused(!isPaused);
  }, [setIsPaused, isPaused]);

  const onToggleVisibility = useCallback(() => {
    setIsVisible(!isVisible);
    setIsPaused(isVisible);
  }, [isVisible]);

  useEffect(() => {
    _connections = {};
    onSocketMessage((message: Message) => {
      _connections = getUpdatedConnectionsList(message);
    });
    onDirectMessage((message) => {
      _connections = getUpdatedConnectionsList(message.raw);
    });
  }, []);
  useEffect(() => {
    const statusInterval = setInterval(() => {
      if (isPaused) {
        return false;
      }
      _connections = getUpdatedConnections(_connections, speed);
      setConnections(_connections);
    }, 100);

    return () => clearInterval(statusInterval);
  }, [isPaused, speed]);

  return (
    <Widget>
      <div className="flex justify-between w-full">
        <div className="font-bold">Network Status</div>
        <button className="text-sm" onClick={onToggleVisibility}>
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
      {isVisible && (
        <>
          <div className="flex justify-between w-full">
            <div className="text-sm">
              Speed:
              <input
                type="number"
                className=" w-10 ml-2 pl-2 bg-slate-50"
                onChange={onSpeedChange}
                value={speed}
              />
            </div>
            <button className="text-sm" onClick={onPaused}>
              {isPaused ? "Play" : "Pause"}
            </button>
          </div>
          <div style={{ height: height * 3 }}>
            <div
              className="flex flex-row w-full p-3 overflow-x-scroll overflow-y-hidden h-auto"
              style={{ minHeight: `${height * 3}px` }}
            >
              {Object.keys(connections).map((hexid) => (
                <NetworkStatusConnections
                  key={hexid}
                  connection={connections[hexid]}
                  hexid={hexid}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </Widget>
  );
};
