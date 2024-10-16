import { Connections, Status } from "../types/connectionsTypes";
import { DISCONNECTION_TIMEOUT, SILENCE_TIMEOUT } from "../constants/connectionConstants";
import { ReactNode } from "react";

export const getUpdatedConnectionsListAndNewStatus = (
  symbol: ReactNode,
  messageFrom: string,
  connections: Connections,
  uniqKey?: string,
  isMine?: boolean,
  maxItemsInLine: number = 10
): { newStatus?: Status; connections: Connections } => {
  const time = new Date().getTime();
  if (!symbol) {
    return { connections };
  }
  const newStatus = {
    symbol,
    uniqKey: uniqKey || `${messageFrom}-${time}`,
    time,
  };

  const currentAuthorStatuses = [
    newStatus,
    ...(connections[messageFrom]?.statuses || []).slice(0, maxItemsInLine),
  ];

  return {
    newStatus,
    connections: {
      ...connections,
      [messageFrom]: {
        statuses: currentAuthorStatuses,
        lastMessageTime: time,
        isMine,
      },
    },
  };
};

export const filterSilentConnections = (connections: Connections): Connections => {
  const currentTime = new Date().getTime();
  return Object.keys(connections).reduce((filteredConnections: Connections, hash: string) => {
    const connection = connections[hash];
    connection.isSilent = currentTime - connection.lastMessageTime > SILENCE_TIMEOUT;
    if (currentTime - connection.lastMessageTime < DISCONNECTION_TIMEOUT) {
      filteredConnections[hash] = connection;
    }
    return filteredConnections;
  }, {});
};

export const filterTempConnections = (
  connections: Connections,
  permanentList: string[] = []
): Connections => {
  const currentTime = new Date().getTime();
  return Object.keys(connections).reduce((filteredConnections: Connections, hash: string) => {
    const connection = connections[hash];
    const isPermanent = permanentList.includes(hash) || connection.isMine;
    connection.isSilent = !isPermanent;
    if (isPermanent || currentTime - connection.lastMessageTime < DISCONNECTION_TIMEOUT) {
      filteredConnections[hash] = connection;
    }
    return filteredConnections;
  }, {});
};

export const filterShownStatus = (connections: Connections, hexId: string, time: number) => {
  const connectionList = { ...connections };
  const connection = connectionList[hexId];
  if (connection) {
    connectionList[hexId].statuses = connection.statuses.filter((status) => status.time !== time);
  }
  return connectionList;
};
