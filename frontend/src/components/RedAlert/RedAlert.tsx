import { APP_VERSION } from "prfct-network-engine/consensus/constants";

export const RedAlert = () => (
  <div className="text-pink-600 text-xs border-t-0 p-2 border border-pink-600 text-center pb-1 mt-[-0.75rem] max-w-lg sm:mt-0 lg:ml-24  ">
    Our MVP is currently in beta testing and may experience some instability. <br />
    Use at your own discretion. Developer preview v.{APP_VERSION}
  </div>
);
