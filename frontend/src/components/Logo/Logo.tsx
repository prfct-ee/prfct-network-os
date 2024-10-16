import { FC, useCallback } from "react";

export interface LogoProps {
  grayscale?: Boolean;
}

export const Logo: FC<LogoProps> = ({ grayscale }) => {
  const onClickHandler = useCallback(() => (window.location.href = "https://prfct.ee"), []);
  return (
    <div
      onClick={onClickHandler}
      className="mt-5 mb-0 ml-5 text-3xl font-bold cursor-pointer sm:mb-5 sm:ml-0 sm:text-3xl"
      style={{ lineHeight: "0.6em" }}
    >
      <span
        className={`block w-3  break-all text-7xl sm:inline sm:text-3xl ${
          grayscale ? "text-gray-500" : "text-pink-600"
        }`}
        style={{ lineHeight: "0.45em" }}
      >
        ✱-
      </span>
      prfct.ee
    </div>
  );
};
