import { NetworkState, getState, subscribe } from "prfct-network-engine";
import { useState } from "react";

export const usePrfctState = () => {
  const [state, setState] = useState<NetworkState>(getState());
  subscribe(setState);
  return state;
};
