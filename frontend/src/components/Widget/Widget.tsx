import React, { FC } from "react";

interface WidgetProps {
  className?: string;
  widgetName?: string;
}
export const Widget: FC<WidgetProps> = ({ children, className = "", widgetName }) => {
  return (
    <div
      className={
        "flex-grow max-w-[400px] w-full sm:flex-grow-0 sm:p-3 p-2 overflow-hidden border border-slate-200 mt-5 bg-slate-100 " +
        className
      }
    >
      {widgetName && (
        <div className="flex justify-between w-full">
          <div className="font-bold">{widgetName}</div>
        </div>
      )}
      {children}
    </div>
  );
};
