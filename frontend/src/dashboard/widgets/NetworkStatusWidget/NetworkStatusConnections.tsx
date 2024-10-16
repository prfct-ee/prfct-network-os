import React from "react";
import { Connection } from "./NetworkStatusWidget";
import { NetworkStatusItem } from "./NetworkStatusItem";

interface INetworkStatusItem {
  connection: Connection;
  hexid: string;
}
export const NetworkStatusConnections = ({ hexid, connection }: INetworkStatusItem) => {
  return (
    <div>
      <div
        className={`text-sm text-center rotate-90 py-4 w-12 ${
          connection.isSilent ? "text-gray-500 " : "font-bold"
        }`}
      >
        {hexid.slice(0, 6)}
      </div>
      <div className="flex flex-col border-t-2 relative h-full pt-3">
        <div className="h-full m-auto border-r-2 p-3 absolute" />
        {connection.statuses?.map((status) => (
          <NetworkStatusItem key={status.time} status={status} currentHeight={status.height} />
        ))}
      </div>
    </div>
  );
};
