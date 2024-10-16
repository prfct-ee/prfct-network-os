import React, { FC } from "react";
import { Code } from "../../../components/Code/Code";

interface UserInfoNodeProps {
  id: string;
  onClick?: () => void;
}

export const UserInfoNode: FC<UserInfoNodeProps> = ({ id, onClick }) => {
  return (
    <div className="inline-block mr-2 mb-1 select-none ">
      <span onClick={onClick}>
        <Code className="px-2 text-[14px]">{id.slice(0, 6)}</Code>
      </span>
    </div>
  );
};
