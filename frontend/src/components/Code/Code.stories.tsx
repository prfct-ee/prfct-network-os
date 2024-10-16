import { action } from "@storybook/addon-actions";
import { FC } from "react";
import { Code } from "./Code";

export const CodeStory: FC = () => {
  return (
    <div>
      Block code example:
      <Code>setInterval(() = setMsec((new Date(2022, 2, 1) as any) - Date.now()), 137);</Code>
    </div>
  );
};

export default {
  title: "PRFCT UI",
};
