import { FC } from "react";

interface ButtonProps {
  onClick?: () => void;
}
export const Button: FC<ButtonProps> = ({ children, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="inline-block w-auto px-4 py-1 text-sm transition-colors border border-black cursor-pointer select-none hover:bg-black hover:text-white hover:border-white"
    >
      {children}
    </div>
  );
};
