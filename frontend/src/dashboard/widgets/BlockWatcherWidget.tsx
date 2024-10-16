import { myHexid } from "prfct-network-engine";
import {
  bestBlockStream,
  blockStream,
  coldMessagesStream,
} from "prfct-network-engine/consensus/consensus";
import { getRuneFromData } from "prfct-network-engine/utils/runes";
import { useCallback, useEffect, useState } from "react";
import { ActionMatrix } from "../../components/ActionMatrix/ActionMatrix";
import { Widget } from "../../components/Widget/Widget";
import { usePrfctState } from "../../hooks";
import { CHECK_CONNECTION_TIMEOUT } from "../constants/connectionConstants";
import { Connections } from "../types/connectionsTypes";
import {
  filterShownStatus,
  filterTempConnections,
  getUpdatedConnectionsListAndNewStatus,
} from "../utils/connectionsUtils";
import { onOwnMessage } from "../../network/network";
import { Router } from "../../network/idfs/IDFS";
import { getHashFromData } from "../../network/crypto/crypto";
import { BlockData } from "../../network/interfaces";

const SHOWING_TIMEOUT = 4000;
let _connections: Connections = {};
let _blockNumber: number = 0;

export const BlockWatcherWidget = () => {
  const prfctState = usePrfctState();
  const [connections, setConnections] = useState<Connections>({});

  const removeMessage = useCallback(
    (hexId: string, time: number) => {
      _connections = filterShownStatus(_connections, hexId, time);
      setConnections(_connections);
    },
    [connections]
  );

  const addNewMessage = (data: Router | BlockData, from: string, isColdMessage?: boolean) => {
    const dataHexId = getHashFromData(data);
    const symbol = getRuneFromData(dataHexId);
    const { newStatus, connections } = getUpdatedConnectionsListAndNewStatus(
      isColdMessage ? <span className="text-blue-700 text-xs">{symbol}</span> : symbol,
      from,
      _connections,
      `${from}-${dataHexId}-${new Date().getTime()}`,
      from === myHexid(),
      50
    );
    if (newStatus) {
      setTimeout(() => removeMessage(from, newStatus.time), SHOWING_TIMEOUT);
    }
    _connections = connections;
    setConnections(_connections);
  };

  useEffect(() => {
    onOwnMessage((message) => {
      const isColdMessage = message?.type === "COLD_MESSAGE";
      const isBlock = message?.type === "BLOCK";
      if (isColdMessage) {
        addNewMessage(message.data.rootRouter, myHexid(), true);
      }
      if (isBlock) {
        addNewMessage(message.data.data, myHexid());
      }
    });
    coldMessagesStream.on((coldMessageItem) => {
      if (coldMessageItem.from === myHexid()) return;
      addNewMessage(coldMessageItem.coldMessage.rootRouter, coldMessageItem.from, true);
    });
    blockStream.on((blockItem) => {
      if (blockItem.from === myHexid()) return;
      addNewMessage(blockItem.block.data, blockItem.from);
    });
    bestBlockStream.on((block) => {
      _blockNumber = block.data.block;
    });
  }, []);

  useEffect(() => {
    const statusInterval = setInterval(() => {
      _connections = filterTempConnections(_connections, prfctState.peers);
      setConnections(_connections);
    }, CHECK_CONNECTION_TIMEOUT);

    return () => clearInterval(statusInterval);
  }, [prfctState.peers]);

  return (
    <Widget widgetName="Block Watcher" className="mb-4">
      Incoming & Outcoming blocks and cold messages.
      <div className="flex flex-col w-full py-3">
        <div className="py-2">Block number: {_blockNumber}</div>
        {Object.keys(connections).length > 0 ? (
          <ActionMatrix connections={connections} messageTimeout={SHOWING_TIMEOUT} />
        ) : (
          <div className="pb-3">- no connections</div>
        )}
      </div>
    </Widget>
  );
};
