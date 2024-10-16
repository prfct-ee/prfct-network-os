import React from "react";
import { Widget } from "../../../components/Widget/Widget";
import { resetAccount } from "prfct-network-engine";
import { usePrfctState } from "../../../hooks";
import { connectWith } from "prfct-network-engine/network";
import { UserInfoNode } from "./UserInfoNode";
import { UserInfoPeersTree } from "./UserInfoPeersTree";

const connectWithClient = (hexid: string) => () => {
  connectWith(hexid);
};

export const UserInfoWidget = () => {
  const state = usePrfctState();

  return (
    <Widget widgetName="Live status | This browser node">
      <div className="flex flex-col w-full py-2">
        <div className="pt-1">
          <span className="font-bold">P2P connection: </span>
          {state.peers.length > 0 ? (
            <span className="text-green-600">online</span>
          ) : (
            <span className="text-red-600">offline</span>
          )}
        </div>
        <div>
          <span className="font-bold">Client HexID:</span>
          {" " + state.myhexid.slice(0, 6)}

          <span
            className="text-lg cursor-pointer text-slate-500"
            title="Refresh HexID"
            onClick={resetAccount}
          >
            {" ↻"}
          </span>
        </div>
        <div className="pt-1 text-[10px] break-words">{state.myhexid}</div>
        <div className="pt-1">
          <span className="font-bold">Gate server status: </span>
          {state.isGateConnected ? (
            <span className="text-slate-400">online</span>
          ) : (
            <span className="text-green-600">all offline</span>
          )}
        </div>
        <div className="pt-1">
          <span className="font-bold">Gate nodes: </span>
          <div>
            {state.gatePeers.length > 0 ? (
              state.gatePeers.map((id) => (
                <UserInfoNode id={id} onClick={connectWithClient(id)} key={id} />
              ))
            ) : (
              <span>- no connections</span>
            )}
          </div>
        </div>
        <div className="pt-1">
          <span className="font-bold">Connection candidates: </span>
          <div>
            {state.candidates.length > 0 ? (
              state.candidates.map((id) => <UserInfoNode id={id} key={id} />)
            ) : (
              <span>- no connections</span>
            )}
          </div>
        </div>
        <div className="pt-1">
          <span className="font-bold">Connected nodes: </span>
          <div title="disconnect">
            {state.peers.length > 0 ? (
              <UserInfoPeersTree peers={state.peers} />
            ) : (
              <span>- no connections</span>
            )}
          </div>
        </div>
      </div>
    </Widget>
  );
};
