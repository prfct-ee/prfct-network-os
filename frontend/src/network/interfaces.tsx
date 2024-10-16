import { Router, StateElement } from "./idfs/IDFS";

export interface ColdMessagesStorage {
  [authorID: string]: {
    finalHexid: string;
    scores: number;
  };
}

export interface Block {
  scores: number;
  data: BlockData;
}

export interface StateElementWithPath {
  element?: StateElement;
  path: Router[];
}

export interface BlockData {
  block: number;
  actions: string[];
  initial: string;
  final: string;
  author: string;
  wallet?: StateElementWithPath;
}

export interface BlockActions {
  [authorHexid: string]: Action;
}

export interface ColdMessageSource {
  rootRouter: Router;
}

export interface ColdMessage extends ColdMessageSource {
  author: string;
  wallet?: StateElementWithPath;
}

export interface Action {
  from: string;
  type: string;
  ttr: number; // time to run
  data: any;
}

export interface ActionContainer {
  action: Action;
  affectedElements: StateElement[];
  affectedRoutes: Router[];
}

export interface Actions {
  [blockNum: number]: {
    [authorHexid: string]: Action;
  };
}

export interface State {
  version: number;
  blockNumber: number;
  rootRouter: string | undefined;
}

export interface States {
  [blockNum: number]: {
    [hash: string]: StateCandidate;
  };
}

export interface StateCandidate {
  votes: string[];
  state: State;
}

export type SMSTypes =
  | "SMS_TEXT"
  | "SMS_NEW_GROUP_USER"
  | "SMS_PING"
  | "SMS_JOIN_GROUP"
  | "SMS_LEAVE_GROUP"
  | "SMS_CONFIRM"
  | "SMS_GROUP_STATUS"
  | "SMS_JOIN_PRIVATE";

export interface SMS {
  from: string;
  to: string;
  type: SMSTypes;
  content: any;
}

// Duplicate from server/index.ts
export interface SignedMessage {
  raw: Message;
  signature: string;
  stage: string;
}

export type MessageType =
  | "WEBRTC"
  | "STATUS"
  | "BLOCK"
  | "ACTION"
  | "SMS"
  | "LOGIN"
  | "PING"
  | "COLD_MESSAGE"
  | "IDFS";
// Duplicate from server/index.ts
export interface Message<T = any> {
  from: string;
  to: string;
  type: MessageType;
  data: T;
  datestamp: number;
}

export interface GateStatusMessage {
  connections: string[];
}

export interface Key {
  privateKey: string;
  publicKey: string;
}

export interface SMSData {
  type: SMSTypes;
  content: any;
}

export type SMSMessage = Message<SMSData>;
