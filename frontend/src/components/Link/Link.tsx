import { useCallback } from "@storybook/addons";
import { FC } from "react";

interface LinkProps {
  href?: string;
  callback?: (event: React.MouseEvent) => void;
  target?: "_blank" | "_self";
}

export const Link: FC<LinkProps> = ({ children, href, target = "self", callback }) => {
  return (
    <a
      href={href}
      onClick={callback}
      target={target}
      className="text-pink-600 cursor-pointer hover:text-pink-500 hover:underline"
    >
      {children}
    </a>
  );
};
