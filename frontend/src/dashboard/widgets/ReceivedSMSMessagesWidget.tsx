import { decryptFrom } from "prfct-network-engine/crypto/crypto";
import { onNewSmsMessage } from "prfct-network-engine/webrtc";
import { useEffect, useState } from "react";
import { Widget } from "../../components/Widget/Widget";

interface ReceivedSMSData {
  from: string;
  text: string;
  time: number;
}

let _receivedSMSList: ReceivedSMSData[] = [];

export const ReceivedSMSMessagesWidget = () => {
  const [receivedSMSList, setReceivedSMSList] = useState<ReceivedSMSData[]>([]);

  useEffect(() => {
    onNewSmsMessage((signedSMS) => {
      const sms = signedSMS?.raw;
      if (sms && sms.type === "SMS" && sms.data.type === "SMS_TEXT") {
        const smsContent = JSON.parse(decryptFrom(sms.from, sms.data.content));
        _receivedSMSList = [
          {
            from: sms.from,
            text: smsContent.text,
            time: new Date().getTime(),
          },
          ..._receivedSMSList,
        ].slice(0, 20);
        setReceivedSMSList(_receivedSMSList);
      }
    });
  }, []);

  return (
    <Widget widgetName="Received SMS messages">
      <div className="py-5 w-full text-xs">
        {receivedSMSList.length ? (
          receivedSMSList.map((receivedSMS) => (
            <div className="pt-1" key={receivedSMS.time}>
              <span className="font-bold pr-2">{receivedSMS.from.slice(0, 6)}</span>
              <span>{receivedSMS.text}</span>
            </div>
          ))
        ) : (
          <div className="py-2">- no SMS</div>
        )}
      </div>
    </Widget>
  );
};
