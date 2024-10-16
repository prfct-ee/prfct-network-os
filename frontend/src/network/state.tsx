import { useState } from "react";
import { EventEmitter } from "./EventEmitter/EventEmitter";

export interface NetworkState {
  isGateConnected: boolean;
  myhexid: string;
  gatePeers: string[];
  peers: string[];
  candidates: string[];
  peersChildren: Record<string, string[]>;
}

const initialState: NetworkState = {
  myhexid: "",
  isGateConnected: false,
  gatePeers: [],
  peers: [],
  candidates: [],
  peersChildren: {},
};

export const { subscribe, eventEmitter, getState } = EventEmitter<NetworkState>(initialState);
