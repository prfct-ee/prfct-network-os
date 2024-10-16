import React, { useEffect, useState } from "react";
import { Widget } from "../../components/Widget/Widget";
import { getHashFromData } from "../../network/crypto/crypto";
import { onOwnIDFSMessage } from "../../network/network";
import {
  IDFSItem,
  IDFSItemType,
  IDFSWidgetContent,
} from "../../components/IDFSWidget/IDFSWidgetContent";

let _idfsItemList: IDFSItem[] = [];

export const OutcomingIDFSWidget = () => {
  const [idfsItemList, setIDFSItemList] = useState<IDFSItem[]>([]);

  useEffect(() => {
    const addIDFSItem = (newItem: IDFSItem) => {
      if (_idfsItemList.every((item) => newItem.hexId !== item.hexId)) {
        _idfsItemList = [newItem, ..._idfsItemList].slice(0, 20);
        setIDFSItemList(_idfsItemList);
      }
    };

    onOwnIDFSMessage((signedSMS) => {
      const sms = signedSMS?.raw;
      if (sms && sms.type === "IDFS") {
        const itemType = sms.data.stateElements ? IDFSItemType.Router : IDFSItemType.Element;
        addIDFSItem({
          data: sms.data,
          hexId: getHashFromData(sms.data),
          type: itemType,
          milliseconds: new Date().getMilliseconds(),
          from: sms.from.slice(0, 6),
          to: sms.to.slice(0, 6),
        });
      }
    });
  }, []);

  return (
    <Widget widgetName="Outcoming IDFS">
      <IDFSWidgetContent idfsItemList={idfsItemList} />
    </Widget>
  );
};
