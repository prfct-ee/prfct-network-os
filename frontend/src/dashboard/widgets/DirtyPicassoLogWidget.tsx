import { Log, onLogs } from "prfct-network-engine/logger/logger";
import { useEffect, useState } from "react";
import { Terminal } from "../../components/Terminal/Terminal";
import { Widget } from "../../components/Widget/Widget";

export const DirtyPicassoLogWidget = () => {
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    onLogs("d_pixel", (_logs) => setLogs(_logs));
  }, []);
  return (
    <Widget>
      <div className="font-bold "> Dirty Picasso Logs</div>
      <Terminal logs={logs} light={true} />
    </Widget>
  );
};
