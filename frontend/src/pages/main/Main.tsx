import { bestBlockStream, state } from "prfct-network-engine/consensus/consensus";
import { Block } from "prfct-network-engine/interfaces";
import { getState, NetworkState, subscribe } from "prfct-network-engine/state";
import { useEffect, useState } from "react";
import { Logo } from "../../components/Logo/Logo";
import "./Main.scss";
import gpt from "./gpt.png";
import meow from "./meow.png";
import alex from "./alex.jpg";
import mikhail from "./mikhail.jpg";
import { Dashboard } from "../../dashboard/Dashboard";
import { UserInfoWidget } from "../../dashboard/widgets/UserInfoWidget/UserInfoWidget";
import { RedAlert } from "../../components/RedAlert/RedAlert";
import { ConnectionsTreeWidget } from "../../dashboard/widgets/ConnectionsTreeWidget";
import { StateTreeWidget } from "../../dashboard/widgets/StateTreeWidget/StateTreeWidget";
import { SocketMessageWidget } from "../../dashboard/widgets/SocketMessageWidget";
import { IncomingWebRTCWidget } from "../../dashboard/widgets/IncomingWebRTCWidget";
import { OutcomingWebRTCWidget } from "../../dashboard/widgets/OutcomingWebRTCWidget";
import { BlockWatcherWidget } from "../../dashboard/widgets/BlockWatcherWidget";
import { ReceivedSMSMessagesWidget } from "../../dashboard/widgets/ReceivedSMSMessagesWidget";
import { SendSMSMessagesWidget } from "../../dashboard/widgets/SendSMSMessagesWidget";
import { MyPrfctWalletsWidget } from "../../dashboard/widgets/MyPrfctWalletsWidget/MyPrfctWalletsWidget";
import { WebRTCLogsWidget } from "../../dashboard/widgets/WebRTCLogsWidget";
import { GateLogsWidget } from "../../dashboard/widgets/GateLogsWidget";
import { KeysManagementWidget } from "../../dashboard/widgets/KeysManagementWidget";
import { SMSProtocolWidget } from "../../dashboard/widgets/SMSProtocolWidget";
import { Widget } from "../../components/Widget/Widget";
import { RandomActionGeneratorWidget } from "../../dashboard/widgets/RandomActionGeneratorWidget";
import YouTube from "react-youtube";
import { VideoLanding } from "../../components/VideoLanding/VideoLanding";

const isDashboardVisible = !!new URLSearchParams(window.location.search).get("dashboard");

export const Main = () => {
  const [networkState, useNetworkState] = useState<NetworkState>(getState());

  const [block, setBlock] = useState<Block>();

  useEffect(() => {
    subscribe(useNetworkState);
    bestBlockStream.on((block) => setBlock(block));
  }, []);

  return isDashboardVisible ? (
    <div className="text-sm p-5">
      <b>networkState</b>
      <pre className="m-5 pb-10">{JSON.stringify(networkState, null, 4)}</pre>
      <b>state</b>
      <pre className="m-5">{JSON.stringify(state, null, 4)}</pre>
      <b>block</b>
      <pre className="m-5">{JSON.stringify(block, null, 4)}</pre>
      <Dashboard />
      <RandomActionGeneratorWidget />
    </div>
  ) : (
    <div className="text-xs pt-5 sm:max-w-[640px] mr-10 lg:pl-24 lg:max-w-[840px]">
      <Logo />
      <div className="pt-4 pl-5 sm:p-0">Browser Native Blockchain Network</div>
      <div className="t-4 pl-5 pt-1 sm:p-0">A blockchain node in any browser without plugins</div>

      <div className="pt-8 text-sm">
        <div className=" border border-slate-200 border-dashed m-3 p-3 ml-0 mb-5 bg-slate-100">
          <div className="text-base italic pb-2">Hey ChatGPT, prepare a summary.</div>
          <div className="flex flex-wrap">
            <div className=" w-6 mr-2">
              <img src={gpt} className=" w-5 h-5 inline" />
            </div>
            <div className="flex-1">
              The Prfct Network is a native blockchain network designed for web browsers, enabling
              the creation of decentralized web applications with a user-friendly experience. The
              network uses a visual programming language based on JavaScript to create smart
              contracts and utilizes a unique method to determine message transmission routes
              between nodes. This allows for seamless communication between nodes and creates a
              platform for decentralized applications, free from censorship and central control.
            </div>
          </div>
        </div>
        <div className="header text-pink-600 pt-5 pb-4">Explainer video</div>
        <VideoLanding />
        <div className="header text-pink-600 pt-4">
          Interactive whitepaper{" "}
          <span className=" text-sm text-slate-600 font-normal ">v0.37fc</span>
        </div>
        <div className="header">0. Abstract</div>
        <div>
          Blockchain technology has transformed the way we transact and store information, bringing
          about immense advancements in the financial industry, social networks, and the internet as
          a whole. Despite these innovations, the average user is still struggling to adopt and make
          use of modern blockchain networks due to the complicated and technologically challenging
          interfaces they present. To truly make blockchain a mass technology, there is an urgent
          need to create a network that is <b>accessible to everyone</b>, regardless of technical
          proficiency. A network that is user-friendly, easy to use, and
          <b> does not require any additional plugins</b> or technical knowledge. Such a blockchain
          network will transform the internet, becoming a new and important layer of the digital
          world.
          <UserInfoWidget />
        </div>
        <div className="header">1. Introduction</div>
        The Prfct network is a next-generation blockchain platform that leverages the power of user
        browsers to create a highly accessible, secure, and efficient network. Utilizing{" "}
        <b>TypeScript </b>
        as the underlying programming language and <b>WebRTC</b> for peer-to-peer connections, this
        network is easily accessible through any browser. Unlike traditional blockchain networks,
        the Prfct network <b>only stores the current state of the network</b>, making it lightweight
        and efficient. This is accomplished through the use of a decentralized file storage system
        built on the Merkel Tree scheme, which securely stores important information such as wallet
        data, smart contracts, and network state elements. Additionally, the Prfct network features
        a unique protocol for sending encrypted instant messages. This protocol allows clients to
        find the shortest distance to send messages between nodes, without the need for a central
        server or knowledge of the network structure. This makes these messages completely secure
        and immune to censorship, providing users with a truly decentralized communication solution.
        With its user-friendly interface and cutting-edge technology, the Prfct network is poised to
        transform the world of blockchain and provide users with a truly accessible and secure
        platform for decentralized communication and transactions.
        <MyPrfctWalletsWidget />
        <div className="header">2. P2P Network</div>
        <div>
          WebRTC is a decentralized protocol that enables browsers to communicate directly without
          relying on central servers. It has become a widely used technology for video calls and
          data transfer. In order to identify users in the network, WebRTC employs an cryptographic
          signature based on the Ed25519 algorithm. Each blockchain node in the network has a unique
          pair of public and private keys, with the public key serving as the user's identifier.
          <ConnectionsTreeWidget />
          Nodes, also known as browsers, can also act as intermediaries for other clients, allowing
          them to connect to other nodes and disseminate transactions and blocks. To initiate
          connections, gateway servers are employed. These are streamlined socket.io servers that
          are deployed and managed by decentralized application owners. In situations where direct
          connections between browsers cannot be established, <b>
            community-driven TURN servers
          </b>{" "}
          are utilized to proxy traffic.
          <GateLogsWidget />
          <SocketMessageWidget />
        </div>
        <div className="header">3. Consensus </div>
        <div>
          Our consensus mechanism is a groundbreaking solution that sets itself apart from
          traditional blockchain algorithms. It is designed to be lightweight and minimalist,
          allowing for stable operation in an ever-changing network where clients constantly connect
          and disconnect. To minimize data volume and ensure network efficiency, the Prfct network
          only stores the current state, rather than storing every element indefinitely.
          <BlockWatcherWidget />
          The current state is stored in a structured, distributed file storage system, similar to a
          Merkel Tree, which consists of two types of elements: Routers and State Elements. Routers,
          as tree nodes, hold information about their layer in the tree, the hashes of their
          children, and the hashes of subsequent routers. An example of a router interface is as
          follows:
          <pre>
            {`
    export interface Router {
      layer: number;
      shift: number;
      routers: Record<string, string>;
      stateElements: StateElementInfo[];
      size: number;
      createdAt: number;
    }
          `}
          </pre>
          In a network, State Elements serve as objects that store data such as wallets, smart
          contracts, and their states. Each element has a unique feature, the "ttd" (time to death)
          parameter, which indicates the remaining lifespan of the element in terms of Time Points.
          When this number reaches zero, the element will be automatically removed from the network.
          State Elements have the ability to be split or merged with other elements, maintaining the
          overall number of Time Points. These Time Points can be obtained through various means,
          including as a reward for discovering a block or as a commission for hosting turn servers.
          Here's an example of a State Element interface:
          <pre>
            {`
    export interface StateElement {
      type: StateElementTypes;
      lookupKey: string;
      owner: string;
      ttd: number;
      createdAt: number;
      data: string;
    }
          `}
          </pre>
          In this network, blocks are not just a list of transactions, but rather a{" "}
          <b>hash of the root router tree</b>. During block calculation, nodes gather transactions
          from users, process them, and generate changes in the tree. Afterwards, network
          participants share the resulting root router hash and adopt the most widely accepted hash
          (block). A block is produced every 5 seconds, providing sufficient time for node clocks to
          synchronize. The consensus algorithm operates in two phases: the heating phase and the
          cooling phase.
          <StateTreeWidget />
          <p className="text-base italic pt-4">🔥 The Heating Stage:</p> During this stage, the node
          is engaged in processing all incoming transactions and altering the state tree as a
          result. Once this is done, it generates a new hash from the root router which it then
          forwards to all connected nodes as a block. The incoming blocks are compared to the
          current best block, taking into consideration factors such as the number of completed
          transactions and the balance of the creator's wallet. The block with the highest number of
          transactions and the highest creator balance has the greatest chance of being recognized
          as the best by the network and rewards are given. In the event that a better block
          emerges, it is disseminated to all connected nodes and a single best block is selected by
          the network. The user who finds the most widely accepted block is rewarded with Time
          Points, incentivizing them to keep their browser open for extended periods and
          guaranteeing network stability.
          <p className="text-base italic">🧊 The Cooling Stage:</p>
          In this stage, the network reaches a consensus as it is often not possible to select a
          single block for all network participants. During this stage, the nodes broadcast the hash
          of the root router and the most popular hash is selected. The popular hash is broadcasted
          again if its value does not match the previous one. This way the hash of the root router
          used as a basis for the next Heating stage is selected.
        </div>
        <OutcomingWebRTCWidget />
        <IncomingWebRTCWidget />
        <WebRTCLogsWidget />
        <div className="header">
          4. Smart contracts <span className=" text-sm text-slate-500">(in development)</span>
        </div>
        Smart contracts play a crucial role in the functioning of a blockchain network as they are
        the only way to make changes to the network's state tree. These contracts are stored in a
        decentralized storage system and can be invoked by users through transactions. In order to
        ensure a user-friendly experience, the programming language for smart contracts should be
        simple and accessible to individuals with limited technical backgrounds. To achieve this, we
        propose the use of a <b>visual programming language based on JavaScript</b>. This language
        is designed to be <b>functional and reactive</b>, making use of the concept of streams,
        which aligns well with the visual programming paradigm. The visual language interpreter is a
        standalone module that can be utilized for a wide range of purposes beyond just blockchain
        technology. In fact, it has the potential to be used as a{" "}
        <b>replacement for traditional JavaScript</b>. To ensure the creation of smart contracts is
        accessible to all, this visual programming language is designed to be as simple as possible.
        <Widget className="border-black">
          <div className="font-bold ">Visual Smart Contracts language - Prfct_JS</div>
          <img src={meow} className=" w-[400px] h-[390px]" />
        </Widget>
        <div className="header">5. Messenger protocol</div>
        The Prfct Network enables efficient communication between nodes by utilizing a unique
        approach to determining the route of message transmission. The system assesses a new
        connection's public key and selects neighboring nodes with the closest public keys, as
        calculated by the following formula:
        <br></br>
        <pre>
          {`
    export const getHexPosition = (hexid: string = "") =>
      parseInt(hexid.slice(0, maxPositionLength), 16);

    export const getHexDistance = (hexid1: string, hexid2: string) => {
      const position1 = getHexPosition(hexid1);
      const position2 = getHexPosition(hexid2);
      const distance1 = Math.abs(position1 - position2);
      const distance2 = Math.abs(position1 - maxPositionValue - position2);
      const distance3 = Math.abs(position1 + maxPositionValue - position2);
      return Math.min(distance1, distance2, distance3);
    };
        `}
        </pre>
        By utilizing this method, the node responsible for sending or forwarding a message selects
        the nearest node to the intended recipient, ensuring each transmission moves closer to its
        destination until it reaches its target or surpasses the transfer limit.
        <SendSMSMessagesWidget />
        <ReceivedSMSMessagesWidget />
        <SMSProtocolWidget />
        <div className="header">6. Conclusion.</div>
        The solution we propose is native blockchain network{" "}
        <b>specifically designed for web browsers</b>. This network paves the way for the creation
        of decentralized web applications that offer seamless and effortless user experience,
        similar to traditional web applications. With this network, social networks, multiplayer
        games, messaging platforms, and a multitude of other applications can now be fully
        decentralized, free from censorship and control by central authorities.
        <KeysManagementWidget />
      </div>
      <div className="pt-5 pb-5 text-sm">
        <div className="header text-pink-600 pb-2">About us</div>
        <div>
          <div className=" pt-2">
            <div className=" flex pb-4">
              <img src={mikhail} className=" w-24 h-24 p-2" />
              <div>
                <a
                  href="https://www.linkedin.com/in/mikhail-dunaev/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mikhail Dunaev
                </a>
                , the CTO of Prfct.ee, is utilizing his expertise in blockchain and crypto to lead
                the development of a browser-native blockchain solution that makes blockchain more
                accessible and user-friendly.
              </div>
            </div>
            <div className=" flex pb-4">
              <img src={alex} className=" w-24 h-24 p-2" />
              <div>
                <a
                  href="https://www.linkedin.com/in/amehhedenko/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Aleksandr Mehhedenko
                </a>{" "}
                is an experienced leader who helped establish TopConnect as a leading mobile network
                virtual operator in Estonia, and he rose to the rank of Engineering Operations
                Manager at Paxful, where he demonstrated his ability to lead cross-functional teams
                and drive innovation.
              </div>
            </div>
          </div>
          <div className="pt-4 pb-7">
            <a
              className="text-pink-600 hover:opacity-80 hover:underline font-bold"
              href="https://discord.gg/t3cDSRjuEB"
              target="_blank"
            >
              🚀 Join our Discord!
            </a>{" "}
            to receive free test tokens as soon as they become available.
          </div>
          Developed in 🇪🇪 Estonia by{" "}
          <a
            href="https://www.linkedin.com/company/prfct-ee/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Prfct OÜ
          </a>{" "}
          and funded by{" "}
          <a href="https://www.icebreaker.vc/" target="_blank" rel="noopener noreferrer">
            Icebreaker.vc
          </a>
        </div>
      </div>
    </div>
  );
};
