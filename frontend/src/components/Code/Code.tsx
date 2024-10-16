import { FC } from "react";

interface CodeProps {
  className?: string;
}
export const Code: FC<CodeProps> = ({ children, className = "" }) => (
  <div className={`inline p-[2px] text-sm break-all border border-slate-300 ${className}`}>
    {children}
  </div>
);
