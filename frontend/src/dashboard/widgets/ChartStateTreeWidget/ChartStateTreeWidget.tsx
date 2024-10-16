import { getRouterFromDB } from "prfct-network-engine/idfs/idfsDB";
import { useCallback, useEffect, useRef, useState } from "react";
import { Widget } from "../../../components/Widget/Widget";
import { getHashFromData } from "../../../network/crypto/crypto";
import { findPathToRouterInIDFS, onIDFSUpdate } from "../../../network/idfs/IDFS";
import {
  createCollapsibleTree,
  getHierarchy,
  TreeData,
  TreeTransform,
} from "../../d3/collapsibleTree";
import { constructTreeData, RoutersData } from "./constructTreeData";

const DEFAULT_TRANSFORM = { scale: 1, x: 10, y: 10 };
let _loadedPositions: RoutersData = {};

export const ChartStateTreeWidget = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [routers, setRouters] = useState<RoutersData>({});
  const [rootHexId, setRootRootHexId] = useState<string>();
  const [lostRouters, setLostRouters] = useState<string[]>([]);
  const [treeTransform, setTreeTransform] = useState<TreeTransform>(DEFAULT_TRANSFORM);

  const setRouterData = useCallback(
    (hexIds: string[], isAnimated?: boolean, restoreTree?: boolean) => {
      if (restoreTree) {
        Promise.all(
          Object.values(_loadedPositions).map((router) => {
            return findPathToRouterInIDFS("", router.layer, router.shift);
          })
        ).then((newRouters) => {
          const restoredRouters: RoutersData = {};
          newRouters
            .flatMap((routersList) => routersList)
            .forEach((newRouter) => {
              const position = `${newRouter.layer}/${newRouter.shift}`;
              const currentRouter = _loadedPositions[position];
              restoredRouters[position] = {
                ...newRouter,
                isAnimated: false,
                isCollapsed: currentRouter?.isCollapsed,
                hexid: getHashFromData(newRouter),
              };
            });

          setRouters(restoredRouters);
        });
        return;
      }

      const foundRouters = hexIds.map(getRouterFromDB);

      const currentRouters: RoutersData = {};
      Object.entries(routers).forEach(([position, router]) => {
        currentRouters[position] = { ...router, isAnimated: false };
      });

      foundRouters.forEach((foundRouter, index) => {
        const hexId = hexIds[index];
        if (!foundRouter) {
          setLostRouters([hexId, ...lostRouters]);
          return;
        }
        const layer = foundRouter?.layer || 0;
        const shift = foundRouter?.shift || 0;
        currentRouters[`${layer}/${shift}`] = {
          ...foundRouter,
          isAnimated: !!isAnimated,
          isCollapsed: false,
          hexid: hexId,
        };
      });

      _loadedPositions = currentRouters;
      setRouters(currentRouters);
    },
    [routers]
  );

  useEffect(() => {
    onIDFSUpdate((hexId) => {
      setRootRootHexId(hexId);
      setRouterData([hexId], false, true);
    });
  }, []);

  useEffect(() => {
    if (!routers || !wrapRef.current || !rootHexId) return;
    const { treeData, affectedRouters } = constructTreeData(routers, "0/0", rootHexId, lostRouters);
    const hierarchy = getHierarchy(treeData);
    createCollapsibleTree(
      hierarchy,
      wrapRef.current,
      clickRouterHandle,
      loadRouter,
      treeTransform,
      setTreeTransform
    );

    // Filter unaffected
    if (Object.keys(routers).length < Object.keys(affectedRouters).length) {
      setRouters(affectedRouters);
    }
  }, [routers]);

  const loadRouter = useCallback(
    (treeData: TreeData[], isAnimated?: boolean) => {
      const hexIdsByPositions: string[] = [];
      treeData.forEach((data) => {
        const router = routers[data.position];
        const isLost = lostRouters.find((lostId) => lostId === data.id);
        !router && !isLost && hexIdsByPositions.push(data.id);
      });
      hexIdsByPositions.length && setRouterData(hexIdsByPositions, isAnimated);
    },
    [routers]
  );

  const clickRouterHandle = useCallback(
    (position: string) => {
      const currentRouters: RoutersData = {};
      Object.entries(routers).forEach(([position, router]) => {
        currentRouters[position] = { ...router, isAnimated: false };
      });
      const clickedRouterData = currentRouters[position];
      currentRouters[position] = {
        ...clickedRouterData,
        isAnimated: true,
        isCollapsed: !clickedRouterData.isCollapsed,
      };
      setRouters({ ...currentRouters });
    },
    [routers]
  );

  const discardPosition = useCallback(() => {
    setTreeTransform(DEFAULT_TRANSFORM);
    const currentRouters: RoutersData = {};
    Object.entries(routers).forEach(([position, router]) => {
      currentRouters[position] = { ...router, isAnimated: false };
    });
    setRouters({ ...currentRouters });
  }, [routers]);

  return (
    <Widget widgetName="Chart state tree">
      <div className="flex flex-col w-full py-3 d3-tree overflow-hidden" ref={wrapRef}></div>
      <button className="font-bold" type="button" onClick={discardPosition}>
        DISCARD POSITION
      </button>
    </Widget>
  );
};
