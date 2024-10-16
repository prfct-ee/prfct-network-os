import React, { FC } from "react";
import { usePrfctState } from "../../../hooks";
import { addToIgnoreList, maxPeers } from "prfct-network-engine/network";
import { destroy } from "prfct-network-engine/webrtc";

interface UserInfoPeersTreeProps {
  peers: string[];
}

const onClickIgnore = (hexid: string) => () => {
  addToIgnoreList(hexid);
  destroy(hexid);
};

export const UserInfoPeersTree: FC<UserInfoPeersTreeProps> = ({ peers }) => {
  const state = usePrfctState();

  return (
    <>
      {peers.sort().map((peerHexId, i) => (
        <div
          key={peerHexId}
          onClick={onClickIgnore(peerHexId)}
          className={`pr-2 cursor-pointer ${i >= maxPeers ? "text-gray-500" : ""} `}
        >
          <span className="pr-3 text-[14px]">{peerHexId.slice(0, 6)}</span>
          {state.peersChildren[peerHexId]?.map((childrenHexId, a) => (
            <span key={a} className={`pr-2 ${a >= maxPeers ? "text-gray-500" : ""} text-xs`}>
              {childrenHexId.slice(0, 3)}
            </span>
          ))}
        </div>
      ))}
    </>
  );
};
