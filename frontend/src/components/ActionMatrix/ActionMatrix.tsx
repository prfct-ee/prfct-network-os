import React, { FC } from "react";
import "./ActionMatrix.scss";
import { ActionMatrixItem } from "./ActionMatrixItem";
import { Connections } from "../../dashboard/types/connectionsTypes";

interface ActionMatrixProps {
  connections: Connections;
  isVertical?: boolean;
  className?: string;
  messageTimeout?: number;
}

export const ActionMatrix: FC<ActionMatrixProps> = ({
  connections,
  isVertical,
  className,
  messageTimeout,
}) => {
  return (
    <>
      {Object.entries(connections).map(([hexId, connection]) => (
        <div
          key={hexId}
          className={isVertical ? "inline-flex flex-col h-36 pb-2 pr-3" : "flex flex-row"}
        >
          <div
            className={`pr-2 
              ${connection.isSilent ? "text-gray-500" : ""} 
              ${connection.isMine ? "font-bold" : ""}
              ${className || ""}`}
          >
            {connection.isMine ? "__this" : hexId.slice(0, 6)}
          </div>
          <div
            className={`actionMatrixItemList flex relative ${
              isVertical ? "vertical h-full w-6" : "flex-row max-w-[251px]"
            }`}
          >
            {connection.statuses.map((status, i) => (
              <div key={i} className=" pr-3 routerAnimation">
                <span className=" font-bold ">{status.symbol}</span>|
                <span className=" text-xs text-slate-400">
                  {new Date(status.time).getSeconds()}
                </span>
              </div>
              // <ActionMatrixItem
              //   key={status.uniqKey}
              //   hexId={hexId}
              //   status={status}
              //   className={isVertical ? "slideFromTop" : "slideFromLeft"}
              //   messageTimeout={messageTimeout}
              // />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};
