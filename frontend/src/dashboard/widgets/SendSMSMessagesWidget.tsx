import { Widget } from "../../components/Widget/Widget";
import React, { useCallback, useRef, useState } from "react";
import { SMS } from "prfct-network-engine/interfaces";
import { myHexid, sendSMS } from "prfct-network-engine";
import { generateKey } from "prfct-network-engine/crypto/crypto";

interface SentSMSData {
  smsHexId: string;
  to: string;
  text: string;
}

export const SendSMSMessagesWidget = () => {
  const [sentSMS, setSentSMS] = useState<SentSMSData[]>([]);
  const hexIdInputEl = useRef<HTMLInputElement>(null);
  const messageTextareaEl = useRef<HTMLTextAreaElement>(null);

  const sendMessage = useCallback(() => {
    const to = hexIdInputEl.current?.value;
    const text = messageTextareaEl.current?.value;
    if (!to || !text) {
      return;
    }
    const smsHexId = generateKey().publicKey;
    const smsMessage = {
      from: myHexid(),
      to,
      content: JSON.stringify({ text }),
      type: "SMS_TEXT",
    } as SMS;
    sendSMS(smsMessage);
    setSentSMS([{ to, text, smsHexId }, ...sentSMS].slice(0, 20));
  }, [sentSMS]);

  return (
    <Widget widgetName="Send SMS messages">
      <div className="py-3 w-full">
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">HexId</span>
          <input ref={hexIdInputEl} className="border border-black w-full"></input>
        </div>
        <div className="flex justify-around pt-2 text-xs">
          <span className="w-[66px]">Message</span>
          <textarea ref={messageTextareaEl} className="border border-black w-full"></textarea>
        </div>
        <div className="flex justify-end pt-2 text-xs">
          <button className="font-bold" type="button" onClick={sendMessage}>
            Send
          </button>
        </div>
        <div className="pt-2 text-xs">
          <span className="font-bold">Your messages</span>
          {sentSMS.length ? (
            sentSMS.map((sentSMS) => (
              <div className="pt-1" key={sentSMS.smsHexId}>
                <span className="font-bold pr-2">{sentSMS.to.slice(0, 6)}</span>
                <span>{sentSMS.text}</span>
              </div>
            ))
          ) : (
            <div className="py-2">- no SMS</div>
          )}
        </div>
      </div>
    </Widget>
  );
};
