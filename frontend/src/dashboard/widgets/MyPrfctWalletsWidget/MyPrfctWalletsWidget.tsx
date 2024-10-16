import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Widget } from "../../../components/Widget/Widget";
import { MyPrfctWalletsItem } from "./MyPrfctWalletsItem";
import { MyWallets, myWalletsStream } from "../../../network/idfs/myWallets";
import { Moon } from "../../../components/Moon/Moon";
import { Router, StateElement } from "prfct-network-engine/idfs/IDFS";
import { saveToDB } from "prfct-network-engine/idfs/idfsDB";

export interface MyPrfctWallet {
  hexId: string;
  ttd: number;
  size: number;
  lostCount: number;
}

export const MyPrfctWalletsWidget = () => {
  const [myWallets, setMyWallets] = useState<MyPrfctWallet[]>([]);

  const [isImportOpen, setImportOpen] = useState<boolean>(false);

  const pathTextareaEl = useRef<HTMLTextAreaElement>(null);

  const [pathText, setPath] = useState<string>("");

  const addPath = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setPath(event.target.value);
  }, []);

  const onSetPath = useCallback(() => {
    try {
      const path: (StateElement | Router)[] = JSON.parse(pathText);
      path.map((el) => saveToDB(el));
    } catch (error) {
      console.log("parse error");
    }
    pathTextareaEl.current && (pathTextareaEl.current.value = "");
  }, [pathText]);

  useEffect(() => {
    const mySavedWallets: MyPrfctWallet[] = [];
    setMyWallets(mySavedWallets);
    myWalletsStream.on((myWallets: MyWallets) => {
      const newMyWallets: MyPrfctWallet[] = [];
      myWallets.forEach((myWallet, hexId) => {
        newMyWallets.push({
          hexId,
          ttd: myWallet.ttd,
          size: myWallet.data?.length || 0,
          lostCount: 0,
        });
      });
      setMyWallets(newMyWallets.slice(0, 100));
    });
  }, []);

  return (
    <Widget widgetName="My Prfct Wallets">
      <div className="pt-3 pb-2 w-full text-xs overflow-y-auto max-h-[500px]">
        {myWallets.length ? (
          myWallets.map((wallet) => (
            <MyPrfctWalletsItem key={wallet.hexId} wallet={wallet} myWallets={myWallets} />
          ))
        ) : (
          <div className="pb-1">
            <div className="pb-4">
              <Moon />{" "}
              <span className="italic">Searching for a wallet in the network's state tree.</span>
            </div>
            There are no active wallets. You can request free test tokens on our{" "}
            <a href="https://discord.gg/SUJyQjSV">Discord server</a>, or{" "}
            <a
              href="#"
              onClick={() => {
                setImportOpen(!isImportOpen);
              }}
            >
              import
            </a>{" "}
            them from a wallet JSON file.
            {isImportOpen && (
              <div className="pt-4">
                <textarea
                  ref={pathTextareaEl}
                  className="border border-slate-200 w-full p-2 h-[75px]"
                  onChange={addPath}
                ></textarea>
                <div className="font-bold cursor-pointer" onClick={onSetPath}>
                  Add Wallet
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Widget>
  );
};
