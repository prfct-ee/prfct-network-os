import { ReactNode } from "react";

export interface Status {
  symbol: ReactNode;
  time: number;
  uniqKey: string;
}
export interface Connection {
  statuses: Status[];
  lastMessageTime: number;
  isSilent?: boolean;
  isMine?: boolean;
}
export type Connections = Record<string, Connection>;
