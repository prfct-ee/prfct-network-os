import { Log, onLogs } from "prfct-network-engine/logger/logger";
import { FC, useEffect, useState } from "react";
import { Terminal } from "../../components/Terminal/Terminal";
import { Widget } from "../../components/Widget/Widget";

export const GateLogsWidget: FC = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  useEffect(() => {
    onLogs("gate", (_logs) => setLogs(_logs));
  }, []);
  return (
    <Widget className="border-black">
      <div className="font-bold ">Gate Logs</div>
      <Terminal logs={logs} light={true} />
    </Widget>
  );
};
