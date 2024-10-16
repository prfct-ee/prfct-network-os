import React, { useCallback, useEffect, useState } from "react";
import { Widget } from "../../components/Widget/Widget";
import { onSocketMessage } from "prfct-network-engine/socket";
import { Message } from "prfct-network-engine/interfaces";
import { onSignedMessage } from "prfct-network-engine/webrtc";
import { ActionMatrix } from "../../components/ActionMatrix/ActionMatrix";
import { Connections } from "../types/connectionsTypes";
import {
  filterShownStatus,
  filterTempConnections,
  getUpdatedConnectionsListAndNewStatus,
} from "../utils/connectionsUtils";
import { CHECK_CONNECTION_TIMEOUT } from "../constants/connectionConstants";
import { getWebRTCSymbol } from "../utils/getWebRTCSymbol";
import { usePrfctState } from "../../hooks";
import { myHexid } from "prfct-network-engine";

const SHOWING_WEBRTC_TIMEOUT = 18000;

let _connections: Connections = {};

export const IncomingWebRTCWidget = () => {
  const state = usePrfctState();
  const [connections, setConnections] = useState<Connections>({});

  const removeMessage = useCallback(
    (hexId: string, time: number) => {
      _connections = filterShownStatus(_connections, hexId, time);
      setConnections(_connections);
    },
    [connections]
  );

  const addNewMessage = (message: Message) => {
    if (message.to === myHexid() && ["WEBRTC", "ACTION", "STATUS"].includes(message.type)) {
      const { newStatus, connections } = getUpdatedConnectionsListAndNewStatus(
        getWebRTCSymbol(message),
        message.from,
        _connections
      );
      if (newStatus) {
        setTimeout(() => removeMessage(message.from, newStatus.time), SHOWING_WEBRTC_TIMEOUT);
      }
      _connections = connections;
      setConnections(_connections);
    }
  };

  useEffect(() => {
    onSocketMessage(addNewMessage);
    onSignedMessage((message) => {
      addNewMessage(message.raw);
    });
  }, []);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      _connections = filterTempConnections(_connections, state.peers);
      setConnections(_connections);
    }, CHECK_CONNECTION_TIMEOUT);

    return () => clearInterval(statusInterval);
  }, [state.peers]);

  return (
    <Widget widgetName="Incoming WebRTC messages">
      <div className="flex flex-col w-full py-3">
        <div className="py-2">
          {Object.keys(connections).length > 0 ? (
            <ActionMatrix connections={connections} messageTimeout={SHOWING_WEBRTC_TIMEOUT} />
          ) : (
            <div className="pb-3">- no messages</div>
          )}
        </div>
        <div className="flex flex-col text-sm leading-none">
          <span className="first-letter:font-bold">s - status</span>
          <span className="first-letter:font-bold">w - welcome</span>
          <span className="first-letter:font-bold">i - invite</span>
          <span className="first-letter:font-bold">r - invite response</span>
          <span className="first-letter:font-bold">c - ice candidate</span>
          <span className="first-letter:font-bold">a - action</span>
        </div>
      </div>
    </Widget>
  );
};
