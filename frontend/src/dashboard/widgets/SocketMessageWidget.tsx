import React, { useEffect, useState } from "react";
import { Widget } from "../../components/Widget/Widget";
import { Message, MessageType } from "prfct-network-engine/interfaces";
import { onOwnSocketMessage, onSocketMessage } from "prfct-network-engine/socket";
import { usePrfctState } from "../../hooks";

interface SocketMessage {
  timeout: number;
  milliseconds: number;
  from: string;
  type: MessageType;
  subtype: string;
  to: string;
  isMine: boolean;
}

let _socketMessages: SocketMessage[] = [];

export const SocketMessageWidget = () => {
  const state = usePrfctState();
  const [socketMessages, setSocketMessages] = useState<SocketMessage[]>([]);

  useEffect(() => {
    const addMessage = (message: Message, isMine: boolean) => {
      if (message) {
        _socketMessages = [
          {
            timeout: new Date().getTime(),
            milliseconds: new Date().getMilliseconds(),
            from: message.from.slice(0, 6),
            to: message.to.slice(0, 6),
            type: message.type,
            subtype: message.data?.subtype,
            isMine,
          },
          ..._socketMessages,
        ].slice(0, 20);
        setSocketMessages(_socketMessages);
      }
    };
    onSocketMessage((message) => addMessage(message, false));
    onOwnSocketMessage((message) => addMessage(message.raw, true));
  }, []);

  return (
    <Widget widgetName="Gate server messages log">
      <div className="flex flex-col w-full py-3 h-full max-h-[340px]">
        Status:{" "}
        {state.isGateConnected ? (
          <span className="text-slate-400">Connected to Gate via sockets</span>
        ) : (
          <span className="text-green-600">No centralised connections</span>
        )}
        <div className="py-2">
          {socketMessages.length > 0 ? (
            socketMessages.map((item, i) => (
              <div className="flex pb-1 text-[12px]" key={i}>
                <span className="text-gray-500 pr-3 w-[36px] text-right">
                  {item.milliseconds || 0}
                </span>
                <span>{`${item.isMine ? item.to : item.from} ${item.isMine ? "⬆" : "⬇"} ${
                  item.type
                } ${item.subtype ? `(${item.subtype})` : ""}`}</span>
              </div>
            ))
          ) : (
            <span>- no messages</span>
          )}
        </div>
      </div>
    </Widget>
  );
};
