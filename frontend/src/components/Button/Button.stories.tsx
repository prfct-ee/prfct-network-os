import { ComponentMeta } from "@storybook/react";
import { action } from "@storybook/addon-actions";
import { Button } from "./Button";

export const ButtonStory = () => {
  const callback = action("Button Click");
  return (
    <div>
      <Button onClick={callback}> Click me! </Button>
    </div>
  );
};

export default {
  title: "PRFCT UI",
} as ComponentMeta<typeof Button>;
