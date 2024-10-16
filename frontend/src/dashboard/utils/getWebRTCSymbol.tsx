import { Message } from "prfct-network-engine/interfaces";

export const getWebRTCSymbol = (message: Message) => {
  const subType = message.data?.subtype;
  if (subType) {
    switch (subType) {
      case "status":
        return "s";
      case "welcome":
        return "w";
      case "invite":
        return "i";
      case "invite response":
        return "r";
      case "ice candidate":
        return "c";
      case "action":
        return "a";
      default:
        return subType[0];
    }
  }
  return message.type[0].toLowerCase();
};
