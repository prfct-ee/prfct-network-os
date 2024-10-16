import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Widget } from "../../components/Widget/Widget";
import { SMSTypes } from "prfct-network-engine/interfaces";
import { onSignedMessage } from "prfct-network-engine/webrtc";

const FILTER_ITEMS: SMSTypes[] = [
  "SMS_TEXT",
  "SMS_PING",
  "SMS_JOIN_GROUP",
  "SMS_NEW_GROUP_USER",
  "SMS_CONFIRM",
  "SMS_LEAVE_GROUP",
];

interface SMSProtocolItem {
  timeout: number;
  milliseconds: number;
  from: string;
  type: SMSTypes;
  to: string;
}

let _smsProtocolList: SMSProtocolItem[] = [];

export const SMSProtocolWidget = () => {
  const [selectedTypes, setSelectedTypes] = useState<SMSTypes[]>([]);
  const [smsProtocolList, setSMSList] = useState<SMSProtocolItem[]>([]);
  const onFilterClick = useCallback(
    (type: SMSTypes) => () => {
      const newSelectedList = selectedTypes.includes(type)
        ? selectedTypes.filter((selectedType) => selectedType !== type)
        : [...selectedTypes, type];
      setSelectedTypes(newSelectedList);
    },
    [selectedTypes]
  );

  const filteredList = useMemo(
    () =>
      selectedTypes.length < 1
        ? smsProtocolList
        : smsProtocolList.filter((smsProtocol) => !selectedTypes.includes(smsProtocol.type)),
    [smsProtocolList, selectedTypes]
  );

  useEffect(() => {
    onSignedMessage((signedSMS) => {
      const sms = signedSMS?.raw;
      if (sms && sms.type === "SMS") {
        _smsProtocolList = [
          {
            timeout: new Date().getTime(),
            milliseconds: new Date().getMilliseconds(),
            from: sms.from.slice(0, 6),
            to: sms.to.slice(0, 6),
            type: sms.data.type,
          },
          ..._smsProtocolList,
        ].slice(0, 20);
        setSMSList(_smsProtocolList);
      }
    });
  }, []);

  return (
    <Widget widgetName="SMS protocol">
      <div className="flex flex-col w-full py-3 h-full justify-between">
        <div className="py-2">
          {filteredList.length > 0 ? (
            filteredList.map((item) => (
              <div className="flex pb-1 text-[12px]" key={`${item.from}-${item.timeout}`}>
                <span className="text-gray-500 pr-3 w-[36px] text-right">
                  {item.milliseconds || 0}
                </span>
                <span>{`${item.from} ⮕ ${item.type} ⮕ ${item.to}`}</span>
              </div>
            ))
          ) : (
            <span>- no SMS</span>
          )}
        </div>
        <div>
          <span className="font-bold text-sm">Filter:</span>
          <div className="flex-wrap inline-flex text-[12px]">
            {FILTER_ITEMS.map((type) => (
              <button
                key={type}
                onClick={onFilterClick(type)}
                className={`pr-3 ${selectedTypes.includes(type) ? "text-red-600 font-bold" : ""}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Widget>
  );
};
