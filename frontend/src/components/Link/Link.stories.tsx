import { action } from "@storybook/addon-actions";
import { FC } from "react";

export const AnchorStory: FC = () => {
  const callback = action("Button Click");
  return (
    <div>
      Lorem ipsum dolor sit amet,{" "}
      <a href="https://prfct.ee" target="_blank">
        consectetur
      </a>{" "}
      adipiscing elit. Proin vestibulum egestas orci eu feugiat. Nulla in urna consequat, ultrices
      massa sagittis, luctus massa. Fusce bibendum sem maximus,{" "}
      <a href="https://prfct.ee" target="_blank">
        consequat quam
      </a>{" "}
      non, posuere enim. Ut facilisis ullamcorper porttitor. Proin sollicitudin metus vitae magna
      dictum, <a onClick={callback}>WITH CALLBACK</a> tortor accumsan.
    </div>
  );
};

export default {
  title: "PRFCT UI",
};
