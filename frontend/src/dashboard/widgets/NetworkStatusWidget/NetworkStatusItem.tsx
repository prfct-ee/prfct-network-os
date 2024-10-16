import React from "react";
import { Status } from "./NetworkStatusWidget";

interface INetworkStatusItem {
  status: Status;
  currentHeight: number;
}
export const NetworkStatusItem = React.memo(({ status, currentHeight }: INetworkStatusItem) => {
  return (
    <div className="relative" style={{ height: `${currentHeight}px` }}>
      <span
        className={`px-1 text-xs text-center absolute w-full bottom-0 ${
          status.isState ? "right-2" : "left-2"
        }`}
      >
        <span className="relative">
          {status.type}
          <span className="absolute">{status.hash}</span>
        </span>
      </span>
    </div>
  );
});
