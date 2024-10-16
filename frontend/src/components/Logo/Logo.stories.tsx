import { ComponentMeta } from "@storybook/react";
import { Logo } from "./Logo";

export const LogoStory = () => (
  <div>
    <Logo />
    <Logo grayscale={true} />
  </div>
);

export default {
  title: "PRFCT UI",
} as ComponentMeta<typeof Logo>;
