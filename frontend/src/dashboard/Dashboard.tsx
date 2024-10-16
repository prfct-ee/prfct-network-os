import { APP_VERSION } from "prfct-network-engine/consensus/constants";
import { BlockWatcherWidget } from "./widgets/BlockWatcherWidget";
import { ConnectionsTreeWidget } from "./widgets/ConnectionsTreeWidget";
import { DirtyPicassoLogWidget } from "./widgets/DirtyPicassoLogWidget";
import { GateLogsWidget } from "./widgets/GateLogsWidget";
import { IDE } from "./widgets/IDE";
import { IncomingIDFSWidget } from "./widgets/IncomingIDFSWidget";
import { IncomingWebRTCWidget } from "./widgets/IncomingWebRTCWidget";
import { KeysManagementWidget } from "./widgets/KeysManagementWidget";
import { MyPrfctWalletsWidget } from "./widgets/MyPrfctWalletsWidget/MyPrfctWalletsWidget";
import { OutcomingIDFSWidget } from "./widgets/OutcomingIDFSWidget";
import { OutcomingWebRTCWidget } from "./widgets/OutcomingWebRTCWidget";
import { ProxyWebRTCWidget } from "./widgets/ProxyWebRTCWidget";
import { RandomActionGeneratorWidget } from "./widgets/RandomActionGeneratorWidget";
import { ReceivedSMSMessagesWidget } from "./widgets/ReceivedSMSMessagesWidget";
import { SendSMSMessagesWidget } from "./widgets/SendSMSMessagesWidget";
import { SMSProtocolWidget } from "./widgets/SMSProtocolWidget";
import { SocketMessageWidget } from "./widgets/SocketMessageWidget";
import { StateTreeWidget } from "./widgets/StateTreeWidget/StateTreeWidget";
import { UserInfoWidget } from "./widgets/UserInfoWidget/UserInfoWidget";
import { WalletManagementWidget } from "./widgets/WalletManagementWidget";
import { WebRTCLogsWidget } from "./widgets/WebRTCLogsWidget";

export const Dashboard = () => {
  return (
    <div className="">
      App v.{APP_VERSION}
      <div className="flex-wrap sm:inline-flex">
        {/*<SendActionWidget />*/}
        <UserInfoWidget />
        <ConnectionsTreeWidget />
        {/* <ChartStateTreeWidget /> */}
        <IDE />
        <BlockWatcherWidget />
        <WalletManagementWidget />
        <MyPrfctWalletsWidget />
        <StateTreeWidget />
        <RandomActionGeneratorWidget />
        <OutcomingWebRTCWidget />
        <IncomingWebRTCWidget />
        <IncomingIDFSWidget />
        <OutcomingIDFSWidget />
        <KeysManagementWidget />
        <SendSMSMessagesWidget />
        <ReceivedSMSMessagesWidget />
        <ProxyWebRTCWidget />
        <SMSProtocolWidget />
        <SocketMessageWidget />
        {/* <NetworkStatusWidget /> */}
        {/* <ClientStatusWidget /> */}
        <DirtyPicassoLogWidget />
        <WebRTCLogsWidget />
        <GateLogsWidget />
      </div>
    </div>
  );
};
