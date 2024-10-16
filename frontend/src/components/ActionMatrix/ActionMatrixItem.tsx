import React, { FC } from "react";
import "./ActionMatrix.scss";
import { Status } from "../../dashboard/types/connectionsTypes";
import { HIDING_SHIFT, SHOWING_TIMEOUT } from "../../dashboard/constants/connectionConstants";

interface BlockWatcherItemProps {
  hexId: string;
  status: Status;
  className: string;
  messageTimeout?: number;
}

export const ActionMatrixItem: FC<BlockWatcherItemProps> = ({
  status,
  hexId,
  className,
  messageTimeout,
}) => {
  return (
    <div
      className="absolute font-bold"
      style={{
        animation: `${
          (messageTimeout || SHOWING_TIMEOUT) + HIDING_SHIFT
        }ms linear 0s 1 ${className}`,
      }}
      key={`${hexId}-${status.time}`}
    >
      {status.symbol}
    </div>
  );
};
