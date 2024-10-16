import React, { useCallback, useMemo, useState } from "react";
import { Router, StateElement } from "../../network/idfs/IDFS";

export enum IDFSItemType {
  Router,
  Element,
}

const FILTER_ITEMS: IDFSItemType[] = [IDFSItemType.Element, IDFSItemType.Router];

interface RouterItem {
  type: IDFSItemType.Router;
  data: Router;
}

interface ElementItem {
  type: IDFSItemType.Element;
  data: StateElement;
}

export type IDFSItem = { hexId: string; milliseconds: number; from: string; to: string } & (
  | RouterItem
  | ElementItem
);

export const IDFSWidgetContent = ({ idfsItemList }: { idfsItemList: IDFSItem[] }) => {
  const [selectedTypes, setSelectedTypes] = useState<IDFSItemType[]>([]);
  const onFilterClick = useCallback(
    (type: IDFSItemType) => () => {
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
        ? idfsItemList
        : idfsItemList.filter((idfsItem) => !selectedTypes.includes(idfsItem.type)),
    [idfsItemList, selectedTypes]
  );

  return (
    <div className="flex flex-col w-full py-3 h-full justify-between">
      <div className="py-2">
        {filteredList.length > 0 ? (
          filteredList.map((item) => (
            <div className="flex pb-1 text-[12px]" key={`${item.hexId}`}>
              <span className="text-gray-500 pr-3 w-[36px] text-right">
                {item.milliseconds || 0}
              </span>
              <span>{`${item.from} ⮕ (${
                item.type === IDFSItemType.Router ? "R" : "S"
              }) ${item.hexId.slice(0, 6)} ⮕ ${item.to}`}</span>
            </div>
          ))
        ) : (
          <span>- no updates</span>
        )}
      </div>
      <div>
        <span className="font-bold text-sm pr-1">Filter:</span>
        <div className="flex-wrap inline-flex text-[12px]">
          {FILTER_ITEMS.map((type) => (
            <button
              key={type}
              onClick={onFilterClick(type)}
              className={`pr-3 ${selectedTypes.includes(type) ? "text-red-600 font-bold" : ""}`}
            >
              {type === IDFSItemType.Router ? "Router" : "State"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
