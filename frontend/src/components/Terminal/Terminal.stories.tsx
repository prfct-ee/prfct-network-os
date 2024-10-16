import { FC } from "react";
import { Log } from "prfct-network-engine/logger/logger";
import { Terminal } from "./Terminal";

const logs: Log[] = [
  {
    date: new Date(),
    message: "message 1",
    type: "type 1",
  },
  {
    date: new Date(),
    message: "message 2",
    type: "type 1",
  },
  {
    date: new Date(),
    message:
      "long message long message long message long message long message long message long message ",
    type: "type 1",
  },
];
export const TerminalStory: FC = () => {
  return (
    <div>
      <Terminal logs={logs} />
      <br />
      <Terminal logs={logs} light={true} />
    </div>
  );
};

export default {
  title: "PRFCT UI",
};
