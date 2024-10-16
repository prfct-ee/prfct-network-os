import React, { useCallback, useEffect, useRef, useState } from "react";
import { Widget } from "../../components/Widget/Widget";
import { usePrfctState } from "../../hooks";
import { myHexid } from "../../network";
import { Message } from "../../network/interfaces";
import { getWebRTCSymbol } from "../utils/getWebRTCSymbol";
import { onOwnSocketMessage, onSocketMessage } from "../../network/socket";
import { onSignedMessage } from "../../network/webrtc";
import {
  ANIMATION_DURATION,
  createRadialTree,
  drawSymbolOnLine,
  SymbolOnLineData,
} from "../d3/radialTree";
import { onOwnMessage } from "../../network/network";

let _incomingSymbols: SymbolOnLineData[] = [];
let _outgoingSymbols: SymbolOnLineData[] = [];

export const ConnectionsTreeWidget = () => {
  const state = usePrfctState();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [outgoingSymbols, setOutgoingSymbols] = useState<SymbolOnLineData[]>([]);
  const [incomingSymbols, setIncomingSymbols] = useState<SymbolOnLineData[]>([]);

  const showMessage = useCallback(
    (
      message: Message,
      myHexId: string,
      pearHexId: string,
      color: string,
      isReverse: boolean,
      cashSymbol: (symbolData: SymbolOnLineData) => void
    ) => {
      if (myHexId === myHexid() && ["WEBRTC", "ACTION", "STATUS"].includes(message.type)) {
        const symbol = getWebRTCSymbol(message);
        const lineId = pearHexId.slice(0, 6);
        if (!wrapRef.current) return;
        const symbolData: SymbolOnLineData = {
          lineId,
          symbol,
          color,
          isReverse,
          timeout: new Date().getTime(),
        };
        drawSymbolOnLine(wrapRef.current, symbolData);

        cashSymbol(symbolData);
      }
    },
    [wrapRef]
  );

  const showReceivedMessage = useCallback(
    (message: Message) => {
      const cashReceivedSymbol = (symbolData: SymbolOnLineData) => {
        _incomingSymbols = [..._incomingSymbols, symbolData];
        setIncomingSymbols(_incomingSymbols);
      };
      showMessage(message, message.to, message.from, "#1D4ED8", true, cashReceivedSymbol);
    },
    [incomingSymbols]
  );

  const showSentMessage = useCallback(
    (message: Message) => {
      const cashSentSymbol = (symbolData: SymbolOnLineData) => {
        _outgoingSymbols = [..._outgoingSymbols, symbolData];
        setOutgoingSymbols(_outgoingSymbols);
      };
      showMessage(message, message.from, message.to, "#000", false, cashSentSymbol);
    },
    [outgoingSymbols]
  );

  useEffect(() => {
    onSocketMessage(showReceivedMessage);
    onSignedMessage((message) => {
      showReceivedMessage(message.raw);
    });
    onOwnMessage(showSentMessage);
    onOwnSocketMessage((message) => showSentMessage(message.raw));
  }, []);

  useEffect(() => {
    const peers = state.peers || [];
    const peersChildren = state.peersChildren || {};
    const connectionTree = {
      id: myHexid().slice(0, 6),
      main: true,
      children: peers.map((peerHexId) => ({
        id: peerHexId.slice(0, 6),
        children: peersChildren[peerHexId]?.map((children) => ({
          id: children.slice(0, 3),
        })),
      })),
    };

    wrapRef.current && createRadialTree(connectionTree, wrapRef.current);

    const currentTime = new Date().getTime();
    const isShownSymbol = (symbolData: SymbolOnLineData) =>
      currentTime + ANIMATION_DURATION > symbolData.timeout;

    const shownOutgoingSymbols = outgoingSymbols.filter(isShownSymbol);
    const shownIncomingSymbols = incomingSymbols.filter(isShownSymbol);

    [...shownOutgoingSymbols, ...shownIncomingSymbols].forEach((symbolData) => {
      const wentPart = 1 / (ANIMATION_DURATION / (currentTime - symbolData.timeout));
      wrapRef.current && drawSymbolOnLine(wrapRef.current, { ...symbolData, wentPart });
    });

    setOutgoingSymbols(shownOutgoingSymbols);
    setIncomingSymbols(shownIncomingSymbols);
  }, [state.peers, state.peersChildren]);

  return (
    <Widget widgetName="Connections tree">
      Visualization of peer-to-peer connections and transfer of actions (transactions).
      <div className="flex flex-col w-full d3-tree" ref={wrapRef}></div>
    </Widget>
  );
};
