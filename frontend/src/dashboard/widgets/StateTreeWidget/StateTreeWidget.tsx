import { selectedColdMessagesStream, state } from "prfct-network-engine/consensus/consensus";
import {
  getHashFromData,
  getHexPosition,
  maxPositionValue,
} from "prfct-network-engine/crypto/crypto";
import {
  findPathToElementInIDFS,
  numElementsInRouter,
  onIDFSUpdate,
  Router,
  StateElement,
} from "prfct-network-engine/idfs/IDFS";
import { getElementFromDB, getRouterFromDB } from "prfct-network-engine/idfs/idfsDB";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Widget } from "../../../components/Widget/Widget";
import { ttdToTimePoints } from "../../../network/consensus/utils";
import "../Widgets.scss";
import { StateTreePopup } from "./StateTreePopup";

export const StateTreeWidget = () => {
  const [rootHexId, setRoot] = useState<string>("");
  const [shownPosition, setShownPosition] = useState<[number, number]>([0, 0]);

  const onResetHandler = useCallback(() => {
    localStorage.removeItem("prfct-root-node");
    window.location.reload();
  }, []);
  useEffect(() => {
    selectedColdMessagesStream.on((message) => {
      setRoot(getHashFromData(message.rootRouter));
    });
  }, []);

  return (
    <Widget widgetName="State Tree | IDFS" className="relative overflow-visible">
      {/* <div className="cursor-pointer select-none text-xs" onClick={onResetHandler}>
        reset
      </div> */}
      Interdimensional File System Local Storage
      <SimpleRouter routerHexid={rootHexId} />
    </Widget>
  );
};

interface SimpleRouterProps {
  routerHexid: string;
}

const SimpleRouter = ({ routerHexid }: SimpleRouterProps) => {
  const router = getRouterFromDB(routerHexid);
  return (
    <div
      className={`text-xs border border-slate-100 hover:border-slate-400 pl-4 m-1 mb-0 ${
        router ? "text-slate-600" : "text-slate-200 line-through"
      }`}
    >
      <span className=" text-slate-300">
        {router && router.layer}/{router?.shift}
      </span>
      <span> {routerHexid.slice(0, 6)}</span>
      {router &&
        router.layer < 3 &&
        router.stateElements.map((elementInfo) => {
          const element = getElementFromDB(elementInfo?.hexId);
          return (
            <span
              key={elementInfo.hexId + state.blockNumber}
              className={`pl-1 cursor-pointer select-none ${
                element ? "text-slate-400" : "text-slate-200 line-through"
              } ${element && state.blockNumber - element.createdAt < 2 ? "font-bold" : ""}`}
              onClick={() => {
                if (!element) return;

                console.log("Path:");
                const path: (Router | StateElement)[] = findPathToElementInIDFS(elementInfo?.hexId);
                path.push(element);
                console.log(path);

                navigator.clipboard
                  .writeText(JSON.stringify(path))
                  .then(() => console.warn("Path copied to clipboard"));
              }}
            >
              {elementInfo.hexId.slice(0, 4)}
            </span>
          );
        })}
      <div>
        {Object.values(router?.routers || {}).map((hexid) => (
          <SimpleRouter key={hexid + state.blockNumber} routerHexid={hexid} />
        ))}
      </div>
    </div>
  );
};

interface RouterListProps {
  router: Router;
  className?: string;
  shownPosition: [number, number];
  setShownPosition: (shownPosition: [number, number]) => void;
}
const RouterList = ({ router, className, shownPosition, setShownPosition }: RouterListProps) => {
  return (
    <div className={className}>
      {Object.keys(router?.routers || [])
        .sort((a, b) => parseInt(a.split("/")[1]) - parseInt(b.split("/")[1]))
        .map((position, i) => (
          <RouterComponent
            key={i}
            hexid={router?.routers[position] || ""}
            shownPosition={shownPosition}
            setShownPosition={setShownPosition}
          />
        ))}
    </div>
  );
};

interface RouterProps {
  hexid: string;
  shownPosition: [number, number];
  setShownPosition: (shownPosition: [number, number]) => void;
}
const RouterComponent = ({ hexid, shownPosition, setShownPosition }: RouterProps) => {
  const [router, setRouter] = useState<Router>();
  const [shownLayer, shownShift] = shownPosition;
  useEffect(() => {
    let isActive = true;
    const _router = getRouterFromDB(hexid);
    isActive && setRouter(_router);
    return () => {
      isActive = false;
    };
  }, []);

  const onClickOnStateElement = useCallback(
    (hexid: string) => () => {
      navigator.clipboard.writeText(hexid);
    },
    []
  );

  const onClickOnRouter = useCallback(
    (event: any) => {
      event.stopPropagation();
      console.log(router?.layer, router?.shift);
      setShownPosition([router?.layer || 0, router?.shift || 0]);
    },
    [router]
  );

  const isShowRouter = useMemo(() => {
    return (
      (router?.layer === shownLayer && router?.shift == shownShift) ||
      (router?.layer === shownLayer + 1 &&
        router?.shift >= shownShift * numElementsInRouter &&
        router?.shift < (shownShift + 1) * numElementsInRouter)
    );
  }, [shownPosition, router]);

  const shouldShowBackButton = useMemo(
    () =>
      !isShowRouter &&
      router?.layer === shownLayer - 1 &&
      Math.floor(shownShift / numElementsInRouter) === router?.shift,
    [isShowRouter, router, shownLayer, shownShift]
  );

  const shouldShowDeepNextButton = useMemo(
    () =>
      isShowRouter && router && router.layer > shownLayer && Object.keys(router.routers).length > 0,
    [isShowRouter, router, shownLayer]
  );

  if (router) {
    const totalElementsInLayer = numElementsInRouter ** (router?.layer - 1) * numElementsInRouter;
    const routerLength = maxPositionValue / totalElementsInLayer;

    return (
      <div
        className={
          isShowRouter ? "text-xs border border-slate-150 p-1 px-2 m-1 hover:border-slate-500" : ""
        }
      >
        {shouldShowBackButton && (
          <div className="font-bold cursor-pointer" onClick={onClickOnRouter}>
            {"<--"}
          </div>
        )}

        <>
          {isShowRouter ? (
            <div>
              <div>
                <b>
                  {router?.layer}/{router?.shift}_<span>{router.size}</span>
                </b>{" "}
                {short(router?.shift * routerLength)}/
                {short(router?.shift * routerLength + routerLength)}
                <span
                  className=" text-slate-400 ml-2 hover:bg-slate-300"
                  onClick={onClickOnStateElement(hexid)}
                >
                  {hexid.slice(0, 6)}
                </span>
              </div>
              <div>
                {router.stateElements.map((elementInfo) => (
                  <StateElementComponent key={elementInfo.hexId} hexid={elementInfo.hexId} />
                ))}
              </div>
              <RouterList
                className="ml-6"
                router={router}
                shownPosition={shownPosition}
                setShownPosition={setShownPosition}
              />
            </div>
          ) : (
            <RouterList
              router={router}
              shownPosition={shownPosition}
              setShownPosition={setShownPosition}
            />
          )}
        </>

        {shouldShowDeepNextButton && (
          <div className="font-bold cursor-pointer" onClick={onClickOnRouter}>
            {"-->"}
          </div>
        )}
      </div>
    );
  } else {
    return (
      <div className="text-xs border border-slate-150 p-1 px-2 m-1 hover:border-slate-500 slow">
        ..
      </div>
    );
  }
};

interface StateElementComponentProps {
  hexid: string;
}
const StateElementComponent = ({ hexid }: StateElementComponentProps) => {
  const [element, setElement] = useState<StateElement>();
  const [shownElementData, setShownElementData] = useState<Boolean>();

  useEffect(() => {
    let isActive = true;
    // findStateElementInIDFS_DB(hexid).then((el) => isActive && setElement(el));
    setElement(getElementFromDB(hexid));
    return () => {
      isActive = false;
    };
  }, [hexid]);

  const onFocusStateElement = useCallback(() => {
    setShownElementData(true);
  }, []);

  const onBlurStateElement = useCallback(() => {
    setShownElementData(false);
  }, []);

  const timePoints = useMemo(
    () =>
      element ? ttdToTimePoints(element.ttd, element.data?.length || 64, state.blockNumber) : 0,
    [element, state.blockNumber]
  );

  return element ? (
    <div
      key={hexid}
      className=" text-xs mr-3 cursor-pointer select-none"
      onFocus={onFocusStateElement}
      onBlur={onBlurStateElement}
    >
      ~{short(getHexPosition(hexid))} 
      <span className="text-slate-400 hover:bg-slate-300" tabIndex={1}>
        <span className="pr-1">id:{hexid.slice(0, 4)}</span>
        {shownElementData && <StateTreePopup element={{ hexid, ...element }} />}
      </span>
      <span className={timePoints >= 0 ? "text-slate-500" : "text-red-600"}>
        {element.ttd - state.blockNumber}
      </span>
       {element.owner.slice(0, 4)}
    </div>
  ) : (
    <div key={hexid} className=" text-red-500 pr-2">
      ~pos:{short(getHexPosition(hexid))}| id:{hexid.slice(0, 3)}
    </div>
  );
};

const short = (num: number) => Math.floor(num / 1000);
