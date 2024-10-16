import { resetAccount } from "prfct-network-engine";
import { emojiFromData } from "prfct-network-engine/utils/emoji";
// import { onMagicStateCandidate } from "prfct-network-engine/magic";
import { addToIgnoreList, connectWith, maxPeers } from "prfct-network-engine/network";
import { destroy } from "prfct-network-engine/webrtc";
import { useCallback, useEffect, useState } from "react";
import { Code } from "../../components/Code/Code";
import { Widget } from "../../components/Widget/Widget";
import { usePrfctState } from "../../hooks";

type Pings = Record<string, string[]>;
const _pings: Pings = {};
let _stateEmoji: string[] = [];

const onClickIgnore = (hexid: string) => () => {
  addToIgnoreList(hexid);
  destroy(hexid);
};

export const ClientStatusWidget = () => {
  const [pings, setPings] = useState<Pings>({});

  const state = usePrfctState();

  useEffect(() => {
    // onMagicState((state) => {
    //   const emoji = emojiFromData(state);
    //   _stateEmoji.unshift(emoji);
    //   _stateEmoji = _stateEmoji.slice(0, 7);
    // });
    // onMagicStateCandidate((candidates) => {
    //   candidates.map((candidate) => {
    //     const emoji = emojiFromData(candidate.state);
    //     candidate.votes.map((hexid) => {
    //       if (!_pings[hexid]) _pings[hexid] = [];
    //       _pings[hexid].unshift(emoji);
    //       _pings[hexid] = _pings[hexid].slice(0, 6);
    //     });
    //   });
    //   setPings({ ..._pings });
    // });
  }, []);

  const connectWithClient = useCallback(
    (hexid: string) => () => {
      connectWith(hexid);
    },
    []
  );

  return (
    <Widget className="border-black ">
      <div className="font-bold ">Browser Node Status</div>
      <div>
        HexID:
        <span className="font-bold"> {state.myhexid.slice(0, 6)}</span>{" "}
        <span className=" text-xs cursor-pointer" onClick={resetAccount}>
          🔻
        </span>
      </div>
      <span className="text-xs break-words">Full address: {state.myhexid}</span>

      <div>
        <div>Gate connection status: </div>
        {state.isGateConnected ? (
          <>
            <span className="text-green-600">●</span> online
          </>
        ) : (
          <>
            <span className="text-red-600">●</span> offline
          </>
        )}
      </div>
      <div className="font-bold ">Gate Server status:</div>
      <div>
        {state.gatePeers.length > 0
          ? state.gatePeers.map((id) => (
              <div className="inline-block mr-1 select-none " key={id}>
                <span onClick={connectWithClient(id)}>
                  <Code>{id.slice(0, 6)}</Code>
                </span>
              </div>
            ))
          : "- no connections"}
      </div>
      <div className="font-bold ">Statuses:</div>
      <div className="">
        {state.peers.sort().map((hexid, i) => (
          <div
            key={i}
            onClick={onClickIgnore(hexid)}
            className={`pr-2 cursor-pointer ${i >= maxPeers ? "text-gray-500" : ""} `}
          >
            <span className="pr-3 ">{hexid.slice(0, 6)}</span>
            {state.peersChildren[hexid]?.map((_hexid, a) => (
              <span key={a} className={`pr-2 ${a >= maxPeers ? "text-gray-500" : ""} text-xs`}>
                {_hexid.slice(0, 3)}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="font-bold ">P2P Candidates:</div>
      <div>
        {state.candidates.length === 0 && <span className="text-sm ">- no candidates</span>}
        {state.candidates.map((hexid, i) => (
          <div key={i}>
            <Code>{hexid.slice(0, 6)}</Code>
          </div>
        ))}
      </div>
    </Widget>
  );
};
