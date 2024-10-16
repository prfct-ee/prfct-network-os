import React, { useCallback, useEffect, useState } from "react";
import { Widget } from "../../components/Widget/Widget";
import { Message } from "prfct-network-engine/interfaces";
import { ActionMatrix } from "../../components/ActionMatrix/ActionMatrix";
import { Connections } from "../types/connectionsTypes";
import {
  filterShownStatus,
  filterSilentConnections,
  getUpdatedConnectionsListAndNewStatus,
} from "../utils/connectionsUtils";
import { CHECK_CONNECTION_TIMEOUT, SHOWING_TIMEOUT } from "../constants/connectionConstants";
import { getWebRTCSymbol } from "../utils/getWebRTCSymbol";
import { myHexid } from "prfct-network-engine";
import { onSignedMessage } from "prfct-network-engine/webrtc";

let _connections: Connections = {};

const ProxyWebRTCItem = ({ message }: { message: Message }) => (
  <span className="flex items-baseline">
    <span>{getWebRTCSymbol(message)}</span>
    <span className="pl-2 font-normal text-sm">{message.to.slice(0, 6)}</span>
  </span>
);
export const ProxyWebRTCWidget = () => {
  const [connections, setConnections] = useState<Connections>({});
  const removeMessage = useCallback((hexId: string, time: number) => {
    _connections = filterShownStatus(_connections, hexId, time);
    setConnections(_connections);
  }, []);
  const addNewMessage = useCallback((message: Message) => {
    if (message.type === "WEBRTC") {
      const { newStatus, connections } = getUpdatedConnectionsListAndNewStatus(
        <ProxyWebRTCItem message={message} />,
        message.from,
        _connections
      );
      if (newStatus) {
        setTimeout(() => removeMessage(message.from, newStatus.time), SHOWING_TIMEOUT);
      }
      _connections = connections;
      setConnections(_connections);
    }
  }, []);

  useEffect(() => {
    onSignedMessage((message) => {
      const rawMessage = message?.raw;
      if (rawMessage && rawMessage.to !== myHexid()) {
        addNewMessage(rawMessage);
      }
    });
  }, []);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      _connections = filterSilentConnections(_connections);
      setConnections(_connections);
    }, CHECK_CONNECTION_TIMEOUT);

    return () => clearInterval(statusInterval);
  }, []);

  return (
    <Widget widgetName="Proxy WebRTC messages">
      <div className="flex flex-col w-full py-3">
        <div className="py-2">
          {Object.keys(connections).length > 0 ? (
            <ActionMatrix connections={connections} isVertical={true} className="font-bold" />
          ) : (
            <div className="pb-3">- no messages</div>
          )}
        </div>
        <div className="flex flex-col text-sm leading-none">
          <span className="first-letter:font-bold">w - welcome</span>
          <span className="first-letter:font-bold">i - invite</span>
          <span className="first-letter:font-bold">r - invite response</span>
          <span className="first-letter:font-bold">c - ice candidate</span>
        </div>
      </div>
    </Widget>
  );
};
