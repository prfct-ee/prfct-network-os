import { action } from "@storybook/addon-actions";
import { FC } from "react";
import { Widget } from "./Widget";

export const WidgetStory: FC = () => {
  return (
    <div className="flex-wrap sm:inline-flex">
      <Widget>Widget Content</Widget>
      <Widget className="bg-slate-300">Widget with custom class name</Widget>
      <Widget className="border-4 border-pink-500">Widget with custom class name</Widget>
    </div>
  );
};

export default {
  title: "PRFCT UI",
};
