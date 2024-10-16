import { StateElement } from "prfct-network-engine/idfs/IDFS";
import "../Widgets.scss";

interface StateTreePopupProps {
  element: StateElement & { hexid: string };
}

export const StateTreePopup = ({ element }: StateTreePopupProps) => {
  const onClickStateData = (data: string) => () => navigator.clipboard.writeText(data);

  return (
    <div className="left-0 text-gray-900 absolute w-full px-7">
      <div className="relative bg-slate-50 border border-slate-500">
        <div className="absolute p-2 top-0 right-0" tabIndex={1}>
          ✕
        </div>
        <div className="flex flex-col pt-5 p-3">
          {Object.entries(element).map(([key, value]) => {
            return (
              <div key={key} className="flex">
                <span className="font-bold min-w-[50px]">{key}</span>
                <span className="break-all hover:bg-slate-300" onClick={onClickStateData(value)}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
