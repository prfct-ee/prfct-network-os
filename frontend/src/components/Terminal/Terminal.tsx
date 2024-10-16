import { FC } from "react";
import { Log } from "prfct-network-engine/logger/logger";

interface TerminalProps {
  logs: Log[];
  light?: boolean;
}

export const Terminal: FC<TerminalProps> = ({ logs, light = false }) => {
  return (
    <div
      className={
        "p-3 overflow-hidden max-h-[500px] " + (light ? "text-black " : "text-white bg-gray-900")
      }
    >
      {logs.length > 0
        ? logs.slice(0, 20).map((log, i) => (
            <div className="mb-1 text-[12px] leading-3" key={i}>
              <span className="text-[10px] text-gray-500">
                {log.date
                  .getMinutes()
                  .toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}
                :
                {log.date
                  .getSeconds()
                  .toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}
                .
                {log.date
                  .getMilliseconds()
                  .toLocaleString("en-US", { minimumIntegerDigits: 2, useGrouping: false })}
                {" » "}
              </span>
              {log.message}
            </div>
          ))
        : ">..."}
    </div>
  );
};
